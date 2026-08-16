import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const CLICK_RATE_WINDOW_MS = 60_000;
const CLICK_RATE_MAX = 30;

interface BiolinkItem {
  id?: string | number;
  url?: string;
  clicks?: number;
  [key: string]: unknown;
}

interface BiolinkConfig {
  items?: BiolinkItem[];
  links?: BiolinkItem[];
  [key: string]: unknown;
}

interface BusinessLayout {
  biolinks?: BiolinkConfig;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = `biolink:click:${ip}`;
    if (!(await checkRateLimit(rateLimitKey, CLICK_RATE_MAX, CLICK_RATE_WINDOW_MS, { failClosed: true }))) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as { linkId?: string; businessId?: string };
    const { linkId, businessId } = body;

    if (!linkId || !businessId || typeof linkId !== "string" || typeof businessId !== "string") {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    // P1-002: Atomic update within transaction to prevent lost increments under concurrency
    const updated = await prisma.$transaction(async (tx) => {
      const biz = await tx.business.findUnique({
        where: { id: businessId },
        select: { id: true, layoutConfig: true, publishedConfig: true },
      });

      if (!biz) return null;

      const layout = (biz.layoutConfig || {}) as BusinessLayout;
      const published = (biz.publishedConfig || {}) as BusinessLayout;
      let found = false;

      const incrementInConfig = (cfg: BusinessLayout | undefined) => {
        if (!cfg || !cfg.biolinks) return;
        if (Array.isArray(cfg.biolinks.items)) {
          cfg.biolinks.items = cfg.biolinks.items.map((item) => {
            if (String(item.id) === linkId || item.url === linkId) {
              found = true;
              return { ...item, clicks: (Number(item.clicks) || 0) + 1 };
            }
            return item;
          });
        }
        if (Array.isArray(cfg.biolinks.links)) {
          cfg.biolinks.links = cfg.biolinks.links.map((item) => {
            if (String(item.id) === linkId || item.url === linkId) {
              found = true;
              return { ...item, clicks: (Number(item.clicks) || 0) + 1 };
            }
            return item;
          });
        }
      };

      incrementInConfig(layout);
      incrementInConfig(published);

      if (!found) return "NOT_FOUND";

      await tx.business.update({
        where: { id: businessId },
        data: {
          layoutConfig: layout as object,
          ...(biz.publishedConfig ? { publishedConfig: published as object } : {}),
        },
      });

      return "OK";
    });

    if (!updated || updated === "NOT_FOUND") {
      return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
