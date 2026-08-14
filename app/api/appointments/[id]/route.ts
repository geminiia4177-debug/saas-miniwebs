import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner } from "@/lib/auth-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    
    // SEC-013 Fix: Check ownership
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });
    if (!existingAppointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const { error: authError } = await requireBusinessOwner(existingAppointment.businessId);
    if (authError) return authError;

    const body = await req.json();

    const { status, employeeId } = body;

    if (!["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { business: true } // We need business layoutConfig
    });

    // Auto-create Sale if completed
    if (status === "COMPLETED") {
      try {
        const layoutConfig = updatedAppointment.business.layoutConfig as any;
        const servicios = layoutConfig?.servicios || [];
        const servicio = servicios.find((s: any) => s.name === updatedAppointment.serviceName);
        const amount = servicio ? parseFloat(servicio.price) : 0;

        await (prisma as any).sale.create({
          data: {
            businessId: updatedAppointment.businessId,
            type: "SERVICE",
            amount: amount,
            itemName: updatedAppointment.serviceName || "Servicio Turno",
            employeeId: employeeId || null,
          }
        });
      } catch (e) {
        console.error("Error auto-creating sale:", e);
      }
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error actualizando turno:", error);
    return NextResponse.json({ error: "Error al actualizar el turno" }, { status: 500 });
  }
}
