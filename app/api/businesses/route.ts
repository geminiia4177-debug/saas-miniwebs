import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BusinessStatus, PaymentStatus, BusinessType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import crypto from "crypto";
import bcrypt from "bcryptjs"; // <- IMPORTANTE: El cerrajero que encripta la clave
import { businessSchema } from "@/lib/validations";
import { toSafeBusinessDTO } from "@/lib/dtos";
import { BUSINESS_THEMES } from "@/lib/themes";

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
      return NextResponse.json(toSafeBusinessDTO(business));
    }

    const { session, error: authError } = await requireAdmin();
    if (authError) return authError;

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
      // SEC-042: Performance fix — only fetch dates from the last 6 months
      prisma.business.findMany({
        where: { createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } },
        select: { createdAt: true }
      })
    ]);

    // Chart data (últimos 6 meses)
    const monthCounts: Record<string, number> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = past.toLocaleDateString("es-MX", { month: "short" });
      monthCounts[label] = 0;
    }
    allDates.forEach(b => {
      const l = new Date(b.createdAt).toLocaleDateString("es-MX", { month: "short" });
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

    const safeBusinesses = businesses.map(b => toSafeBusinessDTO(b, false));
    return NextResponse.json({ data: safeBusinesses, total, stats });
  } catch (error) {
    console.error("Error obteniendo negocios:", error);
    return NextResponse.json({ error: "Error al cargar los datos" }, { status: 500 });
  }
}

// ── POST: CREAR UN NEGOCIO DESDE EL ADMIN ──
export async function POST(req: Request) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) return authError;

    const rawData = await req.json();
    const parseResult = businessSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parseResult.error.format() }, { status: 400 });
    }
    const data = parseResult.data;
    
    const { name, subdomain, email, customDomain } = data;
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
    // P0-003: Crear o actualizar usuario con clave inicial segura
    // ─────────────────────────────────────────────────────────
    let clientUser = await prisma.user.findUnique({
      where: { email: email }
    });

    let temporaryPassword: string | null = null;

    if (!clientUser) {
      // Usar contraseña provista por admin o generar una clave segura aleatoria
      temporaryPassword = data.initialPassword?.trim() || crypto.randomBytes(9).toString("base64url");
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      
      clientUser = await prisma.user.create({
        data: {
          email: email,
          name: name,
          password: hashedPassword,
          mustChangePassword: true,
        }
      });
    } else if (data.initialPassword?.trim()) {
      // Si el usuario ya existía y el admin indicó una contraseña inicial explícita
      temporaryPassword = data.initialPassword.trim();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
      clientUser = await prisma.user.update({
        where: { id: clientUser.id },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
          failedLoginCount: 0,
          sessionVersion: { increment: 1 }
        }
      });
    }

    // Diseño por defecto y Perfil Visual según Rubro
    const typeKey = (data.type || "general") as keyof typeof BUSINESS_THEMES;
    const themeProfile = BUSINESS_THEMES[typeKey] || BUSINESS_THEMES.general;

    const isTienda = typeKey === "tienda";

    const defaultLayoutConfig: any = {
      sections: [
        { id: "hero", label: "Hero / Portada", icon: "image", visible: true, config: { title: `Bienvenido a ${name}`, subtitle: isTienda ? "Tu tienda online" : "Tu negocio premium", ctaText: isTienda ? "Ver Catálogo" : "Reservar Turno" } },
        { id: "services", label: isTienda ? "Productos" : "Servicios", icon: "star", visible: true, config: { items: [] } },
        { id: "gallery", label: "Galería de Fotos", icon: "image", visible: true, config: { columns: 3 } },
        { id: "contact", label: "Contacto", icon: "link", visible: true, config: {} }
      ],
      media: [],
      themeVariant: isTienda ? "tienda" : "modern"
    };

    if (isTienda) {
      defaultLayoutConfig.tiendaBannerPromo = "¡Envío gratis en compras seleccionadas! 🎉";
      defaultLayoutConfig.tiendaCategorias = ["Indumentaria", "Calzado", "Accesorios", "Destacados"];
      defaultLayoutConfig.tiendaProductos = [
        {
          id: "prod-demo-1",
          nombre: "Remera Oversize Signature",
          precio: 14999,
          descripcion: "Remera de algodón peinado 100% premium, corte relajado y máxima comodidad.",
          imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
          categoria: "Indumentaria",
          talles: ["S", "M", "L", "XL"],
          colores: ["Negro", "Blanco", "Gris"],
          stock: 25,
          destacado: true,
          activo: true,
        },
        {
          id: "prod-demo-2",
          nombre: "Zapatillas Urban Classic",
          precio: 38999,
          descripcion: "Diseño moderno con suela ergonómica antideslizante, ideales para el uso diario.",
          imagen: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
          categoria: "Calzado",
          talles: ["39", "40", "41", "42", "43"],
          colores: ["Blanco", "Negro"],
          stock: 12,
          destacado: true,
          activo: true,
        },
        {
          id: "prod-demo-3",
          nombre: "Gorra Trucker Vintage",
          precio: 8500,
          descripcion: "Gorra con bordado de alta calidad y broche ajustable posterior.",
          imagen: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
          categoria: "Accesorios",
          talles: ["Único"],
          colores: ["Negro", "Azul Marino"],
          stock: 30,
          destacado: false,
          activo: true,
        }
      ];
      defaultLayoutConfig.tiendaEnvios = {
        costoEnvio: 2500,
        envioGratisDesde: 30000,
        permitirRetiro: true,
        permitirEnvio: true,
        textoEnvio: "Envíos a todo el país (2 a 4 días hábiles) y retiro en sucursal",
        direccionRetiro: "",
        horarioRetiro: "Lunes a Viernes de 10:00 a 19:00"
      };
      defaultLayoutConfig.tiendaPagos = {
        acordarVendedor: true,
        instruccionesAcordar: "Coordinamos el pago por WhatsApp en efectivo o transferencia bancaria.",
        mercadoPago: { enabled: false, paymentLink: "", alias: "" },
        stripe: { enabled: false, paymentLink: "" },
        paypal: { enabled: false, meLink: "" }
      };
    }

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
        type: typeKey as BusinessType,
        status: (data.status || "TRIAL") as BusinessStatus,
        paymentAmount: Number(data.paymentAmount) || 0,
        paymentStatus: (data.paymentStatus || "pending") as PaymentStatus,
        primaryColor: themeProfile.accent,
        secondaryColor: themeProfile.bg,
        fontFamily: themeProfile.fontDisplay.includes("sans") ? "sans" : "serif",
        layoutConfig: defaultLayoutConfig,
        publishedConfig: defaultLayoutConfig,
        userId: clientUser.id, // ¡Acá se unen el cliente y su negocio!
      },
    });

    return NextResponse.json({
      ...toSafeBusinessDTO(newBusiness),
      ...(temporaryPassword ? { initialPassword: temporaryPassword } : {})
    }, { status: 201 });
  } catch (error) {
    console.error("Error creando negocio:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}