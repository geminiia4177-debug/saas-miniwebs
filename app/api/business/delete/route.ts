import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const business = await prisma.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "No se encontró el negocio" }, { status: 404 });
    }

    // Delete the business. All related data will be deleted automatically because of onDelete: Cascade
    await prisma.business.delete({
      where: { id: business.id },
    });

    return NextResponse.json({ message: "Negocio eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar tienda:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
