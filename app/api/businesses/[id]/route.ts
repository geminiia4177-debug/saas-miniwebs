import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ownerBusinessUpdateSchema, adminBusinessUpdateSchema } from "@/lib/validations";
import { requireBusinessOwner } from "@/lib/auth-helpers";

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
      select: { layoutConfig: true, name: true, subdomain: true, logoUrl: true }
    });
    
    if (!business) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // SEC-001 Fix: Check session to see if we return full layoutConfig or public only
    const session = await getServerSession(authOptions);
    const isOwnerOrAdmin = session?.user && (session.user.role === 'ADMIN' || session.user.id === (await prisma.business.findUnique({where:{id},select:{userId:true}}))?.userId);

    if (!isOwnerOrAdmin && business.layoutConfig) {
      // SEC-P0-005 Fix: Refactor to whitelist pattern for public layout config
      const originalConfig = typeof business.layoutConfig === 'object' && business.layoutConfig !== null 
        ? business.layoutConfig as any 
        : {};
        
      business.layoutConfig = {
        hours: originalConfig.hours,
        menuCategorias: originalConfig.menuCategorias,
        menuPromos: originalConfig.menuPromos,
        barberiaServices: originalConfig.barberiaServices,
        clinicaServices: originalConfig.clinicaServices,
        instagram: originalConfig.instagram,
        facebook: originalConfig.facebook,
        whatsapp: originalConfig.whatsapp,
        tiktok: originalConfig.tiktok,
        modosDisponibles: originalConfig.modosDisponibles,
        deliveryRadio: originalConfig.deliveryRadio,
        reservaMesaActiva: originalConfig.reservaMesaActiva,
        bannerOpacity: originalConfig.bannerOpacity,
      };
    }

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
    
    // SEC-003 Fix: Require business owner
    const { session: _, error: authError, business: existingBusiness } = await requireBusinessOwner(id);
    if (authError) return authError;
    if (!existingBusiness) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const isAdmin = session.user.role === 'ADMIN';

    const rawData = await req.json();
    const schema = isAdmin ? adminBusinessUpdateSchema : ownerBusinessUpdateSchema;
    const parseResult = schema.safeParse(rawData);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parseResult.error.format() }, { status: 400 });
    }
    const data = parseResult.data as any;
    
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
        type: data.type as any,
        status: data.status as any,
        paymentAmount: Number(data.paymentAmount) || 0,
        paymentStatus: data.paymentStatus as any,
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
        ...(rawData.publish === true ? {
          publishedConfig: {
            ...(data.layoutConfig || {}),
            instagram: data.instagram,
            facebook: data.facebook,
            whatsapp: data.whatsapp,
            tiktok: data.tiktok,
          }
        } : {}),
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

    // SEC-P0-003 Fix: Prevent accidental deletion by normal users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Para eliminar tu negocio definitivamente, por favor contacta a soporte." }, { status: 403 });
    }

    // VERIFICACIÓN DE PROPIEDAD (IDOR FIX)
    const { error: authError } = await requireBusinessOwner(id);
    if (authError) return authError;

    await prisma.business.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error borrando:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}