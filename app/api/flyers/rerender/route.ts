import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import sharp from "sharp";
import { z } from "zod";
import { uploadBufferToImgBB } from "@/lib/utils/upload-server";
import { getDerivedFlyerColors } from "@/lib/utils/colorExtractor";
import { generateFlyerSvg, CATEGORY_PHOTOS } from "../generate/route";

const RerenderSchema = z.object({
  businessId: z.string().min(1),
  flyerIndex: z.number().int().min(0).max(2),
  title: z.string().min(1).max(35),
  headline: z.string().min(1).max(120),
  badge: z.string().min(1).max(25),
  ctaText: z.string().min(1).max(35),
  style: z.enum(["promo", "editorial", "action"]).optional(),
  fontFamily: z.enum(["inter", "bebas", "anton", "cinzel", "playfair", "orbitron", "montserrat", "russo"]).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parse = RerenderSchema.safeParse(rawBody);
    if (!parse.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parse.error.format() }, { status: 400 });
    }

    const { businessId, flyerIndex, title, headline, badge, ctaText, style, fontFamily } = parse.data;

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
    const usage = layout.flyersUsage || {};
    const savedFlyers: any[] = Array.isArray(usage.savedFlyers) ? [...usage.savedFlyers] : [];

    const existingFlyer = savedFlyers[flyerIndex];
    if (!existingFlyer) {
      return NextResponse.json({ error: "El flyer a reeditar no existe en el historial" }, { status: 404 });
    }

    const bizName = business.name || "Mi Negocio";
    const bizType = business.type || "general";
    const primaryColor = business.primaryColor || "#4f46e5";
    const secondaryColor = business.secondaryColor || "#0f172a";
    const accentColor = business.accentColor || "#f59e0b";
    const derivedColors = getDerivedFlyerColors(primaryColor, secondaryColor, accentColor);
    const publicUrl = `${business.subdomain || "negocio"}.saas-miniwebs.vercel.app`;

    // Intentar recuperar el fondo limpio original o foto curada de Unsplash
    let photoBuffer: Buffer | null = null;
    const cleanPhotoUrl = existingFlyer.bgPhotoUrl;

    if (cleanPhotoUrl && typeof cleanPhotoUrl === "string" && cleanPhotoUrl.startsWith("http")) {
      try {
        const res = await fetch(cleanPhotoUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          photoBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {}
    }

    if (!photoBuffer) {
      const rubroKey = CATEGORY_PHOTOS[bizType.toLowerCase()] ? bizType.toLowerCase() : "general";
      const rubroPhotos = CATEGORY_PHOTOS[rubroKey] || CATEGORY_PHOTOS.general;
      const photoUrl = rubroPhotos[flyerIndex % rubroPhotos.length];
      try {
        const res = await fetch(photoUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          photoBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {}
    }

    if (!photoBuffer) {
      photoBuffer = await sharp({
        create: {
          width: 1200,
          height: 1200,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 },
        },
      })
        .jpeg()
        .toBuffer();
    }

    const flyerStyle = style || existingFlyer.style || (flyerIndex === 0 ? "promo" : flyerIndex === 1 ? "editorial" : "action");
    const flyerFont = fontFamily || existingFlyer.fontFamily || "inter";

    // ── RENDERIZAR FORMATO 1: FEED ──
    const bgFeed = await sharp(photoBuffer)
      .resize(1080, 1080, { fit: "cover", position: "center" })
      .toBuffer();
    const svgFeed = generateFlyerSvg("feed", flyerStyle, {
      bizName,
      title,
      headline,
      badge,
      ctaText,
      publicUrl,
      colors: derivedColors,
      fontFamily: flyerFont,
    });
    const feedBuffer = await sharp(bgFeed)
      .composite([{ input: Buffer.from(svgFeed), top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    // ── RENDERIZAR FORMATO 2: STORY ──
    const bgStory = await sharp(photoBuffer)
      .resize(1080, 1920, { fit: "cover", position: "center" })
      .toBuffer();
    const svgStory = generateFlyerSvg("story", flyerStyle, {
      bizName,
      title,
      headline,
      badge,
      ctaText,
      publicUrl,
      colors: derivedColors,
      fontFamily: flyerFont,
    });
    const storyBuffer = await sharp(bgStory)
      .composite([{ input: Buffer.from(svgStory), top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    // ── RENDERIZAR FORMATO 3: FACEBOOK ──
    const bgFb = await sharp(photoBuffer)
      .resize(1200, 630, { fit: "cover", position: "attention" })
      .toBuffer();
    const svgFb = generateFlyerSvg("fb", flyerStyle, {
      bizName,
      title,
      headline,
      badge,
      ctaText,
      publicUrl,
      colors: derivedColors,
      fontFamily: flyerFont,
    });
    const fbBuffer = await sharp(bgFb)
      .composite([{ input: Buffer.from(svgFb), top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Subir a CDN ImgBB
    const [feedUrl, storyUrl, fbUrl] = await Promise.all([
      uploadBufferToImgBB(feedBuffer, `${business.id}_flyer_${flyerIndex}_feed_edit.jpg`),
      uploadBufferToImgBB(storyBuffer, `${business.id}_flyer_${flyerIndex}_story_edit.jpg`),
      uploadBufferToImgBB(fbBuffer, `${business.id}_flyer_${flyerIndex}_fb_edit.jpg`),
    ]);

    const updatedFlyer = {
      ...existingFlyer,
      title,
      headline,
      badge,
      ctaText,
      style: flyerStyle,
      fontFamily: flyerFont,
      instagramPost: feedUrl,
      instagramStory: storyUrl,
      facebookPost: fbUrl,
      updatedAt: new Date().toISOString(),
    };

    savedFlyers[flyerIndex] = updatedFlyer;

    // Actualizar base de datos SIN tocar nextAvailableAt ni el cupo mensual
    await prisma.business.update({
      where: { id: business.id },
      data: {
        layoutConfig: {
          ...layout,
          flyersUsage: {
            ...usage,
            savedFlyers,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Flyer re-renderizado con éxito sin consumir cupo.",
      flyer: updatedFlyer,
      savedFlyers,
    });
  } catch (error: any) {
    console.error("Flyer rerender error:", error);
    return NextResponse.json({ error: "Error al re-renderizar flyer", details: error?.message }, { status: 500 });
  }
}
