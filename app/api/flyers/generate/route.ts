import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { z } from "zod";
import { uploadBufferToImgBB } from "@/lib/utils/upload-server";
import { getDerivedFlyerColors } from "@/lib/utils/colorExtractor";
import { renderVectorText, renderVectorTextLines } from "@/lib/utils/vector-text";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

const FlyerRequestSchema = z.object({
  businessId: z.string().min(1).max(100),
  goal: z.enum(["promo", "services", "turnos", "general"]).optional().default("general"),
  customPrompt: z.string().max(500).optional().default(""),
  adminForce: z.boolean().optional().default(false),
});

export interface FlyerConcept {
  id: string;
  title: string;
  headline: string;
  badge: string;
  ctaText: string;
  imagePrompt: string;
  caption?: string;
  hashtags?: string;
  style?: "promo" | "editorial" | "action";
}

// ── FOTOGRAFÍAS COMERCIALES DE ALTA DEFINICIÓN POR RUBRO ──
export const CATEGORY_PHOTOS: Record<string, string[]> = {
  barberia: [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80",
  ],
  estetica: [
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1200&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80",
  ],
  gimnasio: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&q=80",
  ],
  menu: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80",
  ],
  tienda: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
  ],
  lavadero: [
    "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1200&q=80",
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&q=80",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=1200&q=80",
  ],
  taller: [
    "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200&q=80",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&q=80",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80",
  ],
  cancha: [
    "https://images.unsplash.com/photo-1529900241457-19d268d87aa1?w=1200&q=80",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80",
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1200&q=80",
  ],
  clinica: [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80",
  ],
};

export function escapeXml(unsafe: string): string {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapText(text: string, maxChars: number): string[] {
  const words = (text || "").trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// ── GET: OBTENER ESTADO DEL CUPO MENSUAL Y FLYERS GUARDADOS ──
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, userId: true, layoutConfig: true },
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

    const nextAvailableAt = usage.nextAvailableAt ? new Date(usage.nextAvailableAt) : null;
    const now = new Date();

    const canGenerate = isAdmin || !nextAvailableAt || now >= nextAvailableAt;
    const daysRemaining = nextAvailableAt && now < nextAvailableAt
      ? Math.max(1, Math.ceil((nextAvailableAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      success: true,
      canGenerate,
      daysRemaining,
      lastGeneratedAt: usage.lastGeneratedAt || null,
      nextAvailableAt: usage.nextAvailableAt || null,
      savedFlyers: Array.isArray(usage.savedFlyers) ? usage.savedFlyers : [],
    });
  } catch (error: any) {
    console.error("Flyers GET error:", error);
    return NextResponse.json({ error: "Error al consultar estado" }, { status: 500 });
  }
}

// ── BUILD REAL BUSINESS CONTEXT FOR PROMPTING (FM5) ──
function buildBusinessContext(business: any): string {
  const layout = (business.layoutConfig as any) || {};
  const lines: string[] = [];

  // Services & Prices
  const services: Array<{ name?: string; price?: string | number }> = [];
  if (Array.isArray(layout.services)) {
    services.push(...layout.services);
  }
  if (Array.isArray(layout.barbershop?.services)) {
    services.push(...layout.barbershop.services);
  }
  if (services.length > 0) {
    const sList = services.slice(0, 5).map((s) => `${s.name || "Servicio"} ($${s.price || "Consultar"})`).join(", ");
    lines.push(`Servicios principales con precios: ${sList}`);
  }

  // Address
  if (business.address || layout.contact?.address) {
    lines.push(`Dirección: ${business.address || layout.contact?.address}`);
  }

  // Phone / WhatsApp
  const phone = business.phone || business.whatsapp || layout.contact?.phone || layout.contact?.whatsapp;
  if (phone) {
    lines.push(`Contacto WhatsApp: ${phone}`);
  }

  // Hours
  if (layout.contact?.hours) {
    lines.push(`Horarios de atención: ${layout.contact?.hours}`);
  }

  return lines.length > 0 ? `\nInformación real del negocio:\n${lines.join("\n")}` : "";
}

