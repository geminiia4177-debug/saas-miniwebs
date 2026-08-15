export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BusinessHours, Section, ServiceItem, DEFAULT_HOURS } from "@/lib/constants";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import {
  getBusinessDayName,
  getBusinessDateStr,
  getBusinessMinutesSinceMidnight,
  parseTimeToMinutes,
  DEFAULT_BUSINESS_TIMEZONE,
} from "@/lib/date-helpers";

// ─── RATE LIMITING: Slots ─────────────────────────────────────────────────────
// P1-002: Prevent mass scraping of slot availability.
// Limit: 60 requests per minute per IP per business.
const SLOTS_RATE_WINDOW_MS = 60_000;
const SLOTS_RATE_MAX = 60;

export async function GET(req: Request) {
  // P1-002: Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rawUrl = new URL(req.url);
  const businessId = rawUrl.searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const rateLimitKey = `slots:${ip}:${businessId}`;
  if (!(await checkRateLimit(rateLimitKey, SLOTS_RATE_MAX, SLOTS_RATE_WINDOW_MS))) {
    const retryAfter = Math.ceil(
      await getRateLimitRetryAfterMs(rateLimitKey, SLOTS_RATE_WINDOW_MS) / 1000
    );
    return NextResponse.json(
      { error: "Demasiadas consultas. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const { searchParams } = rawUrl;
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const serviceName = searchParams.get("serviceName");

  if (!dateStr || !serviceName) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    // 1. Fetch business config including status and timezone
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true, status: true, timezone: true },
    });

    if (!biz) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // P1-007: Reject slots for disabled businesses
    if (biz.status === "BLOCKED" || biz.status === "ARCHIVED") {
      return NextResponse.json({ error: "Este negocio no acepta reservas." }, { status: 403 });
    }

    // P1-006: Use the business timezone, defaulting to Mexico City only as fallback
    const timezone = biz.timezone ?? DEFAULT_BUSINESS_TIMEZONE;

    const layout = biz.layoutConfig as any;
    const sections: Section[] = layout?.sections || [];

    // 2. Get business hours
    const bookingSection = sections.find((s) => s.id === "booking");
    const hours: BusinessHours =
      layout?.hours || bookingSection?.config?.hours || DEFAULT_HOURS;

    // 3. Find service duration
    const servicesSection = sections.find((s) => s.id === "services");
    const allServices = [
      ...(servicesSection?.config?.items || []),
      ...(layout?.barberiaServices || []),
      ...(layout?.clinicaServices || []),
      ...(layout?.tallerServices || []),
    ];
    const serviceItem: ServiceItem | undefined = allServices.find(
      (s: ServiceItem) => s.name === serviceName
    );
    const duration =
      serviceItem?.duration || bookingSection?.config?.slotDuration || 30;

    if (!hours) return NextResponse.json({ slots: [] });

    // 4. P1-006: Determine if the business is open on this day using its timezone
    // Parse the requested date as a local-midnight boundary in the business timezone
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create a reference point: noon UTC of that day, then check what day it is locally
    const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayName = getBusinessDayName(noonUTC, timezone);
    const dayConfig = hours[dayName as keyof BusinessHours];

    if (!dayConfig || !dayConfig.open) {
      return NextResponse.json({ slots: [] });
    }

    const employeeId = searchParams.get("employeeId");

    // 5. Fetch existing appointments for that business-local date
    // We expand the search window by ±25 hours to account for any timezone offset,
    // then filter precisely using the business timezone.
    const searchStart = new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0));
    const searchEnd = new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59));

    const whereClause: any = {
      businessId,
      date: { gte: searchStart, lte: searchEnd },
      status: { not: "CANCELLED" },
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: whereClause,
      select: { date: true, serviceName: true },
    });

    // 6. Build booked ranges in local minutes-since-midnight
    const bookedRanges = existingAppointments
      .map((app) => {
        // P1-006: Filter using business timezone, not hardcoded Mexico_City
        if (getBusinessDateStr(app.date, timezone) !== dateStr) return null;

        const startMin = getBusinessMinutesSinceMidnight(app.date, timezone);

        // Find the duration of the booked service
        const appService = allServices.find(
          (s: ServiceItem) => s.name === app.serviceName
        );
        const appDuration = appService?.duration || 30;

        return { start: startMin, end: startMin + appDuration };
      })
      .filter(Boolean) as { start: number; end: number }[];

    // 7. Generate available slots
    const openMin = parseTimeToMinutes(dayConfig.from || "09:00");
    const closeMin = parseTimeToMinutes(dayConfig.to || "18:00");
    const slotStep = duration;

    const availableSlots: string[] = [];

    for (
      let current = openMin;
      current + duration <= closeMin;
      current += slotStep
    ) {
      const slotEnd = current + duration;
      const isOverlapping = bookedRanges.some(
        (range) => current < range.end && slotEnd > range.start
      );

      if (!isOverlapping) {
        const h = Math.floor(current / 60)
          .toString()
          .padStart(2, "0");
        const m = (current % 60).toString().padStart(2, "0");
        availableSlots.push(`${h}:${m}`);
      }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error(
      "Error calculando slots:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
