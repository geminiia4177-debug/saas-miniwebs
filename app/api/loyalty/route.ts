import { NextResponse } from "next/server";
import { getClientLoyaltyStatus } from "@/lib/loyalty";
import { checkRateLimit, getRateLimitRetryAfterMs, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const LoyaltyQuerySchema = z.object({
  businessId: z.string().min(1),
  phone: z.string().min(8).max(30),
  name: z.string().max(100).optional(),
});

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipKey = `loyalty:${ip}`;
    if (!(await checkRateLimit(ipKey, 20, 60_000, { failClosed: true }))) {
      const retryAfter = Math.ceil((await getRateLimitRetryAfterMs(ipKey, 60_000)) / 1000);
      return NextResponse.json(
        { error: "Demasiadas consultas de fidelización. Intenta en un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name") || undefined;

    const parsed = LoyaltyQuerySchema.safeParse({ businessId, phone, name });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros de fidelización inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = await getClientLoyaltyStatus(
      parsed.data.businessId,
      parsed.data.phone,
      parsed.data.name
    );

    if (!data) {
      return NextResponse.json(
        { error: "Programa de fidelización no disponible para este comercio" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error en loyalty API:", err?.message || err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
