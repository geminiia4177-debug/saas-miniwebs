import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs"; // <- IMPORTANTE: El cerrajero que encripta la clave

// ── GET: OBTENER TODOS LOS NEGOCIOS (Para tu Panel Admin CRM) ──
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subdomain = url.searchParams.get("subdomain");

    if (subdomain) {
      const business = await prisma.business.findFirst({
        where: {
          OR: [
            { subdomain: subdomain },
            { customDomain: subdomain }
          ]
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          type: true
        }
      });
      if (!business) {
        return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
      }
      return NextResponse.json(business);
    }

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";
    const statusFilter = url.searchParams.get("status") || "all";

    const whereClause: any = {};
    if (statusFilter !== "all") {
      whereClause.status = statusFilter;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [businesses, total, allStatusCounts, revenueSum, allDates] = await Promise.all([
      prisma.business.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.business.count({ where: whereClause }),
      prisma.business.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.business.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { paymentAmount: true }
      }),
      prisma.business.findMany({
        select: { createdAt: true }
      })
    ]);

    // Chart data (últimos 6 meses)
    const monthCounts: Record<string, number> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = past.toLocaleDateString("es-AR", { month: "short" });
      monthCounts[label] = 0;
    }
    allDates.forEach(b => {
      const l = new Date(b.createdAt).toLocaleDateString("es-AR", { month: "short" });
      if (monthCounts[l] !== undefined) monthCounts[l]++;
    });

    const stats = {
      all: total,
      ACTIVE: allStatusCounts.find(s => s.status === 'ACTIVE')?._count.id || 0,
      DEMO: allStatusCounts.find(s => s.status === 'DEMO')?._count.id || 0,
      BLOCKED: allStatusCounts.find(s => s.status === 'BLOCKED')?._count.id || 0,
      revenue: revenueSum._sum.paymentAmount || 0,
      chartData: Object.entries(monthCounts).map(([month, count]) => ({ month, count }))
    };

    return NextResponse.json({ data: businesses, total, stats });
  } catch (error) {
    console.error("Error obteniendo negocios:", error);
    return NextResponse.json({ error: "Error al cargar los datos" }, { status: 500 });
  }
}

// ── POST: CREAR UN NEGOCIO DESDE EL ADMIN ──
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await req.json();
    const { name, subdomain, email, customDomain } = data;

    // Exigimos que haya un email para poder crearle la cuenta al cliente
    if (!name || !subdomain || !email) {
      return NextResponse.json({ error: "Nombre, subdominio y email son obligatorios" }, { status: 400 });
    }

    const cleanSubdomain = subdomain.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.business.findUnique({
      where: { subdomain: cleanSubdomain }
    });

    if (existing) {
      return NextResponse.json({ error: "El link elegido ya está en uso" }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────
    // LA MAGIA: CREAR EL USUARIO DEL CLIENTE CON CLAVE "admin"
    // ─────────────────────────────────────────────────────────
    let clientUser = await prisma.user.findUnique({
      where: { email: email }
    });

    // Si no existe el usuario, lo creamos y le encriptamos la clave "admin"
    if (!clientUser) {
      const hashedPassword = await bcrypt.hash("admin", 10); 
      
      clientUser = await prisma.user.create({
        data: {
          email: email,
          name: name,
          password: hashedPassword, 
        }
      });
    }

    // Diseño por defecto
    const defaultLayoutConfig = {
      sections: [
        { id: "hero", label: "Hero / Portada", icon: "image", visible: true, config: { title: `Bienvenido a ${name}`, subtitle: "Tu negocio premium", ctaText: "Reservar Turno" } },
        { id: "services", label: "Servicios", icon: "star", visible: true, config: { items: [] } },
        { id: "gallery", label: "Galería de Fotos", icon: "image", visible: true, config: { columns: 3 } },
        { id: "contact", label: "Contacto", icon: "link", visible: true, config: {} }
      ],
      media: []
    };

    // Limpiar el customDomain si lo envían (quitar http, https, espacios)
    const cleanCustomDomain = customDomain 
      ? customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim() 
      : null;

    // Creamos el negocio y lo vinculamos al usuario que creamos arriba
    const newBusiness = await prisma.business.create({
      data: {
        name: name,
        subdomain: cleanSubdomain,
        customDomain: cleanCustomDomain,
        email: email,
        phone: data.phone || null,
        description: data.description || null,
        type: data.type || "general",
        status: data.status || "TRIAL",
        paymentAmount: Number(data.paymentAmount) || 0,
        paymentStatus: data.paymentStatus || "pending",
        primaryColor: "#6366f1",
        secondaryColor: "#a855f7",
        fontFamily: "sans",
        layoutConfig: defaultLayoutConfig,
        userId: clientUser.id, // ¡Acá se unen el cliente y su negocio!
      },
    });

    return NextResponse.json(newBusiness, { status: 201 });
  } catch (error) {
    console.error("Error creando negocio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}