// ── SVG TEMPLATES (FM7: PROMO, EDITORIAL, ACTION) ──
export function generateFlyerSvg(
  format: "feed" | "story" | "fb",
  style: "promo" | "editorial" | "action",
  data: {
    bizName: string;
    title: string;
    headline: string;
    badge: string;
    ctaText: string;
    publicUrl: string;
    colors: ReturnType<typeof getDerivedFlyerColors>;
  }
): string {
  const safeBiz = escapeXml((data.bizName || "Mi Negocio").toUpperCase());
  const safeTitle = escapeXml((data.title || "").toUpperCase());
  const safeHeadline = escapeXml(data.headline || "");
  const safeBadge = escapeXml((data.badge || "PROMO").toUpperCase());
  const safeCta = escapeXml((data.ctaText || "Ver Más").toUpperCase());
  const safeUrl = escapeXml(data.publicUrl || "");
  const { primary, primaryDark, accent, accentDark } = data.colors;

  if (format === "feed") {
    // 1080 x 1080 (1:1)
    const titleLines = wrapText(safeTitle, 22);
    const headlineLines = wrapText(safeHeadline, 42);

    if (style === "editorial") {
      return `
        <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="overlayEd" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#020617" stop-opacity="0.82" />
              <stop offset="38%" stop-color="#020617" stop-opacity="0.18" />
              <stop offset="68%" stop-color="#020617" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#020617" stop-opacity="0.88" />
            </linearGradient>
            <filter id="glowEd"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/></filter>
          </defs>
          <rect width="1080" height="1080" fill="url(#overlayEd)" />
          <!-- Marco editorial fino -->
          <rect x="54" y="54" width="972" height="972" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />
          <rect x="62" y="62" width="956" height="956" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="1" />
          
          <!-- Encabezado sutil -->
          ${renderVectorText(safeBiz, 540, 140, 18, "#E2E8F0", true, "middle")}
          <line x1="420" y1="165" x2="660" y2="165" stroke="${accent}" stroke-width="2" />
          
          <!-- Badge elegante -->
          <g filter="url(#glowEd)">
            <rect x="360" y="240" width="360" height="54" rx="27" fill="rgba(15,23,42,0.85)" stroke="${accent}" stroke-width="1.5"/>
            ${renderVectorText(safeBadge, 540, 274, 20, accent, true, "middle")}
          </g>
          
          <!-- Título elegante centrado -->
          <g filter="url(#glowEd)">
            ${renderVectorTextLines(titleLines, 540, 440, 64, 54, "#FFFFFF", true, "middle")}
          </g>
          
          <!-- Frase editorial -->
          <g filter="url(#glowEd)">
            ${renderVectorTextLines(headlineLines, 540, 620, 38, 24, "#E2E8F0", false, "middle")}
          </g>
          
          <!-- CTA Chic -->
          <g filter="url(#glowEd)">
            <rect x="320" y="760" width="440" height="80" rx="40" fill="${primary}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            ${renderVectorText(safeCta, 540, 810, 20, "#FFFFFF", true, "middle")}
          </g>
          
          <!-- URL footer -->
          ${renderVectorText(safeUrl, 540, 960, 16, "#94A3B8", true, "middle")}
        </svg>
      `;
    }

    if (style === "action") {
      return `
        <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="overlayAct" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#020617" stop-opacity="0.84" />
              <stop offset="35%" stop-color="#020617" stop-opacity="0.18" />
              <stop offset="65%" stop-color="#020617" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#020617" stop-opacity="0.90" />
            </linearGradient>
            <linearGradient id="btnGradAct" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${primaryDark}" />
            </linearGradient>
            <filter id="glowAct"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/></filter>
          </defs>
          <rect width="1080" height="1080" fill="url(#overlayAct)" />
          
          <!-- Cabecera moderna con punto activo -->
          <g filter="url(#glowAct)">
            <rect x="100" y="80" width="880" height="60" rx="16" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
            <circle cx="140" cy="110" r="8" fill="#10B981"/>
            ${renderVectorText(safeBiz, 170, 117, 18, "#FFFFFF", true, "left")}
            <rect x="740" y="93" width="220" height="34" rx="17" fill="${accent}" />
            ${renderVectorText(safeBadge, 850, 116, 14, "#090D16", true, "middle")}
          </g>
          
          <!-- Título Dinámico -->
          <g filter="url(#glowAct)">
            ${renderVectorTextLines(titleLines, 540, 380, 68, 58, "#FFFFFF", true, "middle")}
          </g>
          
          <!-- Glass Card para descripción con viñetas -->
          <g filter="url(#glowAct)">
            <rect x="140" y="520" width="800" height="150" rx="24" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
            ${renderVectorTextLines(headlineLines, 540, 585, 38, 24, "#F1F5F9", false, "middle")}
          </g>
          
          <!-- Botón de Acción Rápida -->
          <g filter="url(#glowAct)">
            <rect x="260" y="750" width="560" height="92" rx="46" fill="url(#btnGradAct)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            ${renderVectorText(safeCta, 540, 808, 24, "#FFFFFF", true, "middle")}
          </g>
          
          <!-- Enlace -->
          ${renderVectorText("WWW - " + safeUrl, 540, 960, 18, "#94A3B8", true, "middle")}
        </svg>
      `;
    }

    // Default: promo
    return `
      <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="overlayFeed" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.80" />
            <stop offset="35%" stop-color="#020617" stop-opacity="0.16" />
            <stop offset="65%" stop-color="#020617" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.88" />
          </linearGradient>
          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accent}" />
            <stop offset="100%" stop-color="${accentDark}" />
          </linearGradient>
          <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${primaryDark}" />
          </linearGradient>
          <filter id="glowFeed"><feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000000" flood-opacity="0.85"/></filter>
        </defs>
        <rect width="1080" height="1080" fill="url(#overlayFeed)" />
        <rect x="36" y="36" width="1008" height="1008" rx="28" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
        <rect x="48" y="48" width="984" height="984" rx="20" fill="none" stroke="${primary}" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="8 6" />

        <g filter="url(#glowFeed)">
          <rect x="330" y="80" width="420" height="52" rx="26" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
          ${renderVectorText(safeBiz, 540, 113, 20, "#F8FAFC", true, "middle")}
        </g>

        <g filter="url(#glowFeed)">
          <rect x="330" y="220" width="420" height="64" rx="32" fill="url(#badgeGrad)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
          <polygon points="360,244 364,254 374,254 366,260 369,270 360,264 351,270 354,260 346,254 356,254" fill="#FFFFFF"/>
          ${renderVectorText(safeBadge, 540, 262, 22, "#FFFFFF", true, "middle")}
          <polygon points="720,244 724,254 734,254 726,260 729,270 720,264 711,270 714,260 706,254 716,254" fill="#FFFFFF"/>
        </g>

        <g filter="url(#glowFeed)">
          ${renderVectorTextLines(titleLines, 540, 420, 64, 56, "#FFFFFF", true, "middle")}
        </g>

        <g filter="url(#glowFeed)">
          <rect x="140" y="530" width="800" height="140" rx="20" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
          ${renderVectorTextLines(headlineLines, 540, 590, 38, 24, "#E2E8F0", false, "middle")}
        </g>

        <g filter="url(#glowFeed)">
          <rect x="290" y="740" width="500" height="88" rx="44" fill="url(#btnGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          ${renderVectorText(safeCta, 540, 796, 22, "#FFFFFF", true, "middle")}
        </g>

        <line x1="120" y1="910" x2="960" y2="910" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        ${renderVectorText("WWW - " + safeUrl, 540, 955, 18, "#CBD5E1", true, "middle")}
      </svg>
    `;
  }

  if (format === "story") {
    // 1080 x 1920 (9:16)
    const titleLines = wrapText(safeTitle, 20);
    const headlineLines = wrapText(safeHeadline, 38);

    return `
      <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="overlaySt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#020617" stop-opacity="0.88" />
            <stop offset="25%" stop-color="#020617" stop-opacity="0.48" />
            <stop offset="60%" stop-color="#020617" stop-opacity="0.82" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
          </linearGradient>
          <linearGradient id="badgeGradSt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accent}" />
            <stop offset="100%" stop-color="${accentDark}" />
          </linearGradient>
          <linearGradient id="btnGradSt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${primaryDark}" />
          </linearGradient>
          <filter id="glowSt"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/></filter>
        </defs>
        <rect width="1080" height="1920" fill="url(#overlaySt)" />
        <rect x="44" y="44" width="992" height="1832" rx="36" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
        <rect x="58" y="58" width="964" height="1804" rx="28" fill="none" stroke="${primary}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="10 8" />

        <g filter="url(#glowSt)">
          <rect x="300" y="180" width="480" height="60" rx="30" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
          ${renderVectorText(safeBiz, 540, 218, 22, "#F8FAFC", true, "middle")}
        </g>

        <g filter="url(#glowSt)">
          <rect x="330" y="340" width="420" height="72" rx="36" fill="url(#badgeGradSt)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
          ${renderVectorText(safeBadge, 540, 386, 24, "#FFFFFF", true, "middle")}
        </g>

        <g filter="url(#glowSt)">
          ${renderVectorTextLines(titleLines, 540, 540, 72, 64, "#FFFFFF", true, "middle")}
        </g>

        <g filter="url(#glowSt)">
          <rect x="120" y="1120" width="840" height="180" rx="28" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          ${renderVectorTextLines(headlineLines, 540, 1200, 44, 28, "#E2E8F0", false, "middle")}
        </g>

        <g filter="url(#glowSt)">
          <rect x="250" y="1420" width="580" height="104" rx="52" fill="url(#btnGradSt)" stroke="rgba(255,255,255,0.45)" stroke-width="2.5"/>
          ${renderVectorText(safeCta, 540, 1485, 26, "#FFFFFF", true, "middle")}
        </g>

        <line x1="140" y1="1680" x2="940" y2="1680" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        ${renderVectorText("WWW - " + safeUrl, 540, 1740, 22, "#E2E8F0", true, "middle")}
      </svg>
    `;
  }

  // format === "fb" (1200 x 630, 1.91:1)
  const titleLines = wrapText(safeTitle, 32);
  const headlineLines = wrapText(safeHeadline, 50);

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="overlayFb" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.94" />
          <stop offset="55%" stop-color="#020617" stop-opacity="0.82" />
          <stop offset="100%" stop-color="#020617" stop-opacity="0.5" />
        </linearGradient>
        <linearGradient id="badgeGradFb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accentDark}" />
        </linearGradient>
        <linearGradient id="btnGradFb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${primaryDark}" />
        </linearGradient>
        <filter id="glowFb"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.8"/></filter>
      </defs>
      <rect width="1200" height="630" fill="url(#overlayFb)" />
      <rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
      <rect x="38" y="38" width="1124" height="554" rx="18" fill="none" stroke="${primary}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="8 6" />

      <g filter="url(#glowFb)">
        <rect x="80" y="65" width="340" height="42" rx="21" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        ${renderVectorText(safeBiz, 250, 92, 16, "#F8FAFC", true, "middle")}
      </g>

      <g filter="url(#glowFb)">
        <rect x="440" y="65" width="300" height="42" rx="21" fill="url(#badgeGradFb)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        ${renderVectorText(safeBadge, 590, 92, 15, "#FFFFFF", true, "middle")}
      </g>

      <g filter="url(#glowFb)">
        ${renderVectorTextLines(titleLines, 80, 190, 50, 44, "#FFFFFF", true, "left")}
      </g>

      <g filter="url(#glowFb)">
        <rect x="80" y="250" width="700" height="110" rx="18" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
        ${renderVectorTextLines(headlineLines, 110, 295, 32, 20, "#E2E8F0", false, "left")}
      </g>

      <g filter="url(#glowFb)">
        <rect x="80" y="405" width="420" height="68" rx="34" fill="url(#btnGradFb)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        ${renderVectorText(safeCta, 290, 448, 19, "#FFFFFF", true, "middle")}
      </g>

      <line x1="80" y1="520" x2="800" y2="520" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${renderVectorText("WWW - " + safeUrl, 80, 555, 16, "#94A3B8", true, "left")}
    </svg>
  `;
}

// ── POST: GENERAR 3 FLYERS Y PROCESAR CON SHARP ──
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userKey = `ai:flyers:${session.user.id}`;
    if (!(await checkRateLimit(userKey, RATE_MAX, RATE_WINDOW_MS, { failClosed: false }))) {
      const retryAfter = Math.ceil((await getRateLimitRetryAfterMs(userKey, RATE_WINDOW_MS)) / 1000);
      return NextResponse.json(
        { error: "Demasiadas solicitudes de generación de flyers. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = FlyerRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { businessId, goal, customPrompt, adminForce } = parseResult.data;

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

    // ── VERIFICACIÓN DE CUPO MENSUAL (3 POR TIENDA POR MES) ──
    const currentLayout = (business.layoutConfig as any) || {};
    const existingUsage = currentLayout.flyersUsage || {};

    if (existingUsage.nextAvailableAt && !isAdmin && !adminForce) {
      const nextDate = new Date(existingUsage.nextAvailableAt);
      const now = new Date();
      if (now < nextDate) {
        const formattedDate = nextDate.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const daysLeft = Math.max(1, Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return NextResponse.json(
          {
            error: "Límite mensual alcanzado",
            message: `Ya generaste tus 3 flyers de este mes. Tu próximo cupo de 3 flyers estará disponible el ${formattedDate} (en ${daysLeft} días).`,
            nextAvailableAt: nextDate.toISOString(),
            savedFlyers: existingUsage.savedFlyers || [],
            quotaExceeded: true,
          },
          { status: 403 }
        );
      }
    }

    const bizName = business.name || "Mi Negocio";
    const bizType = business.type || "general";
    const primaryColor = business.primaryColor || "#4f46e5";
    const secondaryColor = business.secondaryColor || "#0f172a";
    const accentColor = business.accentColor || "#f59e0b";
    const derivedColors = getDerivedFlyerColors(primaryColor, secondaryColor, accentColor);
    const publicUrl = `${business.subdomain || "negocio"}.saas-miniwebs.vercel.app`;
    const bizContext = buildBusinessContext(business);

    // ── 1. GENERAR 3 CONCEPTOS PUBLICITARIOS CON IA ESTRUCTURADA (FM4 + FM5 + FM10) ──
    const promptInstructions = `Actúa como Director Creativo Publicitario de Alto Rendimiento para Redes Sociales.
Diseña exactamente 3 conceptos de flyers comerciales profesionales y visualmente atractivos para "${bizName}" (Rubro comercial: ${bizType}).
Objetivo comercial de la campaña: ${goal}.
${bizContext}
Instrucción personalizada del dueño: "${customPrompt || "Crear anuncios de alta conversión comercial"}".

REGLA CRUCIAL SOBRE LA INSTRUCCIÓN PERSONALIZADA:
Si el dueño especificó una temática, estética o estilo particular (por ejemplo: "estilo anime", "cyberpunk", "rockero", "retro 80s", "humor", "manga", "elegante"), DEBES impregnar creativamente esa estética y vocabulario en los títulos, badges, frases (headlines), captions y hashtags, manteniéndolo como una oferta publicitaria del negocio real (ejemplo para barbería con estilo anime: "TRANSFORMACIÓN SAIYAN", badge "POWER UP 20%", frases como "Subí de nivel tu look con precisión legendaria").

Distribución temática y estilo de los 3 flyers:
1. Flyer 1 (style: "promo"): Enfoque en Oferta, Descuento especial, o beneficio de bienvenida.
2. Flyer 2 (style: "editorial"): Enfoque en Calidad, Distinción, Servicios estrella o Maestría artesanal.
3. Flyer 3 (style: "action"): Enfoque en Disponibilidad inmediata, Agendar turnos online hoy, Cupos limitados.

Límites estrictos de longitud:
- title: Máximo 28 caracteres.
- headline: Frase persuasiva, máximo 85 caracteres (menciona servicios o precios reales si están disponibles).
- badge: Máximo 18 caracteres (ej: "20% OFF", "VIP PASS", "NUEVA TEMPORADA").
- ctaText: Máximo 25 caracteres (ej: "RESERVAR TURNO", "VER CATÁLOGO", "PEDIR POR WHATSAPP").
- imagePrompt: Prompt en inglés para imagen de fondo (fotografía comercial limpia, sin letras ni textos).
- caption: Texto persuasivo completo para el post de Instagram (con saltos de línea y emojis atractivos).
- hashtags: 6 a 8 hashtags virales relevantes separados por espacios (ej: #barberia #moda #promocion).

Responde en formato JSON con la siguiente estructura:
{
  "concepts": [
    {
      "id": "1",
      "title": "DESCUENTO EXCLUSIVO",
      "headline": "Disfrutá una experiencia premium con 20% OFF en tu primera visita.",
      "badge": "20% OFF BIENVENIDA",
      "ctaText": "RESERVAR ONLINE",
      "style": "promo",
      "imagePrompt": "commercial advertising photography for ${bizType}, luxury aesthetic, no text",
      "caption": "¡Te damos la bienvenida a lo mejor! Aprovechá un beneficio exclusivo reservando online hoy. ✨",
      "hashtags": "#promo #exclusivo #${bizType.toLowerCase()} #calidad"
    }
  ]
}`;

    let concepts: FlyerConcept[] = [];

    // Intento 1: Gemini con structured output si está disponible
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        for (const m of models) {
          try {
            const res = await ai.models.generateContent({
              model: m,
              contents: promptInstructions,
              config: {
                responseMimeType: "application/json",
              },
            });
            if (res.text) {
              const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed.concepts) && parsed.concepts.length >= 3) {
                concepts = parsed.concepts.slice(0, 3).map((c: any, i: number) => ({
                  id: String(c.id || i + 1),
                  title: String(c.title || "").slice(0, 32),
                  headline: String(c.headline || "").slice(0, 95),
                  badge: String(c.badge || "").slice(0, 22),
                  ctaText: String(c.ctaText || "").slice(0, 28),
                  imagePrompt: String(c.imagePrompt || `commercial photo for ${bizType}`),
                  caption: String(c.caption || ""),
                  hashtags: String(c.hashtags || ""),
                  style: (["promo", "editorial", "action"].includes(c.style) ? c.style : i === 0 ? "promo" : i === 1 ? "editorial" : "action"),
                }));
                break;
              }
            }
          } catch {
            // probar siguiente modelo
          }
        }
      } catch (e) {
        console.warn("Gemini flyer concepts failed:", e);
      }
    }

    // Intento 2: Groq
    if (concepts.length < 3 && process.env.GROQ_API_KEY) {
      try {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const comp = await groq.chat.completions.create({
          messages: [{ role: "user", content: promptInstructions }],
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          temperature: 0.7,
        });
        const text = comp.choices[0]?.message?.content || "";
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.concepts) && parsed.concepts.length >= 3) {
          concepts = parsed.concepts.slice(0, 3).map((c: any, i: number) => ({
            id: String(c.id || i + 1),
            title: String(c.title || "").slice(0, 32),
            headline: String(c.headline || "").slice(0, 95),
            badge: String(c.badge || "").slice(0, 22),
            ctaText: String(c.ctaText || "").slice(0, 28),
            imagePrompt: String(c.imagePrompt || `commercial photo for ${bizType}`),
            caption: String(c.caption || ""),
            hashtags: String(c.hashtags || ""),
            style: (["promo", "editorial", "action"].includes(c.style) ? c.style : i === 0 ? "promo" : i === 1 ? "editorial" : "action"),
          }));
        }
      } catch (e) {
        console.warn("Groq flyer concepts failed:", e);
      }
    }

    // Fallback garantizado de alta conversión
    if (concepts.length < 3) {
      concepts = [
        {
          id: "1",
          title: "BIENVENIDO AL ESTILO",
          headline: `Disfrutá un beneficio especial en tu primera visita a ${bizName}.`,
          badge: "20% OFF BIENVENIDA",
          ctaText: "RESERVAR ONLINE",
          style: "promo",
          imagePrompt: `commercial luxury advertising photography for ${bizType}`,
          caption: `¡Te esperamos en ${bizName}! Descubrí nuestra atención y disfrutá de un beneficio exclusivo agendando online. 🌟`,
          hashtags: `#${bizType} #bienvenida #descuento #estilo #calidad`,
        },
        {
          id: "2",
          title: "MAESTRÍA EN CADA SERVICIO",
          headline: "Calidad, dedicación y el mejor cuidado profesional en cada detalle.",
          badge: "CALIDAD PREMIUM",
          ctaText: "CONOCER SERVICIOS",
          style: "editorial",
          imagePrompt: `high-end precision service close up for ${bizType}`,
          caption: `Cada detalle cuenta. En ${bizName} combinamos pasión, técnica y los mejores productos para darte un resultado impecable. ✨`,
          hashtags: `#${bizType} #calidad #profesional #detalles #experiencia`,
        },
        {
          id: "3",
          title: "TURNOS DISPONIBLES ONLINE",
          headline: "Cupos limitados esta semana. Asegurá tu lugar en solo 3 clics.",
          badge: "CUPOS LIMITADOS",
          ctaText: "AGENDAR AHORA",
          style: "action",
          imagePrompt: `modern welcoming storefront visual for ${bizType}`,
          caption: `¡No te quedes sin tu horario! Agendá tu turno online en menos de 1 minuto ingresando al link de nuestra bio. 🚀`,
          hashtags: `#turnos #online #agenda #${bizType} #disponible`,
        },
      ];
    }

    // ── 2. OBTENER IMÁGENES (FM1: GEMINI IMAGE -> FOTO REAL NEGOCIO -> UNSPLASH -> GRADIENTE) ──
    const rubroKey = CATEGORY_PHOTOS[bizType.toLowerCase()] ? bizType.toLowerCase() : "general";
    const rubroPhotos = CATEGORY_PHOTOS[rubroKey] || CATEGORY_PHOTOS.general;
    const businessGallery: string[] = Array.isArray(currentLayout.gallery) ? currentLayout.gallery : [];

    const generatedFlyers = await Promise.all(
      concepts.map(async (concept, idx) => {
        let photoBuffer: Buffer | null = null;

        // Paso A: Generar imagen de fondo con Pollinations.AI (model flux con fallback a turbo)
        const pollinationKey = process.env.POLLINATIONS_API_KEY || "sk_yYIRTLHDWdurMwtxKH2RwYZ5SlMM4ZLV";
        if (pollinationKey) {
          const modelsToTry = ["flux", "turbo"];
          for (const modelName of modelsToTry) {
            if (photoBuffer) break;
            try {
              const userStyle = customPrompt ? `${customPrompt}, ` : "";
              const isArtistic = /anime|manga|cartoon|dibujo|comic|cyberpunk|pixel|3d|vector/i.test(customPrompt || "");
              const baseSubject = concept.imagePrompt || (isArtistic ? `${customPrompt} ${bizType}` : `commercial advertising photography for ${bizType}`);
              const lighting = "dramatic warm ambient lighting, festive bokeh background, commercial product aesthetic";
              const composition = "centered subject, shallow depth of field, wide empty space at center, top and bottom for text placement";
              const negative = "no text, no letters, no words, no watermark, no human hands, no logos, clean backdrop";
              const finalPrompt = `${userStyle}${baseSubject}, ${lighting}, ${composition}, ${negative}`;
              const encodedPrompt = encodeURIComponent(finalPrompt.slice(0, 380));
              const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${modelName}&width=1024&height=1024&nologo=true&enhance=false&seed=${Math.floor(Math.random() * 999999)}&key=${pollinationKey}`;

              const res = await fetch(pollUrl, {
                headers: {
                  Authorization: `Bearer ${pollinationKey}`,
                },
                signal: AbortSignal.timeout(18000),
              });

              if (res.ok) {
                const ab = await res.arrayBuffer();
                if (ab.byteLength > 2000) {
                  photoBuffer = Buffer.from(ab);
                  break;
                }
              }
            } catch (pollErr) {
              console.warn(`Pollinations AI (${modelName}) failed, checking next model:`, pollErr);
            }
          }
        }

        // Paso B: Intentar Gemini Image (gemini-2.5-flash-image) si estuviese disponible
        if (!photoBuffer && process.env.GEMINI_API_KEY) {
          try {
            const aiImg = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const userStyle = customPrompt ? `${customPrompt}, ` : "";
            const isArtistic = /anime|manga|cartoon|dibujo|comic|cyberpunk|pixel|3d|vector/i.test(customPrompt || "");
            const baseGenre = isArtistic ? "clean artwork" : `commercial advertising photography for ${bizType}`;
            const promptImg = `${userStyle}${concept.imagePrompt || bizType}, ${baseGenre}, high resolution, sharp details, vibrant lighting, clean negative space at center top and bottom, no text, no watermark, no typography`;
            const imgRes = await aiImg.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: promptImg,
              config: {
                responseModalities: ["IMAGE"],
              } as any,
            });

            const candidate = imgRes.candidates?.[0];
            const part = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);
            if (part?.inlineData?.data) {
              photoBuffer = Buffer.from(part.inlineData.data, "base64");
            }
          } catch (imgErr) {
            // Se continúa con el fallback natural sin interrumpir
          }
        }

        // Paso C: Foto real del negocio si existe en su galería
        if (!photoBuffer && businessGallery[idx]) {
          try {
            const res = await fetch(businessGallery[idx], { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              photoBuffer = Buffer.from(await res.arrayBuffer());
            }
          } catch {
            // Continúa a Unsplash
          }
        }

        // Paso D: Foto comercial curada en alta resolución
        if (!photoBuffer) {
          const photoUrl = rubroPhotos[idx % rubroPhotos.length];
          try {
            const res = await fetch(photoUrl, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              photoBuffer = Buffer.from(await res.arrayBuffer());
            }
          } catch {
            // Continúa a gradiente
          }
        }

        // Paso E: Gradiente de emergencia elegante con Sharp
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

        const flyerStyle = concept.style || (idx === 0 ? "promo" : idx === 1 ? "editorial" : "action");

        // ── RENDERIZAR FORMATO 1: FEED (1080 x 1080) ──
        const bgFeed = await sharp(photoBuffer)
          .resize(1080, 1080, { fit: "cover", position: "center" })
          .toBuffer();
        const svgFeed = generateFlyerSvg("feed", flyerStyle, {
          bizName,
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          publicUrl,
          colors: derivedColors,
        });
        const feedBuffer = await sharp(bgFeed)
          .composite([{ input: Buffer.from(svgFeed), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // ── RENDERIZAR FORMATO 2: STORY (1080 x 1920) ──
        const bgStory = await sharp(photoBuffer)
          .resize(1080, 1920, { fit: "cover", position: "center" })
          .toBuffer();
        const svgStory = generateFlyerSvg("story", flyerStyle, {
          bizName,
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          publicUrl,
          colors: derivedColors,
        });
        const storyBuffer = await sharp(bgStory)
          .composite([{ input: Buffer.from(svgStory), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // ── RENDERIZAR FORMATO 3: FACEBOOK (1200 x 630) ──
        const bgFb = await sharp(photoBuffer)
          .resize(1200, 630, { fit: "cover", position: "attention" })
          .toBuffer();
        const svgFb = generateFlyerSvg("fb", flyerStyle, {
          bizName,
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          publicUrl,
          colors: derivedColors,
        });
        const fbBuffer = await sharp(bgFb)
          .composite([{ input: Buffer.from(svgFb), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // ── FM2: SUBIR A CDN (ImgBB) PARA ALIVIANAR LA BASE DE DATOS ──
        const [feedUrl, storyUrl, fbUrl, bgUrl] = await Promise.all([
          uploadBufferToImgBB(feedBuffer, `${business.id}_flyer_${idx}_feed.jpg`),
          uploadBufferToImgBB(storyBuffer, `${business.id}_flyer_${idx}_story.jpg`),
          uploadBufferToImgBB(fbBuffer, `${business.id}_flyer_${idx}_fb.jpg`),
          uploadBufferToImgBB(photoBuffer, `${business.id}_flyer_${idx}_bg.jpg`),
        ]);

        return {
          id: concept.id || String(idx + 1),
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          imagePrompt: concept.imagePrompt,
          caption: concept.caption || "",
          hashtags: concept.hashtags || "",
          style: flyerStyle,
          instagramPost: feedUrl,
          instagramStory: storyUrl,
          facebookPost: fbUrl,
          bgPhotoUrl: bgUrl,
        };
      })
    );

    // ── 3. GUARDAR HISTORIAL Y REGISTRAR FECHA DE PRÓXIMO CUPO (1 MES) (FM9) ──
    const now = new Date();
    const nextAvailableAt = new Date(now);
    nextAvailableAt.setMonth(nextAvailableAt.getMonth() + 1);

    const updatedLayoutConfig = {
      ...currentLayout,
      flyersUsage: {
        lastGeneratedAt: now.toISOString(),
        nextAvailableAt: nextAvailableAt.toISOString(),
        generationCount: (existingUsage.generationCount || 0) + 1,
        savedFlyers: generatedFlyers,
      },
    };

    await prisma.business.update({
      where: { id: business.id },
      data: { layoutConfig: updatedLayoutConfig },
    });

    return NextResponse.json({
      success: true,
      flyers: generatedFlyers,
      lastGeneratedAt: now.toISOString(),
      nextAvailableAt: nextAvailableAt.toISOString(),
      daysRemaining: Math.max(1, Math.ceil((nextAvailableAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
      message: "3 flyers profesionales generados con éxito para tu marca.",
    });
  } catch (error: any) {
    console.error("Flyer generator error:", error);
    return NextResponse.json(
      { error: "Error al generar flyers con IA", details: error?.message },
      { status: 500 }
    );
  }
}
