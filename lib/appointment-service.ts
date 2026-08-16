import { prisma } from "@/lib/db";
import crypto from "crypto";
import { decryptSecret } from "@/lib/encryption";
import {
  getBusinessDayName,
  getBusinessMinutesSinceMidnight,
  parseTimeToMinutes,
  DEFAULT_BUSINESS_TIMEZONE,
} from "@/lib/date-helpers";

export interface CreateAppointmentInput {
  businessId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  date: Date;
  notes?: string | null;
  patente?: string | null;
  employeeId?: string | null;
  paymentMethod?: "LOCAL" | "TRANSFER";
  source?: "WEB" | "ADMIN" | "WA";
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
}

/**
 * Resolves the service from all configured catalogs in the business layoutConfig.
 */
export function resolveServiceFromLayout(
  layoutConfig: any,
  serviceIdOrName: string | null | undefined
): ServiceCatalogItem | null {
  if (!serviceIdOrName) return null;

  const query = serviceIdOrName.trim().toLowerCase();
  const allServices: ServiceCatalogItem[] = [];

  // 1. Barberia
  if (Array.isArray(layoutConfig?.barberiaServices)) {
    layoutConfig.barberiaServices.forEach((s: any) => {
      allServices.push({
        id: String(s.id || s.name),
        name: s.nombre || s.name || s.title || "Servicio",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 30),
      });
    });
  }

  // 2. Clinica
  if (Array.isArray(layoutConfig?.clinicaServices)) {
    layoutConfig.clinicaServices.forEach((s: any) => {
      allServices.push({
        id: String(s.id || s.name),
        name: s.nombre || s.name || s.title || "Consulta",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 30),
      });
    });
  }

  // 3. Taller
  if (Array.isArray(layoutConfig?.tallerServices)) {
    layoutConfig.tallerServices.forEach((s: any) => {
      allServices.push({
        id: String(s.id || s.name),
        name: s.nombre || s.name || s.title || "Servicio Taller",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 45),
      });
    });
  }

  // 4. Canchas
  if (Array.isArray(layoutConfig?.canchaTarifas)) {
    layoutConfig.canchaTarifas.forEach((s: any) => {
      allServices.push({
        id: String(s.id || s.name),
        name: s.nombre || s.name || s.title || "Turno Cancha",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 60),
      });
    });
  }

  // 5. Sections -> services
  const sections = Array.isArray(layoutConfig?.sections) ? layoutConfig.sections : [];
  const srvSection = sections.find((s: any) => s.type === "services");
  if (Array.isArray(srvSection?.items)) {
    srvSection.items.forEach((s: any) => {
      allServices.push({
        id: String(s.id || s.name || s.title),
        name: s.nombre || s.name || s.title || "Servicio",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 30),
      });
    });
  }

  // Match by ID first, then by name
  const matchById = allServices.find((s) => s.id.toLowerCase() === query);
  if (matchById) return matchById;

  const matchByName = allServices.find((s) => s.name.toLowerCase() === query);
  if (matchByName) return matchByName;

  return null;
}

