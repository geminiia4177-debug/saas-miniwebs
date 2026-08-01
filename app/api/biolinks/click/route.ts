import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { linkId, businessId } = await req.json();

    if (!linkId || !businessId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // We fetch the business to update the layoutConfig.biolinks.items
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, layoutConfig: true },
    });

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const config = biz.layoutConfig as any;
    if (config?.biolinks?.items) {
      const items = config.biolinks.items.map((item: any) => {
        // Find the specific item. If item.id doesn't exist, we fallback to comparing url (less safe but works for legacy)
        if (item.id === linkId) {
          return { ...item, clicks: (item.clicks || 0) + 1 };
        }
        return item;
      });

      config.biolinks.items = items;

      await prisma.business.update({
        where: { id: businessId },
        data: { layoutConfig: config },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
