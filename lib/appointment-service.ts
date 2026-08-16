import { prisma } from "@/lib/db";
import crypto from "crypto";
import { decryptSecret } from "@/lib/encryption";
import { normalizePhoneToE164 } from "@/lib/phone";
import {
  getBusinessDayName,
  getBusinessMinutesSinceMidnight,
  parseTimeToMinutes,
  DEFAULT_BUSINESS_TIMEZONE,
} from "@/lib/date-helpers";
import { Prisma, Appointment } from "@prisma/client";

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

export interface PublicAppointmentDTO {
  appointmentId: string;
  trackingToken: string;
  date: Date;
  status: string;
  serviceName: string | null;
  clientName: string;
  paymentMethod: string | null;
  paymentReference: string | null;
}

interface RawLayoutItem {
  id?: string | number;
  nombre?: string;
  name?: string;
  title?: string;
  precio?: string | number;
  price?: string | number;
  duracion?: number;
  duration?: number;
}

interface RawLayoutSection {
  type?: string;
  items?: RawLayoutItem[];
}

interface RawLayoutConfig {
  barberiaServices?: RawLayoutItem[];
  clinicaServices?: RawLayoutItem[];
  tallerServices?: RawLayoutItem[];
  canchaTarifas?: RawLayoutItem[];
  sections?: RawLayoutSection[];
  hours?: Record<string, { open?: boolean; from?: string; to?: string }>;
  callMeBotPhone?: string;
  waTemplateConfirmed?: string;
  waTemplateTransfer?: string;
}

/**
 * Resolves the service from all configured catalogs in the business layoutConfig.
 */
