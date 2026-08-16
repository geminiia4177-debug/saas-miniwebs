import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessOwner } from "@/lib/auth-helpers";
import { toSafeBusinessDTO } from "@/lib/dtos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");

  const { session, error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  // Verificar propiedad
  const { error: authError } = await requireBusinessOwner(businessId);
  if (authError) return authError;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 5000,
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5000,
        },
        sales: {
          orderBy: { date: "desc" },
          take: 5000,
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Sanitizar informacion sensible con el DTO seguro
    const safeBiz = toSafeBusinessDTO(business);

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      business: {
        ...safeBiz,
        appointments: business.appointments.map((a) => ({
          id: a.id,
          date: a.date,
          clientName: a.clientName,
          clientPhone: a.clientPhone,
          serviceName: a.serviceName,
          status: a.status,
          notes: a.notes,
          paymentMethod: a.paymentMethod,
          createdAt: a.createdAt,
        })),
        orders: business.orders,
        sales: business.sales,
      },
    });
  } catch (error: unknown) {
    console.error("Error al exportar datos:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
