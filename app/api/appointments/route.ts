import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { publicAppointmentCreateSchema } from "@/lib/validations";
import { decryptSecret } from "@/lib/encryption";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import {
  getBusinessDayName,
  getBusinessMinutesSinceMidnight,
  parseTimeToMinutes,
  DEFAULT_BUSINESS_TIMEZONE,
} from "@/lib/date-helpers";
import crypto from "crypto";

// ─── RATE LIMITING: Appointments ──────────────────────────────────────────────
// P1-003: Prevent appointment spam.
const APPT_RATE_WINDOW_MS = 60_000; // 1 minute
const APPT_RATE_MAX_IP = 5;
const APPT_RATE_MAX_PHONE = 3;

// ─── GET: Fetch appointments ───────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const patente = searchParams.get("patente");
  const search = searchParams.get("search");
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Falta el ID del negocio" }, { status: 400 });
  }

  try {
    let whereClause: any = { businessId };
    let isOwnerOrAdmin = false;

    if (session) {
      const userRole = session.user?.role;
      const userId = session.user?.id;

      if (userRole === "ADMIN") {
        isOwnerOrAdmin = true;
      } else if (userId) {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { userId: true },
        });
        if (business && business.userId === userId) {
          isOwnerOrAdmin = true;
        }
      }
    }

    if (!isOwnerOrAdmin) {
      // Public access requires a secure tracking token
      const trackingToken = searchParams.get("trackingToken");
      if (!trackingToken) {
        return NextResponse.json(
          { error: "No autorizado. Se requiere token de seguimiento para consulta pública." },
          { status: 401 }
        );
      }

      const publicTrackingTokenHash = crypto
        .createHash("sha256")
        .update(trackingToken)
        .digest("hex");

      // P1-013: Return only minimal public fields
      const turnosPublicos = await prisma.appointment.findMany({
        where: { businessId, publicTrackingTokenHash },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          status: true,
          serviceName: true,
        },
      });
      return NextResponse.json(turnosPublicos);
    }

    // Owner/admin filter by patente or search
    if (patente || search) {
      const q = patente || search;
      whereClause = {
        ...whereClause,
        OR: [
          { patente: { contains: q, mode: "insensitive" } },
          { notes: { contains: `PATENTE:${q}`, mode: "insensitive" } },
        ],
      };
    }

    // P1-013: Return safe fields for owner/admin too (no internal tracking hashes)
    const turnos = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
      select: {
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
        source: true,
        paymentMethod: true,
        paymentReference: true,
        whatsappSent: true,
        reminderSent: true,
        cancelledAt: true,
        cancelReason: true,
        createdAt: true,
        updatedAt: true,
        // Intentionally excluded: publicTrackingTokenHash, concurrencyToken
      },
    });
    return NextResponse.json(turnos);
  } catch (error) {
    console.error("Error leyendo turnos:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── POST: Create appointment ─────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // P1-003: Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipKey = `appt:ip:${ip}`;
    if (!checkRateLimit(ipKey, APPT_RATE_MAX_IP, APPT_RATE_WINDOW_MS)) {
      const retryAfter = Math.ceil(
        getRateLimitRetryAfterMs(ipKey, APPT_RATE_WINDOW_MS) / 1000
      );
      return NextResponse.json(
        { error: "Demasiadas reservas en poco tiempo. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const rawData = await req.json();

    // P1-003: Rate limit by phone number
    if (rawData.clientPhone) {
      const normalizedPhone = String(rawData.clientPhone).replace(/\D/g, "").slice(-10);
      const phoneKey = `appt:phone:${normalizedPhone}`;
      if (!checkRateLimit(phoneKey, APPT_RATE_MAX_PHONE, APPT_RATE_WINDOW_MS)) {
        return NextResponse.json(
          { error: "Ya tienes varias reservas en curso. Intenta más tarde." },
          { status: 429 }
        );
      }
    }

    const parseResult = publicAppointmentCreateSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Datos de turno inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const data = parseResult.data as any;

    // Force PENDING — clients cannot set status
    data.status = "PENDING";

    // Reject dates in the past (5-minute buffer for clock drift)
    if (data.date.getTime() < Date.now() - 5 * 60000) {
      return NextResponse.json(
        { error: "La fecha y hora del turno no puede estar en el pasado." },
        { status: 400 }
      );
    }

    // Generate public tracking token
    const trackingToken = crypto.randomBytes(16).toString("hex");
    data.publicTrackingTokenHash = crypto
      .createHash("sha256")
      .update(trackingToken)
      .digest("hex");

    // P0-007 / P1-007: Check business status
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: {
        status: true,
        layoutConfig: true,
        callMeBotApiKey: true,
        bankDetails: true,
        name: true,
        timezone: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }
    if (business.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Este negocio no admite nuevas reservas." },
        { status: 403 }
      );
    }
    if (business.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Este negocio no está disponible." },
        { status: 403 }
      );
    }

    const timezone = business.timezone ?? DEFAULT_BUSINESS_TIMEZONE;
    const layoutConfig = (business.layoutConfig as any) || {};

    // P1-008: Validate appointment falls within business hours
    const dayName = getBusinessDayName(data.date, timezone);
    const hours = layoutConfig.hours;
    if (hours) {
      const dayConfig = hours[dayName];
      if (!dayConfig || !dayConfig.open) {
        return NextResponse.json(
          { error: "El negocio no atiende ese día." },
          { status: 400 }
        );
      }

      const appointmentMinutes = getBusinessMinutesSinceMidnight(data.date, timezone);
      const openMin = parseTimeToMinutes(dayConfig.from || "09:00");
      const closeMin = parseTimeToMinutes(dayConfig.to || "18:00");

      if (appointmentMinutes < openMin || appointmentMinutes >= closeMin) {
        return NextResponse.json(
          { error: "El horario seleccionado está fuera del horario de atención." },
          { status: 400 }
        );
      }
    }

    // P1-009: Validate service from server — don't trust serviceName from client alone
    if (data.serviceName) {
      const allServices = [
        ...(layoutConfig.barberiaServices || []),
        ...(layoutConfig.clinicaServices || []),
        ...(layoutConfig.tallerServices || []),
        ...(layoutConfig.sections?.find((s: any) => s.type === "services")?.items || []),
      ];

      if (allServices.length > 0) {
        const found = allServices.find(
          (s: any) => (s.nombre || s.name || s.title) === data.serviceName
        );
        // Allow "Mesa" for restaurant bookings
        if (!found && !data.serviceName.toLowerCase().includes("mesa")) {
          return NextResponse.json({ error: "Servicio no válido" }, { status: 400 });
        }
      }
    }

    // Validate employeeId belongs to this business
    if (data.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        select: { businessId: true },
      });
      if (!emp || emp.businessId !== data.businessId) {
        return NextResponse.json({ error: "Empleado inválido para este negocio" }, { status: 400 });
      }
    }

    // Payment reference for transfers
    if (data.paymentMethod === "TRANSFER") {
      data.paymentReference = "TRX-" + crypto.randomUUID().substring(0, 8).toUpperCase();
    }

    // P0-004: Deterministic concurrencyToken for slot-level uniqueness
    const employeeStr = data.employeeId || "NO_EMP";
    data.concurrencyToken = `${data.businessId}_${data.date.getTime()}_${employeeStr}`;

    // Create appointment (P2002 = duplicate slot under concurrency)
    let nuevoTurno;
    try {
      nuevoTurno = await prisma.appointment.create({ data: data as any });
    } catch (e: any) {
      if (e.code === "P2002" && e.meta?.target?.includes("concurrencyToken")) {
        return NextResponse.json(
          { error: "El horario seleccionado acaba de ser reservado. Por favor elige otro." },
          { status: 409 }
        );
      }
      throw e;
    }

    // CallMeBot integration (internal notification — secrets used server-side only)
    try {
      if (business.layoutConfig) {
        const phone = layoutConfig.callMeBotPhone;
        // P0-001: decryptSecret used only server-side to call external provider, never returned
        const apiKey = decryptSecret(business.callMeBotApiKey);

        if (phone && apiKey) {
          const date = new Date(nuevoTurno.date).toLocaleString("es-MX", {
            timeZone: timezone,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const message = `🔔 *Nuevo Turno*\nCliente: ${nuevoTurno.clientName}\nServicio: ${nuevoTurno.serviceName || "Turno"}\nFecha: ${date}`;
          const cleanPhone = phone.replace("+", "");
          const encodedMessage = encodeURIComponent(message);
          const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          try {
            await fetch(callMeBotUrl, { signal: controller.signal });
          } catch {
            // Fire-and-forget — do not block appointment creation
          } finally {
            clearTimeout(timeoutId);
          }
        }
      }
    } catch {
      // Non-fatal — notification failure should not abort the appointment
    }

    // Enqueue WhatsApp confirmation message
    if (data.clientPhone) {
      try {
        const businessInfo = await prisma.business.findUnique({
          where: { id: data.businessId },
          select: { name: true, layoutConfig: true, bankDetails: true },
        });

        let cleanPhone = data.clientPhone.replace(/\D/g, "");
        if (cleanPhone.length === 10) {
          cleanPhone = `52${cleanPhone}`;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;

        const apptDate = new Date(nuevoTurno.date);
        const bizLayout = businessInfo?.layoutConfig as any || {};
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
          bizLayout.waTemplateConfirmed ||
          `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`;
        const templateTransfer =
          bizLayout.waTemplateTransfer ||
          `¡Hola! {{cliente}} para confirmar tu turno, transfiere a {{datos_bancarios}} y pon el código {{referencia}} en el concepto.`;

        const templateToUse =
          nuevoTurno.paymentMethod === "TRANSFER" ? templateTransfer : templateConfirmed;

        // P0-001: decryptSecret only used server-side for message content, never returned to client
        const bankDetails =
          decryptSecret(businessInfo?.bankDetails) || "nuestra cuenta bancaria";

        const mensajeCliente = templateToUse
          .replace(/{{cliente}}/g, nuevoTurno.clientName)
          .replace(/{{negocio}}/g, businessInfo?.name || "el local")
          .replace(/{{fecha}}/g, diaTexto)
          .replace(/{{hora}}/g, hora)
          .replace(/{{servicio}}/g, nuevoTurno.serviceName || "servicio")
          .replace(/{{referencia}}/g, nuevoTurno.paymentReference || "")
          .replace(/{{datos_bancarios}}/g, bankDetails);

        // Check business status before enqueuing
        if (business.status === "ACTIVE" || business.status === "DEMO" || business.status === "TRIAL") {
          await prisma.whatsappMessageQueue.create({
            data: {
              businessId: data.businessId,
              toPhone: jid,
              message: mensajeCliente,
              status: "PENDING",
            },
          });
        }
      } catch (waError) {
        console.error(
          "Error encolando confirmación WhatsApp:",
          waError instanceof Error ? waError.message : "unknown"
        );
      }
    }

    // P1-013: Return PublicAppointmentResponseDTO — no internal fields
    return NextResponse.json(
      {
        appointmentId: nuevoTurno.id,
        trackingToken, // This is the only time the raw token is returned — never stored
        date: nuevoTurno.date,
        status: nuevoTurno.status,
        serviceName: nuevoTurno.serviceName,
        clientName: nuevoTurno.clientName,
        paymentMethod: nuevoTurno.paymentMethod,
        paymentReference: nuevoTurno.paymentReference,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error creando turno:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Error al guardar el turno" }, { status: 500 });
  }
}