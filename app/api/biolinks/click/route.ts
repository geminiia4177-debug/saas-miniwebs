import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const CLICK_RATE_WINDOW_MS = 60_000;
const CLICK_RATE_MAX = 30;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimitKey = `biolink:click:${ip}`;
    if (!(await checkRateLimit(rateLimitKey, CLICK_RATE_MAX, CLICK_RATE_WINDOW_MS))) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    const { linkId, businessId } = await req.json();

    if (!linkId || !businessId || typeof linkId !== "string" || typeof businessId !== "string") {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    // We fetch the business to update the layoutConfig.biolinks
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, layoutConfig: true },
    });

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const config = (biz.layoutConfig as any) || {};
    let found = false;

    if (Array.isArray(config?.biolinks?.items)) {
      config.biolinks.items = config.biolinks.items.map((item: any) => {
        if (item.id === linkId || item.url === linkId) {
          found = true;
          return { ...item, clicks: (item.clicks || 0) + 1 };
        }
        return item;
      });
    }

    if (Array.isArray(config?.biolinks?.links)) {
      config.biolinks.links = config.biolinks.links.map((item: any) => {
        if (item.id === linkId || item.url === linkId) {
          found = true;
          return { ...item, clicks: (item.clicks || 0) + 1 };
        }
        return item;
      });
    }

    if (!found) {
      return NextResponse.json({ error: "Link not found in business biolinks" }, { status: 404 });
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { layoutConfig: config },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
