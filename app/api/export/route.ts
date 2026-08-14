import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessOwner } from "@/lib/auth-helpers";

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
        },
        orders: {
          orderBy: { createdAt: "desc" }
        },
        sales: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Remover informacion extremadamente sensible
    const exportData = {
      ...business,
      sessionVersion: undefined,
      publicTrackingTokenHash: undefined,
    };

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      business: exportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