export class AppointmentService {
  /**
   * Fetches available appointment slots for a given date, business, and service.
   */
  static async fetchAvailableSlots(
    businessId: string,
    dateStr: string, // YYYY-MM-DD
    serviceIdOrName?: string | null,
    employeeId?: string | null
  ): Promise<{ slots: string[]; duration: number; error?: string }> {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true, status: true, timezone: true },
    });

    if (!biz || biz.status === "BLOCKED" || biz.status === "ARCHIVED") {
      return { slots: [], duration: 30, error: "Negocio no disponible" };
    }

    const timezone = biz.timezone ?? DEFAULT_BUSINESS_TIMEZONE;
    const layoutConfig = (biz.layoutConfig as any) || {};

    const service = resolveServiceFromLayout(layoutConfig, serviceIdOrName);
    const duration = service?.duration || 30;

    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
      return { slots: [], duration, error: "Fecha inválida" };
    }

    // Determine day config in local business timezone
    const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayName = getBusinessDayName(noonUTC, timezone);
    const hours = layoutConfig.hours || {};
    const dayConfig = hours[dayName];

    if (!dayConfig || !dayConfig.open) {
      return { slots: [], duration, error: "Cerrado en este día" };
    }

    const openMin = parseTimeToMinutes(dayConfig.from || "09:00");
    const closeMin = parseTimeToMinutes(dayConfig.to || "18:00");

    // Search window for existing appointments (covering full local day +/- 1 day buffer)
    const searchStart = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0));
    const searchEnd = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59));

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: { gte: searchStart, lte: searchEnd },
        status: { not: "CANCELLED" },
        ...(employeeId ? { employeeId } : {}),
      },
      select: { date: true, serviceName: true, serviceId: true },
    });

    const bookedRanges: { start: number; end: number }[] = [];

    for (const app of existingAppointments) {
      const appMin = getBusinessMinutesSinceMidnight(app.date, timezone);
      const appSrv = resolveServiceFromLayout(layoutConfig, app.serviceId || app.serviceName);
      const appDuration = appSrv?.duration || 30;
      bookedRanges.push({ start: appMin, end: appMin + appDuration });
    }

    const slots: string[] = [];
    const step = duration >= 60 ? 60 : 30; // 30 or 60 min grid steps

    for (let cur = openMin; cur + duration <= closeMin; cur += step) {
      const slotEnd = cur + duration;
      const overlaps = bookedRanges.some((r) => cur < r.end && slotEnd > r.start);
      if (!overlaps) {
        const h = Math.floor(cur / 60).toString().padStart(2, "0");
        const m = (cur % 60).toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
      }
    }

    return { slots, duration };
  }

  /**
   * Unified, server-authoritative appointment creation with:
   * - Business status validation
   * - Server-side service duration and price resolution
   * - Strict date validations (no past dates, max 365 days future)
   * - Business hours validation
   * - Atomic overlapping duration check in transaction
   * - Concurrency token and slot protection
   * - Tracking token generation
   * - WhatsApp confirmation enqueued with unique idempotencyKey
   */
  static async createAppointment(input: CreateAppointmentInput) {
    const {
      businessId,
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      serviceName,
      date,
      notes,
      patente,
      employeeId,
      paymentMethod,
      source,
    } = input;

    // 1. Validate date object
    if (!date || isNaN(date.getTime())) {
      return { error: "Fecha inválida", status: 400 };
    }

    // 2. Reject dates in the past (5-minute drift buffer)
    if (date.getTime() < Date.now() - 5 * 60 * 1000) {
      return { error: "La fecha y hora del turno no puede estar en el pasado.", status: 400 };
    }

    // 3. Reject dates beyond 365 days in future
    const maxFutureMs = Date.now() + 365 * 24 * 60 * 60 * 1000;
    if (date.getTime() > maxFutureMs) {
      return { error: "No se pueden realizar reservas con más de 1 año de anticipación.", status: 400 };
    }

    // 4. Fetch business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        status: true,
        timezone: true,
        layoutConfig: true,
        callMeBotApiKey: true,
        bankDetails: true,
      },
    });

    if (!business) {
      return { error: "Negocio no encontrado", status: 404 };
    }

    if (business.status === "BLOCKED") {
      return { error: "Este negocio no admite nuevas reservas.", status: 403 };
    }

    if (business.status === "ARCHIVED") {
      return { error: "Este negocio no está disponible.", status: 403 };
    }

    const timezone = business.timezone ?? DEFAULT_BUSINESS_TIMEZONE;
    const layoutConfig = (business.layoutConfig as any) || {};

    // 5. Resolve service catalog item server-side
    const resolvedService = resolveServiceFromLayout(layoutConfig, serviceId || serviceName);
    const finalServiceName = resolvedService?.name || serviceName || "Turno General";
    const finalDuration = resolvedService?.duration || 30;

    // 6. Validate employee belongs to this business
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { businessId: true },
      });
      if (!employee || employee.businessId !== businessId) {
        return { error: "El profesional seleccionado no pertenece a este negocio.", status: 400 };
      }
    }

    // 7. Validate business hours
    const dayName = getBusinessDayName(date, timezone);
    const hours = layoutConfig.hours;
    if (hours) {
      const dayConfig = hours[dayName];
      if (!dayConfig || !dayConfig.open) {
        return { error: "El negocio no atiende en ese día.", status: 400 };
      }

      const appointmentMinutes = getBusinessMinutesSinceMidnight(date, timezone);
      const openMin = parseTimeToMinutes(dayConfig.from || "09:00");
      const closeMin = parseTimeToMinutes(dayConfig.to || "18:00");

      if (appointmentMinutes < openMin || appointmentMinutes + finalDuration > closeMin) {
        return { error: "El horario seleccionado está fuera del horario de atención.", status: 400 };
      }
    }

    // 8. Generate tokens
    const trackingToken = crypto.randomBytes(16).toString("hex");
    const publicTrackingTokenHash = crypto
      .createHash("sha256")
      .update(trackingToken)
      .digest("hex");

    const employeeStr = employeeId || "NO_EMP";
    const startMs = date.getTime();
    const endMs = startMs + finalDuration * 60 * 1000;
    const concurrencyToken = `${businessId}_${startMs}_${employeeStr}`;

    const paymentReference =
      paymentMethod === "TRANSFER"
        ? "TRX-" + crypto.randomUUID().substring(0, 8).toUpperCase()
        : null;

    // 9. Atomic Transaction: Check duration overlap + create appointment
    let nuevoTurno: any;
    try {
      nuevoTurno = await prisma.$transaction(async (tx) => {
        // Query potential overlapping appointments in surrounding window (+/- 24h)
        const windowStart = new Date(startMs - 24 * 60 * 60 * 1000);
        const windowEnd = new Date(endMs + 24 * 60 * 60 * 1000);

        const existingOverlaps = await tx.appointment.findMany({
          where: {
            businessId,
            date: { gte: windowStart, lte: windowEnd },
            status: { not: "CANCELLED" },
            ...(employeeId ? { employeeId } : {}),
          },
          select: { id: true, date: true, serviceId: true, serviceName: true },
        });

        for (const existing of existingOverlaps) {
          const exStart = existing.date.getTime();
          const exSrv = resolveServiceFromLayout(layoutConfig, existing.serviceId || existing.serviceName);
          const exDuration = exSrv?.duration || 30;
          const exEnd = exStart + exDuration * 60 * 1000;

          // Check if [startMs, endMs) overlaps with [exStart, exEnd)
          if (startMs < exEnd && endMs > exStart) {
            throw new Error("OVERLAPPING_SLOT");
          }
        }

        return await tx.appointment.create({
          data: {
            businessId,
            clientName: clientName.trim().substring(0, 100),
            clientPhone: clientPhone.trim().substring(0, 30),
            clientEmail: clientEmail?.trim() || null,
            date,
            status: "PENDING",
            serviceName: finalServiceName,
            serviceId: resolvedService?.id || serviceId || null,
            notes: notes?.substring(0, 1000) || null,
            patente: patente?.substring(0, 20) || null,
            employeeId: employeeId || null,
            source: source || "WEB",
            publicTrackingTokenHash,
            concurrencyToken,
            paymentMethod: paymentMethod || "LOCAL",
            paymentReference,
          },
        });
      });
    } catch (e: any) {
      if (e.message === "OVERLAPPING_SLOT") {
        return {
          error: "El horario seleccionado se solapa con otro turno reservado. Por favor elige otro horario.",
          status: 409,
        };
      }
      if (e.code === "P2002" && e.meta?.target?.includes("concurrencyToken")) {
        return {
          error: "El horario seleccionado acaba de ser reservado. Por favor elige otro.",
          status: 409,
        };
      }
      throw e;
    }

    // 10. CallMeBot Integration (Server-side notification)
    try {
      const phone = layoutConfig.callMeBotPhone;
      const apiKey = decryptSecret(business.callMeBotApiKey);

      if (phone && apiKey) {
        const dateStrFormatted = new Date(nuevoTurno.date).toLocaleString("es-MX", {
          timeZone: timezone,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const message = `🔔 *Nuevo Turno*\nCliente: ${nuevoTurno.clientName}\nServicio: ${nuevoTurno.serviceName}\nFecha: ${dateStrFormatted}`;
        const cleanPhone = phone.replace("+", "");
        const encodedMessage = encodeURIComponent(message);
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          await fetch(callMeBotUrl, { signal: controller.signal });
        } catch {} finally {
          clearTimeout(timeoutId);
        }
      }
    } catch {}

    // 11. WhatsApp Confirmation Message (Enqueued with Idempotency Key)
    if (clientPhone) {
      try {
        let cleanPhone = clientPhone.replace(/\D/g, "");
        if (cleanPhone.length === 10) {
          cleanPhone = `52${cleanPhone}`;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;

        const apptDate = new Date(nuevoTurno.date);
        const hora = apptDate.toLocaleTimeString("es-MX", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
        });
        const diaTexto = apptDate.toLocaleDateString("es-MX", {
          timeZone: timezone,
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        const templateConfirmed =
          layoutConfig.waTemplateConfirmed ||
          `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`;
        const templateTransfer =
          layoutConfig.waTemplateTransfer ||
          `¡Hola! {{cliente}} para confirmar tu turno, transfiere a {{datos_bancarios}} y pon el código {{referencia}} en el concepto.`;

        const templateToUse =
          nuevoTurno.paymentMethod === "TRANSFER" ? templateTransfer : templateConfirmed;

        const bankDetails =
          decryptSecret(business.bankDetails) || "nuestra cuenta bancaria";

        const mensajeCliente = templateToUse
          .replace(/{{cliente}}/g, nuevoTurno.clientName)
          .replace(/{{negocio}}/g, business.name || "el local")
          .replace(/{{fecha}}/g, diaTexto)
          .replace(/{{hora}}/g, hora)
          .replace(/{{servicio}}/g, nuevoTurno.serviceName || "servicio")
          .replace(/{{referencia}}/g, nuevoTurno.paymentReference || "")
          .replace(/{{datos_bancarios}}/g, bankDetails);

        if (business.status === "ACTIVE" || business.status === "DEMO" || business.status === "TRIAL") {
          try {
            await prisma.whatsappMessageQueue.create({
              data: {
                businessId: business.id,
                toPhone: jid,
                message: mensajeCliente,
                status: "PENDING",
                idempotencyKey: `appointment:${nuevoTurno.id}:confirmation`,
              },
            });
          } catch (e: any) {
            if (e.code !== "P2002") throw e;
          }
        }
      } catch (waError) {
        console.error("Error encolando WhatsApp confirmation:", waError);
      }
    }

    return {
      success: true,
      appointment: {
        appointmentId: nuevoTurno.id,
        trackingToken,
        date: nuevoTurno.date,
        status: nuevoTurno.status,
        serviceName: nuevoTurno.serviceName,
        clientName: nuevoTurno.clientName,
        paymentMethod: nuevoTurno.paymentMethod,
        paymentReference: nuevoTurno.paymentReference,
      },
    };
  }
}
