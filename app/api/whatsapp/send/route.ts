import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { z } from "zod";

// P1-024: Rate limiting for WhatsApp sends
const WA_RATE_WINDOW_MS = 60_000;
const WA_RATE_MAX = 30;

const SendMessageSchema = z.object({
  phone: z.string().min(6).max(50),
  message: z.string().min(1).max(4096),
  businessId: z.string().min(1),
  idempotencyKey: z.string().max(128).optional().nullable(),
});

export async function POST(request: Request) {
  const { session, error: sessionError } = await requireSession();
  if (sessionError) return sessionError;

  try {
    const rawBody = await request.json();
    const parsed = SendMessageSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { phone, message, businessId, idempotencyKey } = parsed.data;

    // P1-021: Verify ownership — owner or admin only
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    // P1-024: Rate limit per business
    const rateLimitKey = `wa:${businessId}:${session.user.id}`;
    if (!checkRateLimit(rateLimitKey, WA_RATE_MAX, WA_RATE_WINDOW_MS)) {
      const retryAfter = Math.ceil(
        getRateLimitRetryAfterMs(rateLimitKey, WA_RATE_WINDOW_MS) / 1000
      );
      return NextResponse.json(
        { error: "Demasiados mensajes en poco tiempo. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // P1-024: Check Business.status before enqueuing — never send for BLOCKED or ARCHIVED
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { status: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (business.status === "BLOCKED" || business.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Este negocio no puede enviar mensajes." },
        { status: 403 }
      );
    }

    // P1-022: Idempotency support — prevent duplicate messages
    try {
      const queuedMessage = await prisma.whatsappMessageQueue.create({
        data: {
          businessId,
          toPhone: phone,
          message,
          idempotencyKey: idempotencyKey || null,
        },
      });

      return NextResponse.json({ success: true, queuedMessageId: queuedMessage.id });
    } catch (e: any) {
      if (e.code === "P2002" && idempotencyKey) {
        // Unique constraint on idempotencyKey — return existing record
        const existing = await prisma.whatsappMessageQueue.findUnique({
          where: { idempotencyKey },
          select: { id: true },
        });
        return NextResponse.json({
          success: true,
          queuedMessageId: existing?.id,
          duplicate: true,
        });
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error encolando mensaje WhatsApp:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
  }
}
