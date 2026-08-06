import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Función ninja para evitar que las fechas exploten
const parseDate = (d: any) => {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date;
};

// ── GET: OBTENER UN NEGOCIO ──
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({
      where: { id: id },
      select: { layoutConfig: true }
    });
    return NextResponse.json(business);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener" }, { status: 500 });
  }
}

// ── PUT: EDITAR UN NEGOCIO ──
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Esperamos a que Next.js nos desempaquete el ID
    const { id } = await params;
    
    // VERIFICACIÓN DE PROPIEDAD (IDOR FIX)
    const existingBusiness = await prisma.business.findUnique({ where: { id } });
    if (!existingBusiness) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const isAdmin = (session.user as any).role === 'ADMIN';
    if (existingBusiness.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido: No tienes permiso para editar este negocio" }, { status: 403 });
    }
    const data = await req.json();
    
    // Limpiar el customDomain si lo envían
    const cleanCustomDomain = data.customDomain 
      ? data.customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim() 
      : null;
    
    const updatedBusiness = await prisma.business.update({
      where: { id: id },
      data: {
        name: data.name,
        subdomain: data.subdomain,
        customDomain: cleanCustomDomain,
        email: data.email,
        phone: data.phone,
        description: data.description,
        type: data.type,
        status: data.status,
        paymentAmount: Number(data.paymentAmount) || 0,
        paymentStatus: data.paymentStatus,
        demoExpiresAt: parseDate(data.demoExpiresAt),
        nextPayment: parseDate(data.nextPayment),
        accentColor: data.accentColor,
        
        // 🌟 ACÁ ENTRAN LOS CAMPOS NUEVOS DEL DASHBOARD 🌟
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        fontFamily: data.fontFamily,
        layoutConfig: {
          ...(data.layoutConfig || {}),
          instagram: data.instagram,
          facebook: data.facebook,
          whatsapp: data.whatsapp,
          tiktok: data.tiktok,
        },
        paymentData: data.paymentData,
      },
    });

    return NextResponse.json(updatedBusiness);
  } catch (error) {
    console.error("Error editando:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ── DELETE: BORRAR UN NEGOCIO ──
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // Esperamos el ID antes de borrar
    const { id } = await params;

    // VERIFICACIÓN DE PROPIEDAD (IDOR FIX)
    const existingBusiness = await prisma.business.findUnique({ where: { id } });
    if (!existingBusiness) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    const isAdmin = (session.user as any).role === 'ADMIN';
    if (existingBusiness.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido: No tienes permiso para borrar este negocio" }, { status: 403 });
    }

    await prisma.business.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error borrando:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}