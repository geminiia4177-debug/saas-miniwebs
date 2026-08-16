import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { resolveServiceFromLayout } from "@/lib/appointment-service";

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

    // P0-012: Validate employeeId belongs to this business if provided
    let validEmployeeId: string | null = null;
    if (employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { businessId: true },
      });
      if (!emp || emp.businessId !== existingAppointment.businessId) {
        return NextResponse.json({ error: "El empleado no pertenece a este negocio" }, { status: 400 });
      }
      validEmployeeId = employeeId;
    } else {
      validEmployeeId = existingAppointment.employeeId;
    }

    const appointmentSelect = {
      id: true,
      businessId: true,
      clientName: true,
      clientPhone: true,
      clientEmail: true,
      date: true,
      status: true,
      serviceName: true,
      serviceId: true,
      notes: true,
      patente: true,
      employeeId: true,
      paymentMethod: true,
      paymentReference: true,
      whatsappSent: true,
      reminderSent: true,
      createdAt: true,
      updatedAt: true,
    };

    // SEC-039 & SEC-040 Fix: Auto-create Sale atomically and idempotently if completed
    if (status === "COMPLETED" && existingAppointment.status !== "COMPLETED") {
      try {
        const business = await prisma.business.findUnique({
          where: { id: existingAppointment.businessId },
          select: { layoutConfig: true, publishedConfig: true },
        });
        const configSource = (business?.publishedConfig || business?.layoutConfig || {}) as Record<string, unknown>;
        const servicio = resolveServiceFromLayout(configSource, existingAppointment.serviceId || existingAppointment.serviceName);
        const amount = servicio?.price || 0;

        const [, updatedAppointment] = await prisma.$transaction([
          prisma.sale.upsert({
            where: { appointmentId: id },
            update: {},
            create: {
              businessId: existingAppointment.businessId,
              type: "SERVICE",
              amount: amount,
              itemName: existingAppointment.serviceName || "Servicio Turno",
              employeeId: validEmployeeId,
              appointmentId: id
            }
          }),
          prisma.appointment.update({
            where: { id },
            data: { 
              status,
              ...(validEmployeeId !== existingAppointment.employeeId ? { employeeId: validEmployeeId } : {}),
              ...( (status === "CANCELLED" || status === "COMPLETED") ? { concurrencyToken: null } : {} )
            },
            select: appointmentSelect
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
        data: { 
          status,
          ...(validEmployeeId !== existingAppointment.employeeId ? { employeeId: validEmployeeId } : {}),
          ...( (status === "CANCELLED" || status === "COMPLETED") ? { concurrencyToken: null } : {} )
        },
        select: appointmentSelect
      });
      return NextResponse.json(updatedAppointment);
    }
  } catch (error) {
    console.error("Error actualizando turno:", error);
    return NextResponse.json({ error: "Error al actualizar el turno" }, { status: 500 });
  }
}
