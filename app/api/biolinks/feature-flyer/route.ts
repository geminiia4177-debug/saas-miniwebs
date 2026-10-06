import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const FeatureFlyerSchema = z.object({
  businessId: z.string().min(1),
  title: z.string().min(1),
  badge: z.string().min(1),
  imageUrl: z.string().min(1),
  targetUrl: z.string().optional(),
  daysValid: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parse = FeatureFlyerSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parse.error.format() }, { status: 400 });
    }

    const { businessId, title, badge, imageUrl, targetUrl, daysValid } = parse.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (business.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const layout = (business.layoutConfig as any) || {};
    const biolinks = layout.biolinks || {};
    const items: any[] = Array.isArray(biolinks.items) ? [...biolinks.items] : [];

    const now = new Date();
    const expiryDate = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);

    const publicUrl = `https://${business.subdomain || "negocio"}.saas-miniwebs.vercel.app`;
    const finalTargetUrl = targetUrl || publicUrl;

    const newFeaturedItem = {
      id: `promo-${Date.now()}`,
      label: `🔥 ${badge}: ${title}`,
      url: finalTargetUrl,
      thumbnail: imageUrl,
      featured: true,
      animation: "pulse",
      activeFrom: now.toISOString(),
      activeUntil: expiryDate.toISOString(),
      type: "link",
      clicks: 0,
      active: true,
    };

    // Agregar al inicio de los enlaces
    const updatedItems = [newFeaturedItem, ...items];

    const updatedLayout = {
      ...layout,
      biolinks: {
        ...biolinks,
        items: updatedItems,
      },
    };

    await prisma.business.update({
      where: { id: business.id },
      data: {
        layoutConfig: updatedLayout,
        // Si ya tiene publishedConfig, sincronizamos también para que se vea en vivo de inmediato
        ...(business.publishedConfig
          ? {
              publishedConfig: {
                ...(business.publishedConfig as any),
                biolinks: {
                  ...((business.publishedConfig as any).biolinks || {}),
                  items: updatedItems,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Flyer destacado con éxito en BioLinks durante ${daysValid} días.`,
      featuredItem: newFeaturedItem,
    });
  } catch (error: any) {
    console.error("Feature flyer error:", error);
    return NextResponse.json({ error: "Error al destacar en BioLinks" }, { status: 500 });
  }
}
