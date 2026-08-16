import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { publicAppointmentCreateSchema } from "@/lib/validations";
import { AppointmentService } from "@/lib/appointment-service";
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
        take: 200,
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
      take: 200,
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
    // P1-001: Rate limit by IP with failClosed
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipKey = `appt:ip:${ip}`;
    if (!(await checkRateLimit(ipKey, APPT_RATE_MAX_IP, APPT_RATE_WINDOW_MS, { failClosed: true }))) {
      const retryAfter = Math.ceil(
        await getRateLimitRetryAfterMs(ipKey, APPT_RATE_WINDOW_MS) / 1000
      );
      return NextResponse.json(
        { error: "Demasiadas reservas en poco tiempo. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const rawData = await req.json();

    // P1-001: Rate limit by phone number with failClosed
    if (rawData.clientPhone) {
      const normalizedPhone = String(rawData.clientPhone).replace(/\D/g, "").slice(-10);
      const phoneKey = `appt:phone:${normalizedPhone}`;
      if (!(await checkRateLimit(phoneKey, APPT_RATE_MAX_PHONE, APPT_RATE_WINDOW_MS, { failClosed: true }))) {
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
    const parsedData = parseResult.data;

    const result = await AppointmentService.createAppointment({
      businessId: parsedData.businessId,
      clientName: parsedData.clientName,
      clientPhone: parsedData.clientPhone,
      clientEmail: parsedData.clientEmail,
      serviceName: parsedData.serviceName,
      date: parsedData.date,
      notes: parsedData.notes,
      patente: parsedData.patente,
      employeeId: parsedData.employeeId,
      paymentMethod: parsedData.paymentMethod,
      source: "WEB",
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    // Return PublicAppointmentResponseDTO — no internal fields
    return NextResponse.json(result.appointment, { status: 201 });
  } catch (error) {
    console.error(
      "Error creando turno:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Error al guardar el turno" }, { status: 500 });
  }
}