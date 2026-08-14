import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/logger";

export async function DELETE(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // SEC-035: Registrar log de auditoría antes de eliminar
    auditLog("DELETE_BUSINESS", { userId: session.user.id, businessId: business.id });

    // SEC-001: Implementar archivado mediante status (Soft Delete)
    await prisma.business.update({
      where: { id: business.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date()
      }
    });

    return NextResponse.json({ message: "Negocio eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar tienda:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
