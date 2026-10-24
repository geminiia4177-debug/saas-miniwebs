import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitRetryAfterMs, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const WaitlistPostSchema = z.object({
  businessId: z.string().min(1),
  clientName: z.string().min(2).max(100),
  clientPhone: z.string().min(8).max(30),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  serviceName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipKey = `waitlist:post:${ip}`;
    if (!(await checkRateLimit(ipKey, 5, 60_000, { failClosed: true }))) {
      const retryAfter = Math.ceil((await getRateLimitRetryAfterMs(ipKey, 60_000)) / 1000);
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = WaitlistPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de lista de espera inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { businessId, clientName, clientPhone, requestedDate, serviceName, notes } = parsed.data;

    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true, publishedConfig: true, status: true },
    });

    if (!biz || biz.status === "BLOCKED" || biz.status === "ARCHIVED") {
      return NextResponse.json({ error: "Negocio no disponible" }, { status: 404 });
    }

    const activeConfig = (biz.publishedConfig || biz.layoutConfig || {}) as any;
    const currentWaitlist = Array.isArray(activeConfig.waitlist) ? activeConfig.waitlist : [];

    const newEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId,
      clientName,
      clientPhone,
      requestedDate,
      serviceName: serviceName || "Turno general",
      notes: notes || "",
      status: "WAITING",
      createdAt: new Date().toISOString(),
    };

    const updatedWaitlist = [...currentWaitlist.slice(-50), newEntry];

    await prisma.business.update({
      where: { id: businessId },
      data: {
        layoutConfig: {
          ...activeConfig,
          waitlist: updatedWaitlist,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "¡Listo! Te avisaremos por WhatsApp en cuanto se libere un turno para ti.",
      entry: newEntry,
    });
  } catch (err: any) {
    console.error("Error en waitlist POST:", err?.message || err);
    return NextResponse.json({ error: "Error interno al unirse a la lista de espera" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }

    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true },
    });

    const waitlist = Array.isArray((biz?.layoutConfig as any)?.waitlist)
      ? (biz?.layoutConfig as any).waitlist
      : [];

    return NextResponse.json({ waitlist });
  } catch (err: any) {
    console.error("Error en waitlist GET:", err?.message || err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
