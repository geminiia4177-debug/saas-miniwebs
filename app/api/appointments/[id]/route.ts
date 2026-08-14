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

    // SEC-039 & SEC-040 Fix: Auto-create Sale atomically and idempotently if completed
    if (status === "COMPLETED" && existingAppointment.status !== "COMPLETED") {
      try {
        const business = await prisma.business.findUnique({ where: { id: existingAppointment.businessId } });
        const layoutConfig = business?.layoutConfig as any;
        const allServices = [
          ...(layoutConfig?.barberiaServices || []),
          ...(layoutConfig?.clinicaServices || []),
          ...(layoutConfig?.sections?.find((s: any) => s.type === "services")?.items || [])
        ];
        const servicio = allServices.find((s: any) => (s.name || s.title) === existingAppointment.serviceName);
        const amount = servicio ? Number(servicio.price || servicio.precio || 0) : 0;

        const [, updatedAppointment] = await prisma.$transaction([
          prisma.sale.upsert({
            where: { appointmentId: id },
            update: {},
            create: {
              businessId: existingAppointment.businessId,
              type: "SERVICE",
              amount: amount,
              itemName: existingAppointment.serviceName || "Servicio Turno",
              employeeId: employeeId || null,
              appointmentId: id
            }
          }),
          prisma.appointment.update({
            where: { id },
            data: { status },
            include: { business: true }
          })
        ]);
        return NextResponse.json(updatedAppointment);
      } catch (e) {
        console.error("Error auto-creating sale:", e);
        return NextResponse.json({ error: "Error al completar el turno y crear venta" }, { status: 500 });
      }
    } else {
      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { business: true }
      });
      return NextResponse.json(updatedAppointment);
    }
  } catch (error) {
    console.error("Error actualizando turno:", error);
    return NextResponse.json({ error: "Error al actualizar el turno" }, { status: 500 });
  }
}
