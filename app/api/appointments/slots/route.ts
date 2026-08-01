export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BusinessHours, Section, ServiceItem, DEFAULT_HOURS } from "@/lib/constants";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const serviceName = searchParams.get("serviceName");

  if (!businessId || !dateStr || !serviceName) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    // 1. Obtener negocio y su configuración
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true }
    });

    if (!biz) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const layout = biz.layoutConfig as any;
    const sections: Section[] = layout?.sections || [];
    
    // Buscar configuración de reservas
    const bookingSection = sections.find(s => s.id === "booking");
    const hours: BusinessHours = layout?.hours || bookingSection?.config?.hours || DEFAULT_HOURS;
    
    // Buscar duración del servicio
    const servicesSection = sections.find(s => s.id === "services");
    const allServices = [...(servicesSection?.config?.items || []), ...(layout?.barberiaServices || [])];
    const serviceItem = allServices.find((s: ServiceItem) => s.name === serviceName);
    const duration = serviceItem?.duration || bookingSection?.config?.slotDuration || 30;

    if (!hours) return NextResponse.json({ slots: [] });

    // 2. Determinar si abre ese día
    // Parseamos la fecha sin 'T00:00:00' para evitar que el server lo interprete como UTC
    // y reste horas por el timezone (ej: GMT-3) cayendo en el día anterior.
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const dayName = days[dateObj.getDay()];
    const dayConfig = hours[dayName as keyof BusinessHours];

    if (!dayConfig || !dayConfig.open) {
      return NextResponse.json({ slots: [] });
    }

    const employeeId = searchParams.get("employeeId");

    // 3. Obtener turnos ya agendados para ese día (que no estén cancelados)
    // Buscamos turnos desde las 00:00 hasta las 23:59 de ese día
    // Expandimos la búsqueda 24hs para no perder turnos por diferencias de UTC
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    startOfDay.setUTCHours(-24);
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");
    endOfDay.setUTCHours(48);

    const whereClause: any = {
      businessId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { not: "CANCELLED" }
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: whereClause
    });

    const bookedRanges = existingAppointments.map(app => {
      // Formatear en horario local de Argentina para validar la fecha real
      const dayStrFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      if (dayStrFormatter.format(app.date) !== dateStr) return null;

      // Extraer hora y minuto en la zona horaria local del negocio (por ahora asumimos Argentina)
      const argDate = new Date(app.date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      const h = argDate.getHours();
      const m = argDate.getMinutes();
      const startMin = h * 60 + m;
      
      // Buscar la duración de este servicio en particular
      const allSrvs = [...(servicesSection?.config?.items || []), ...(layout?.barberiaServices || [])];
      const appService = allSrvs.find((s: ServiceItem) => s.name === app.serviceName);
      const appDuration = appService?.duration || 30;
      
      return { start: startMin, end: startMin + appDuration };
    }).filter(Boolean) as { start: number, end: number }[];

    // 4. Generar slots posibles
    const parseTime = (t: string) => {
      if (!t || !t.includes(':')) return 0;
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const openMin = parseTime(dayConfig.from || "09:00");
    const closeMin = parseTime(dayConfig.to || "18:00");
    // Usamos el duration del servicio específico para armar los bloques (ej: 60min)
    const slotStep = duration;
    
    const availableSlots: string[] = [];
    
    // Iterar en bloques según el slotStep (ej: cada 60 min)
    for (let current = openMin; current + duration <= closeMin; current += slotStep) {
      const slotEnd = current + duration; // El slot terminará sumando la duración real del servicio
      
      // Chequear si este bloque se pisa con algún turno existente
      const isOverlapping = bookedRanges.some(range => {
        // Hay superposición si el inicio del slot es menor al fin del turno
        // Y el fin del slot es mayor al inicio del turno
        return current < range.end && slotEnd > range.start;
      });

      if (!isOverlapping) {
        // Formatear a HH:MM
        const h = Math.floor(current / 60).toString().padStart(2, "0");
        const m = (current % 60).toString().padStart(2, "0");
        availableSlots.push(`${h}:${m}`);
      }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("Error calculando slots:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
