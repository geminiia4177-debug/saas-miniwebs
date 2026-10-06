import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";
import { z } from "zod";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

const FlyerRequestSchema = z.object({
  businessId: z.string().min(1).max(100),
  goal: z.enum(["promo", "services", "turnos", "general"]).optional().default("general"),
  customPrompt: z.string().max(500).optional().default(""),
  adminForce: z.boolean().optional().default(false),
});

interface FlyerConcept {
  id: string;
  title: string;
  headline: string;
  badge: string;
  ctaText: string;
  imagePrompt: string;
}

// ── FOTOGRAFÍAS COMERCIALES DE ALTA DEFINICIÓN POR RUBRO ──
const CATEGORY_PHOTOS: Record<string, string[]> = {
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

function escapeXml(unsafe: string): string {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number): string[] {
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

    const lastGeneratedAt = usage.lastGeneratedAt ? new Date(usage.lastGeneratedAt) : null;
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
    const publicUrl = `${business.subdomain || "negocio"}.saas-miniwebs.vercel.app`;

    // ── 1. GENERAR 3 CONCEPTOS PUBLICITARIOS CON IA ──
    const promptInstructions = `Actúa como Director Creativo de Publicidad para Redes Sociales.
Diseña exactamente 3 conceptos creativos de flyers publicitarios de alto impacto comercial para "${bizName}" (Rubro: ${bizType}).
Colores de marca: Principal ${primaryColor}, Secundario ${secondaryColor}, Acento ${accentColor}.
Objetivo de campaña: ${goal}.
Instrucción adicional del usuario: "${customPrompt || "Crear flyers profesionales e impactantes"}".

Cada uno de los 3 flyers debe tener una temática publicitaria diferente:
1. Flyer 1: Oferta o Promo Especial (descuento, beneficio exclusivo o bienvenida).
2. Flyer 2: Servicios Estrella o Experiencia de Calidad (enfoque en la maestría y detalles del servicio).
3. Flyer 3: Llamado a la Acción para Reservar / Visitar (turnos disponibles esta semana, cupos limitados).

Para cada flyer, genera:
- "title": Título principal publicitario (3 a 5 palabras, directo, en MAYÚSCULAS o impacto).
- "headline": Frase persuasiva explicativa (1 o 2 oraciones, máximo 90 caracteres).
- "badge": Etiqueta promocional destacada (ej: "20% OFF", "Turnos Online", "Calidad VIP").
- "ctaText": Llamado a la acción del botón (ej: "RESERVAR TURNO ONLINE", "CONOCER SERVICIOS", "AGENDAR HOY").
- "imagePrompt": Prompt en inglés descriptivo.

Responde ÚNICAMENTE en JSON válido con el siguiente formato:
{
  "concepts": [
    {
      "id": "1",
      "title": "BIENVENIDO AL ESTILO",
      "headline": "Disfrutá un 20% de descuento en tu primera visita y afeitado tradicional.",
      "badge": "20% OFF BIENVENIDA",
      "ctaText": "RESERVAR TURNO ONLINE",
      "imagePrompt": "commercial photography of luxury barbershop..."
    },
    ...
  ]
}`;

    let concepts: FlyerConcept[] = [];

    // Intento 1: Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest"];
        for (const m of models) {
          try {
            const res = await ai.models.generateContent({
              model: m,
              contents: promptInstructions,
            });
            if (res.text) {
              const cleaned = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed.concepts) && parsed.concepts.length >= 3) {
                concepts = parsed.concepts.slice(0, 3);
                break;
              }
            }
          } catch {
            // probar siguiente
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
          concepts = parsed.concepts.slice(0, 3);
        }
      } catch (e) {
        console.warn("Groq flyer concepts failed:", e);
      }
    }

    // Fallback de alta calidad temático
    if (concepts.length < 3) {
      concepts = [
        {
          id: "1",
          title: "BIENVENIDO AL ESTILO",
          headline: `Disfrutá un 20% de descuento en tu primera visita en ${bizName}.`,
          badge: "20% OFF BIENVENIDA",
          ctaText: "RESERVAR TURNO ONLINE",
          imagePrompt: `commercial luxury advertising photography for ${bizType}`,
        },
        {
          id: "2",
          title: "MAESTRÍA EN CADA SERVICIO",
          headline: "Calidad, dedicación y el mejor cuidado profesional en cada detalle.",
          badge: "CALIDAD PREMIUM",
          ctaText: "CONOCER SERVICIOS",
          imagePrompt: `high-end precision service close up for ${bizType}`,
        },
        {
          id: "3",
          title: "TURNOS DISPONIBLES ONLINE",
          headline: "Cupos limitados esta semana. Asegurá tu lugar en solo 3 clics.",
          badge: "CUPOS LIMITADOS",
          ctaText: "AGENDAR AHORA",
          imagePrompt: `modern welcoming storefront visual for ${bizType}`,
        },
      ];
    }

    // ── 2. OBTENER FOTOGRAFÍAS COMERCIALES Y RENDERIZAR CON SHARP ──
    const rubroKey = (CATEGORY_PHOTOS[bizType.toLowerCase()] ? bizType.toLowerCase() : "general");
    const rubroPhotos = CATEGORY_PHOTOS[rubroKey] || CATEGORY_PHOTOS.general;

    const generatedFlyers = await Promise.all(
      concepts.map(async (concept, idx) => {
        // Seleccionar foto específica del concepto
        const photoUrl = rubroPhotos[idx % rubroPhotos.length];
        let photoBuffer: Buffer | null = null;

        try {
          const res = await fetch(photoUrl, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            photoBuffer = Buffer.from(await res.arrayBuffer());
          }
        } catch (fetchErr) {
          console.warn("Photo fetch error, using luxury gradient fallback:", fetchErr);
        }

        // Si falló el fetch, generamos un fondo degrade de diseño de emergencia
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

        const safeBizName = escapeXml(bizName.toUpperCase());
        const safeTitle = escapeXml(concept.title.toUpperCase());
        const safeHeadline = escapeXml(concept.headline);
        const safeBadge = escapeXml(concept.badge.toUpperCase());
        const safeCta = escapeXml(concept.ctaText.toUpperCase());
        const safeUrl = escapeXml(publicUrl);

        // ── FORMATO 1: FEED (1080 x 1080, 1:1) ──
        const bgFeed = await sharp(photoBuffer)
          .resize(1080, 1080, { fit: "cover", position: "center" })
          .toBuffer();

        const titleFeedLines = wrapText(safeTitle, 22);
        const headlineFeedLines = wrapText(safeHeadline, 42);

        const svgFeed = `
          <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="overlayFeed" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#020617" stop-opacity="0.84" />
                <stop offset="35%" stop-color="#020617" stop-opacity="0.45" />
                <stop offset="70%" stop-color="#020617" stop-opacity="0.78" />
                <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
              </linearGradient>
              <linearGradient id="badgeGradFeed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${accentColor}" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
              <linearGradient id="btnGradFeed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${primaryColor}" />
                <stop offset="100%" stop-color="#3730a3" />
              </linearGradient>
              <filter id="glowFeed">
                <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="#000000" flood-opacity="0.85"/>
              </filter>
            </defs>

            <!-- Overlay de oscurecimiento fotográfico -->
            <rect width="1080" height="1080" fill="url(#overlayFeed)" />

            <!-- Marco decorativo exterior -->
            <rect x="36" y="36" width="1008" height="1008" rx="28" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
            <rect x="48" y="48" width="984" height="984" rx="20" fill="none" stroke="${primaryColor}" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="8 6" />

            <!-- Encabezado: Marca -->
            <g filter="url(#glowFeed)">
              <rect x="330" y="80" width="420" height="52" rx="26" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
              <text x="540" y="113" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#F8FAFC" text-anchor="middle" letter-spacing="3">${safeBizName}</text>
            </g>

            <!-- Badge Promocional -->
            <g filter="url(#glowFeed)">
              <rect x="350" y="220" width="380" height="64" rx="32" fill="url(#badgeGradFeed)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
              <text x="540" y="262" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">★ ${safeBadge} ★</text>
            </g>

            <!-- Título Principal -->
            <g filter="url(#glowFeed)">
              <text x="540" y="420" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
                ${titleFeedLines.map((line, lIdx) => `<tspan x="540" dy="${lIdx === 0 ? 0 : 64}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Tarjeta con Descripción Persuasiva -->
            <g filter="url(#glowFeed)">
              <rect x="140" y="530" width="800" height="140" rx="20" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
              <text x="540" y="590" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#E2E8F0" text-anchor="middle">
                ${headlineFeedLines.map((line, lIdx) => `<tspan x="540" dy="${lIdx === 0 ? 0 : 38}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Botón de Llamado a la Acción -->
            <g filter="url(#glowFeed)">
              <rect x="290" y="740" width="500" height="88" rx="44" fill="url(#btnGradFeed)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <text x="540" y="796" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">📅 ${safeCta}</text>
            </g>

            <!-- Footer / Web Link -->
            <g>
              <line x1="120" y1="910" x2="960" y2="910" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
              <text x="540" y="955" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#CBD5E1" text-anchor="middle" letter-spacing="1">🌐 ${safeUrl}</text>
            </g>
          </svg>
        `;

        const feedBuffer = await sharp(bgFeed)
          .composite([{ input: Buffer.from(svgFeed), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // ── FORMATO 2: HISTORIA (1080 x 1920, 9:16) ──
        const bgStory = await sharp(photoBuffer)
          .resize(1080, 1920, { fit: "cover", position: "center" })
          .toBuffer();

        const titleStoryLines = wrapText(safeTitle, 20);
        const headlineStoryLines = wrapText(safeHeadline, 38);

        const svgStory = `
          <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="overlayStory" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#020617" stop-opacity="0.88" />
                <stop offset="25%" stop-color="#020617" stop-opacity="0.48" />
                <stop offset="60%" stop-color="#020617" stop-opacity="0.82" />
                <stop offset="100%" stop-color="#020617" stop-opacity="0.96" />
              </linearGradient>
              <linearGradient id="badgeGradStory" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${accentColor}" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
              <linearGradient id="btnGradStory" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${primaryColor}" />
                <stop offset="100%" stop-color="#3730a3" />
              </linearGradient>
              <filter id="glowStory">
                <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/>
              </filter>
            </defs>

            <rect width="1080" height="1920" fill="url(#overlayStory)" />

            <!-- Marco Exterior -->
            <rect x="44" y="44" width="992" height="1832" rx="36" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
            <rect x="58" y="58" width="964" height="1804" rx="28" fill="none" stroke="${primaryColor}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="10 8" />

            <!-- Encabezado Superior (Zona segura de Stories) -->
            <g filter="url(#glowStory)">
              <rect x="300" y="180" width="480" height="60" rx="30" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
              <text x="540" y="218" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#F8FAFC" text-anchor="middle" letter-spacing="3">${safeBizName}</text>
            </g>

            <!-- Badge Promocional -->
            <g filter="url(#glowStory)">
              <rect x="330" y="340" width="420" height="72" rx="36" fill="url(#badgeGradStory)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
              <text x="540" y="386" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">★ ${safeBadge} ★</text>
            </g>

            <!-- Título Principal -->
            <g filter="url(#glowStory)">
              <text x="540" y="540" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
                ${titleStoryLines.map((line, lIdx) => `<tspan x="540" dy="${lIdx === 0 ? 0 : 72}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Descripción en Story -->
            <g filter="url(#glowStory)">
              <rect x="120" y="1120" width="840" height="180" rx="28" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
              <text x="540" y="1200" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" fill="#E2E8F0" text-anchor="middle">
                ${headlineStoryLines.map((line, lIdx) => `<tspan x="540" dy="${lIdx === 0 ? 0 : 44}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Botón Grande de CTA -->
            <g filter="url(#glowStory)">
              <rect x="250" y="1420" width="580" height="104" rx="52" fill="url(#btnGradStory)" stroke="rgba(255,255,255,0.45)" stroke-width="2.5"/>
              <text x="540" y="1485" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">📅 ${safeCta}</text>
            </g>

            <!-- Footer con Enlace Web -->
            <g>
              <line x1="140" y1="1680" x2="940" y2="1680" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              <text x="540" y="1740" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">🌐 ${safeUrl}</text>
            </g>
          </svg>
        `;

        const storyBuffer = await sharp(bgStory)
          .composite([{ input: Buffer.from(svgStory), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        // ── FORMATO 3: FACEBOOK (1200 x 630, 1.91:1) ──
        const bgFb = await sharp(photoBuffer)
          .resize(1200, 630, { fit: "cover", position: "center" })
          .toBuffer();

        const titleFbLines = wrapText(safeTitle, 32);
        const headlineFbLines = wrapText(safeHeadline, 50);

        const svgFb = `
          <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="overlayFb" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#020617" stop-opacity="0.94" />
                <stop offset="55%" stop-color="#020617" stop-opacity="0.82" />
                <stop offset="100%" stop-color="#020617" stop-opacity="0.5" />
              </linearGradient>
              <linearGradient id="badgeGradFb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${accentColor}" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
              <linearGradient id="btnGradFb" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${primaryColor}" />
                <stop offset="100%" stop-color="#3730a3" />
              </linearGradient>
              <filter id="glowFb">
                <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.8"/>
              </filter>
            </defs>

            <rect width="1200" height="630" fill="url(#overlayFb)" />

            <!-- Marco Exterior -->
            <rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
            <rect x="38" y="38" width="1124" height="554" rx="18" fill="none" stroke="${primaryColor}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="8 6" />

            <!-- Fila Superior: Marca y Badge -->
            <g filter="url(#glowFb)">
              <rect x="80" y="65" width="340" height="42" rx="21" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              <text x="250" y="92" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#F8FAFC" text-anchor="middle" letter-spacing="2">${safeBizName}</text>
            </g>

            <g filter="url(#glowFb)">
              <rect x="440" y="65" width="280" height="42" rx="21" fill="url(#badgeGradFb)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
              <text x="580" y="92" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">★ ${safeBadge} ★</text>
            </g>

            <!-- Título Principal -->
            <g filter="url(#glowFb)">
              <text x="80" y="190" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" letter-spacing="1">
                ${titleFbLines.map((line, lIdx) => `<tspan x="80" dy="${lIdx === 0 ? 0 : 50}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Tarjeta de Descripción -->
            <g filter="url(#glowFb)">
              <rect x="80" y="250" width="700" height="110" rx="18" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
              <text x="110" y="295" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#E2E8F0">
                ${headlineFbLines.map((line, lIdx) => `<tspan x="110" dy="${lIdx === 0 ? 0 : 32}">${line}</tspan>`).join("")}
              </text>
            </g>

            <!-- Botón de CTA -->
            <g filter="url(#glowFb)">
              <rect x="80" y="405" width="420" height="68" rx="34" fill="url(#btnGradFb)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <text x="290" y="448" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">📅 ${safeCta}</text>
            </g>

            <!-- Footer Info -->
            <g>
              <line x1="80" y1="520" x2="800" y2="520" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
              <text x="80" y="555" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="#94A3B8" letter-spacing="1">🌐 ${safeUrl}</text>
            </g>
          </svg>
        `;

        const fbBuffer = await sharp(bgFb)
          .composite([{ input: Buffer.from(svgFb), top: 0, left: 0 }])
          .jpeg({ quality: 90 })
          .toBuffer();

        return {
          id: concept.id || String(idx + 1),
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          imagePrompt: concept.imagePrompt,
          instagramPost: `data:image/jpeg;base64,${feedBuffer.toString("base64")}`,
          instagramStory: `data:image/jpeg;base64,${storyBuffer.toString("base64")}`,
          facebookPost: `data:image/jpeg;base64,${fbBuffer.toString("base64")}`,
        };
      })
    );

    // ── 3. GUARDAR HISTORIAL Y REGISTRAR FECHA DE PRÓXIMO CUPO (1 MES) ──
    const now = new Date();
    const nextAvailableAt = new Date(now);
    nextAvailableAt.setMonth(nextAvailableAt.getMonth() + 1); // Exactamente 1 mes después (ej: 15 Oct -> 15 Nov)

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
      message: "3 flyers generados y guardados con éxito para tu tienda.",
    });
  } catch (error: any) {
    console.error("Flyer generator error:", error);
    return NextResponse.json(
      { error: "Error al generar flyers con IA", details: error?.message },
      { status: 500 }
    );
  }
}
