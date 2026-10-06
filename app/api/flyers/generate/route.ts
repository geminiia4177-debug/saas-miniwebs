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
});

interface FlyerConcept {
  id: string;
  title: string;
  headline: string;
  badge: string;
  ctaText: string;
  imagePrompt: string;
}

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

    const { businessId, goal, customPrompt } = parseResult.data;

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

    const bizName = business.name || "Mi Negocio";
    const bizType = business.type || "general";
    const primaryColor = business.primaryColor || "#3b82f6";
    const secondaryColor = business.secondaryColor || "#1e293b";
    const accentColor = business.accentColor || primaryColor;

    // ── 1. GENERATE 3 DISTINCT FLYER CONCEPTS WITH AI ──
    const promptInstructions = `Actúa como Director Creativo de Publicidad para Redes Sociales.
Diseña exactamente 3 conceptos creativos de flyers publicitarios de alta conversión para "${bizName}" (Rubro: ${bizType}).
Colores de marca: Principal ${primaryColor}, Secundario ${secondaryColor}, Acento ${accentColor}.
Objetivo de campaña: ${goal}.
Instrucción adicional del usuario: "${customPrompt || "Crear flyers profesionales e impactantes"}".

Cada uno de los 3 flyers debe tener una temática diferente:
1. Flyer 1: Oferta o Promo Especial (descuento, beneficio exclusivo o bienvenida).
2. Flyer 2: Servicios Estrella o Experiencia de Calidad (enfoque en la maestría y detalles del servicio).
3. Flyer 3: Llamado a la Acción para Reservar / Visitar (turnos disponibles esta semana, cupos limitados).

Para cada flyer, genera:
- "title": Título principal publicitario (corto, 3 a 6 palabras).
- "headline": Frase gancho persuasiva (1 oración).
- "badge": Etiqueta promocional destacada (ej: "15% OFF", "Turnos Online", "Edición Especial").
- "ctaText": Llamado a la acción (ej: "Reservá tu turno", "Escribinos", "Conocenos").
- "imagePrompt": Prompt en INGLÉS ultra-detallado para un modelo generativo de imágenes (Nano Banana / Flux / Midjourney).
  Reglas del imagePrompt: Debe describir una fotografía publicitaria comercial de lujo, composición estética con espacio negativo para texto, iluminación de estudio, paleta de colores coherente (${primaryColor}, ${secondaryColor}), sin letras deformes ni texto ilegible, photorealistic commercial social media advertising photography, 8k resolution.

Responde ÚNICAMENTE en JSON válido con el siguiente formato:
{
  "concepts": [
    {
      "id": "1",
      "title": "...",
      "headline": "...",
      "badge": "...",
      "ctaText": "...",
      "imagePrompt": "..."
    },
    ...
  ]
}`;

    let concepts: FlyerConcept[] = [];

    // Try Gemini first
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
            // try next
          }
        }
      } catch (e) {
        console.warn("Gemini flyer concepts failed:", e);
      }
    }

    // Fallback to Groq
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

    // Hard fallback if AI was unavailable
    if (concepts.length < 3) {
      concepts = [
        {
          id: "1",
          title: "Promo Exclusiva de Bienvenida",
          headline: `Disfrutá la mejor experiencia en ${bizName} con un beneficio pensado para vos.`,
          badge: "15% OFF",
          ctaText: "Reservar Turno",
          imagePrompt: `Professional commercial luxury advertisement flyer for ${bizType} called ${bizName}, vibrant modern atmosphere, sophisticated styling with brand colors ${primaryColor} and ${secondaryColor}, studio lighting, copy-space, high-end commercial photography, 8k resolution`,
        },
        {
          id: "2",
          title: "Experiencia & Estilo Superior",
          headline: "Calidad, dedicación y el mejor cuidado en cada detalle.",
          badge: "Calidad Premium",
          ctaText: "Ver Servicios",
          imagePrompt: `Elegant aesthetic showcase for ${bizType} services in ${bizName}, close-up precision details, premium commercial equipment, elegant minimalist background with hints of ${primaryColor}, cinematic lighting, photorealistic, 8k`,
        },
        {
          id: "3",
          title: "Agenda tu Lugar Esta Semana",
          headline: "Cupos limitados. Reservá online tu turno en solo 3 clics.",
          badge: "Turnos Online",
          ctaText: "Agendar Ahora",
          imagePrompt: `Clean modern social media promotional visual for ${bizType} ${bizName}, stylish interior, welcoming ambiance, balanced composition with subtle ${accentColor} accents, commercial advertising shoot, hyperdetailed, 8k`,
        },
      ];
    }

    // ── 2. GENERATE & RESIZE IMAGES WITH SHARP ──
    const generatedFlyers = await Promise.all(
      concepts.map(async (concept, idx) => {
        let baseImageBuffer: Buffer | null = null;

        // Try Gemini Nano Banana / image model first
        if (process.env.GEMINI_API_KEY) {
          const imageModels = ["gemini-2.5-flash-image", "nano-banana-pro-preview", "gemini-3.1-flash-image"];
          for (const imgModel of imageModels) {
            try {
              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              const imgRes = await ai.models.generateContent({
                model: imgModel,
                contents: concept.imagePrompt,
              });
              const parts = imgRes.candidates?.[0]?.content?.parts || [];
              const inlinePart = parts.find((p: any) => p.inlineData?.data);
              if (inlinePart?.inlineData?.data) {
                baseImageBuffer = Buffer.from(inlinePart.inlineData.data, "base64");
                break;
              }
            } catch {
              // quota or not found, proceed to fallback
              break;
            }
          }
        }

        // Fallback to high-speed AI image endpoint (Pollinations / Flux)
        if (!baseImageBuffer) {
          try {
            const safePrompt = encodeURIComponent(
              `${concept.imagePrompt}, commercial advertising flyer, professional aesthetic, no text distortion, 8k`
            );
            const seed = Math.floor(Math.random() * 999999) + idx * 1000;
            const pollUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1080&height=1080&seed=${seed}&nologo=true`;
            const pollRes = await fetch(pollUrl, { signal: AbortSignal.timeout(20000) });
            if (pollRes.ok) {
              baseImageBuffer = Buffer.from(await pollRes.arrayBuffer());
            }
          } catch (fetchErr) {
            console.warn("Pollinations fetch failed for flyer:", fetchErr);
          }
        }

        // Emergency local canvas generation with sharp if network image failed
        if (!baseImageBuffer) {
          baseImageBuffer = await sharp({
            create: {
              width: 1080,
              height: 1080,
              channels: 4,
              background: { r: 15, g: 23, b: 42, alpha: 1 },
            },
          })
            .png()
            .toBuffer();
        }

        // ── 3. RESIZE TO 3 SOCIAL MEDIA FORMATS WITH SHARP ──
        // Format A: Instagram Post (1080 x 1080, 1:1)
        const igPostBuffer = await sharp(baseImageBuffer)
          .resize(1080, 1080, { fit: "cover", position: "center" })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();

        // Format B: Instagram Story / Reel (1080 x 1920, 9:16)
        const igStoryBuffer = await sharp(baseImageBuffer)
          .resize(1080, 1920, {
            fit: "contain",
            background: { r: 10, g: 14, b: 24, alpha: 1 },
          })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();

        // Format C: Facebook Post / Banner (1200 x 630, 1.91:1)
        const fbPostBuffer = await sharp(baseImageBuffer)
          .resize(1200, 630, { fit: "cover", position: "center" })
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();

        return {
          id: concept.id || String(idx + 1),
          title: concept.title,
          headline: concept.headline,
          badge: concept.badge,
          ctaText: concept.ctaText,
          imagePrompt: concept.imagePrompt,
          instagramPost: `data:image/jpeg;base64,${igPostBuffer.toString("base64")}`,
          instagramStory: `data:image/jpeg;base64,${igStoryBuffer.toString("base64")}`,
          facebookPost: `data:image/jpeg;base64,${fbPostBuffer.toString("base64")}`,
        };
      })
    );

    return NextResponse.json({
      success: true,
      flyers: generatedFlyers,
    });
  } catch (error: any) {
    console.error("Flyer generator error:", error);
    return NextResponse.json(
      { error: "Error al generar flyers con IA", details: error?.message },
      { status: 500 }
    );
  }
}
