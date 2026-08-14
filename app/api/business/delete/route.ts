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

    // En lugar de borrar la cuenta de usuario, solo borramos el negocio
    // y limpiamos las sesiones (en un caso real, el borrado debe ser en cascada)
    await prisma.business.delete({
      where: { id: business.id },
    });

    return NextResponse.json({ message: "Negocio eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar tienda:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