export function resolveServiceFromLayout(
  layoutConfig: Record<string, unknown> | null | undefined,
  serviceIdOrName: string | null | undefined
): ServiceCatalogItem | null {
  if (!serviceIdOrName) return null;

  const rawConfig = (layoutConfig || {}) as RawLayoutConfig;
  const query = serviceIdOrName.trim().toLowerCase();
  const allServices: ServiceCatalogItem[] = [];

  // 1. Barberia
  if (Array.isArray(rawConfig.barberiaServices)) {
    rawConfig.barberiaServices.forEach((s) => {
      allServices.push({
        id: String(s.id || s.name || s.nombre),
        name: s.nombre || s.name || s.title || "Servicio",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 30),
      });
    });
  }

  // 2. Clinica
  if (Array.isArray(rawConfig.clinicaServices)) {
    rawConfig.clinicaServices.forEach((s) => {
      allServices.push({
        id: String(s.id || s.name || s.nombre),
        name: s.nombre || s.name || s.title || "Consulta",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 30),
      });
    });
  }

  // 3. Taller
  if (Array.isArray(rawConfig.tallerServices)) {
    rawConfig.tallerServices.forEach((s) => {
      allServices.push({
        id: String(s.id || s.name || s.nombre),
        name: s.nombre || s.name || s.title || "Servicio Taller",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 45),
      });
    });
  }

  // 4. Canchas
  if (Array.isArray(rawConfig.canchaTarifas)) {
    rawConfig.canchaTarifas.forEach((s) => {
      allServices.push({
        id: String(s.id || s.name || s.nombre),
        name: s.nombre || s.name || s.title || "Turno Cancha",
        price: Number(s.precio || s.price || 0),
        duration: Number(s.duration || s.duracion || 60),
      });
    });
  }

  // 5. Sections -> services
  const sections = Array.isArray(rawConfig.sections) ? rawConfig.sections : [];
  const srvSection = sections.find((s) => s.type === "services");
  if (Array.isArray(srvSection?.items)) {
    srvSection.items.forEach((s) => {
      allServices.push({
        id: String(s.id || s.name || s.title || s.nombre),
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

const defaultPublicConfig: RawLayoutConfig = {
  hours: {
    lunes: { open: true, from: "09:00", to: "18:00" },
    martes: { open: true, from: "09:00", to: "18:00" },
    miercoles: { open: true, from: "09:00", to: "18:00" },
    jueves: { open: true, from: "09:00", to: "18:00" },
    viernes: { open: true, from: "09:00", to: "18:00" },
    sabado: { open: true, from: "09:00", to: "14:00" },
    domingo: { open: false },
  },
  sections: [
    { type: "hero" },
    { type: "services", items: [] },
  ],
};

export class AppointmentService {
  /**
   * Fetches available appointment slots for a given date, business, and service.
   * Public requests consume strictly publishedConfig (or defaultPublicConfig).
   * Authorized preview requests may pass isPreview: true to inspect draft layoutConfig.
   */
  static async fetchAvailableSlots(
    businessId: string,
    dateStr: string, // YYYY-MM-DD
    serviceIdOrName?: string | null,
    employeeId?: string | null,
    isPreview = false
  ): Promise<{ slots: string[]; duration: number; error?: string }> {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true, publishedConfig: true, status: true, timezone: true },
    });

    if (!biz || biz.status === "BLOCKED" || biz.status === "ARCHIVED") {
      return { slots: [], duration: 30, error: "Negocio no disponible" };
    }

    const timezone = biz.timezone ?? DEFAULT_BUSINESS_TIMEZONE;
    // P0-001: Public slots consume exclusively publishedConfig. Draft layoutConfig is only accessible in authorized preview.
    const configSource = (isPreview
      ? (biz.layoutConfig || biz.publishedConfig || defaultPublicConfig)
      : (biz.publishedConfig || defaultPublicConfig)) as Record<string, unknown>;
    const rawConfig = configSource as RawLayoutConfig;

    const service = resolveServiceFromLayout(configSource, serviceIdOrName);
    const duration = service?.duration || 30;

    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
      return { slots: [], duration, error: "Fecha inválida" };
    }

    // Determine day config in local business timezone
    const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayName = getBusinessDayName(noonUTC, timezone);
    const hours = rawConfig.hours || {};
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
      const appSrv = resolveServiceFromLayout(configSource, app.serviceId || app.serviceName);
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
   * - Business status validation (reject BLOCKED/ARCHIVED)
   * - Strict publishedConfig consumption for public appointments (reject draft services)
   * - Server-side service duration and price resolution
   * - Strict date validations (reject NaN, past dates, max 365 days future)
   * - Slot interval alignment validation (reject non-grid minutes)
   * - Business hours validation
   * - Atomic overlapping duration check with Serializable isolation & retry
   * - Concurrency token and slot protection
   * - Tracking token generation
   * - WhatsApp confirmation enqueued with unique idempotencyKey
   */
  static async createAppointment(input: CreateAppointmentInput & { isPreview?: boolean }): Promise<{
    success?: boolean;
    appointment?: PublicAppointmentDTO;
    error?: string;
    status?: number;
  }> {
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
      isPreview,
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
        publishedConfig: true,
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
    // P0-001: Public bookings consume strictly publishedConfig
    const configSource = (isPreview
      ? (business.layoutConfig || business.publishedConfig || defaultPublicConfig)
      : (business.publishedConfig || defaultPublicConfig)) as Record<string, unknown>;
    const rawConfig = configSource as RawLayoutConfig;

    // 5. Resolve service catalog item server-side (P1-002: Reject nonexistent services)
    const resolvedService = resolveServiceFromLayout(configSource, serviceId || serviceName);
    if ((serviceId || serviceName) && !resolvedService) {
      return {
        error: `El servicio "${serviceName || serviceId}" no está disponible o no existe en el catálogo publicado.`,
        status: 400,
      };
    }

    const finalServiceName = resolvedService?.name || "Turno General";
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

    // 7. Validate slot step and business hours (P1-001: Strict step grid validation)
    const appointmentMinutes = getBusinessMinutesSinceMidnight(date, timezone);
    const step = finalDuration >= 60 ? 60 : 30;

    if (appointmentMinutes % step !== 0) {
      return {
        error: `El horario debe comenzar en un intervalo válido (cada ${step} minutos).`,
        status: 400,
      };
    }

    const dayName = getBusinessDayName(date, timezone);
    const hours = rawConfig.hours;
    if (hours) {
      const dayConfig = hours[dayName];
      if (!dayConfig || !dayConfig.open) {
        return { error: "El negocio no atiende en ese día.", status: 400 };
      }

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

    // 9. Atomic Transaction with Serializable Isolation and Retry Loop
    const MAX_RETRIES = 3;
    let nuevoTurno: Appointment | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        nuevoTurno = await prisma.$transaction(
          async (tx) => {
            // Check overlapping appointments in surrounding window (+/- 24h)
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
              const exSrv = resolveServiceFromLayout(configSource, existing.serviceId || existing.serviceName);
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
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 5000,
          }
        );
        // Successful creation — break retry loop
        break;
      } catch (err: unknown) {
        lastError = err;
        const errObj = err as { code?: string; message?: string; meta?: { target?: string[] } };

        if (errObj.message === "OVERLAPPING_SLOT") {
          return {
            error: "El horario seleccionado se solapa con otro turno reservado. Por favor elige otro horario.",
            status: 409,
          };
        }

        if (errObj.code === "P2002" && errObj.meta?.target?.includes("concurrencyToken")) {
          return {
            error: "El horario seleccionado acaba de ser reservado. Por favor elige otro.",
            status: 409,
          };
        }

        // Serialization failure (Prisma P2034) -> retry
        if (errObj.code === "P2034" && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 50 * attempt));
          continue;
        }

        break;
      }
    }

    if (!nuevoTurno) {
      const errObj = lastError as { message?: string; code?: string };
      if (errObj?.message === "OVERLAPPING_SLOT" || errObj?.code === "P2034" || errObj?.code === "P2002") {
        return {
          error: "El horario seleccionado ya no está disponible. Por favor elige otro horario.",
          status: 409,
        };
      }
      console.error("Error persistiendo turno en AppointmentService:", lastError);
      return { error: "Error al guardar el turno", status: 500 };
    }

    // 10. CallMeBot Integration (Server-side notification)
    try {
      const phone = rawConfig.callMeBotPhone;
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
        const cleanPhone = normalizePhoneToE164(clientPhone);
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
          rawConfig.waTemplateConfirmed ||
          `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`;
        const templateTransfer =
          rawConfig.waTemplateTransfer ||
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
          } catch (e: unknown) {
            const err = e as { code?: string };
            if (err.code !== "P2002") throw e;
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
