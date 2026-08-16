export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { AppointmentService } from "@/lib/appointment-service";

const SLOTS_RATE_WINDOW_MS = 60_000;
const SLOTS_RATE_MAX = 60;

export async function GET(req: Request) {
  // P1-001: Rate limiting with failClosed policy
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rawUrl = new URL(req.url);
  const businessId = rawUrl.searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const rateLimitKey = `slots:${ip}:${businessId}`;
  if (!(await checkRateLimit(rateLimitKey, SLOTS_RATE_MAX, SLOTS_RATE_WINDOW_MS, { failClosed: true }))) {
    const retryAfter = Math.ceil(
      (await getRateLimitRetryAfterMs(rateLimitKey, SLOTS_RATE_WINDOW_MS)) / 1000
    );
    return NextResponse.json(
      { error: "Demasiadas consultas. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const { searchParams } = rawUrl;
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const serviceName = searchParams.get("serviceName") || searchParams.get("serviceId");
  const employeeId = searchParams.get("employeeId");

  if (!dateStr) {
    return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
  }

  try {
    const result = await AppointmentService.fetchAvailableSlots(
      businessId,
      dateStr,
      serviceName,
      employeeId
    );

    if (result.error) {
      return NextResponse.json({ error: result.error, slots: [] }, { status: 400 });
    }

    return NextResponse.json({ slots: result.slots, duration: result.duration });
  } catch (error) {
    console.error("Error fetching slots:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error calculando disponibilidad", slots: [] }, { status: 500 });
  }
}
