import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";

// ─── RATE LIMITING: Messages ──────────────────────────────────────────────────
// P1-004: Prevent abuse of the message system and AI bot.
const MSG_RATE_WINDOW_MS = 60_000;
const MSG_RATE_MAX = 10;

// Color normalization map: Translates colloquial Spanish/English names and hex variations to clean HEX codes
const COLOR_MAP: Record<string, string> = {
  "rojo": "#EF4444",
  "red": "#EF4444",
  "carmesí": "#DC2626",
  "carmesi": "#DC2626",
  "azul": "#3B82F6",
  "blue": "#3B82F6",
  "azul marino": "#1E3A8A",
  "verde": "#10B981",
  "green": "#10B981",
  "esmeralda": "#059669",
  "amarillo": "#FACC15",
  "yellow": "#FACC15",
  "dorado": "#F59E0B",
  "oro": "#D97706",
  "gold": "#D97706",
  "naranja": "#F97316",
  "orange": "#F97316",
  "morado": "#8B5CF6",
  "violeta": "#8B5CF6",
  "purple": "#8B5CF6",
  "rosa": "#EC4899",
  "pink": "#EC4899",
  "negro": "#111827",
  "black": "#111827",
  "blanco": "#FFFFFF",
  "white": "#FFFFFF",
  "gris": "#6B7280",
  "gray": "#6B7280",
  "grey": "#6B7280"
};

function normalizeHexColor(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const str = val.trim().toLowerCase();
  if (COLOR_MAP[str]) return COLOR_MAP[str];
  const hexCandidate = str.startsWith("#") ? str : `#${str}`;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hexCandidate)) {
    return hexCandidate.toUpperCase();
  }
  return undefined;
}

function inferColorFromText(text: string): { primary: string; bg?: string } | null {
  if (!text || typeof text !== "string") return null;
  const t = text.toLowerCase();
  if (t.includes("azul") || t.includes("blue") || t.includes("celeste")) {
    return { primary: "#2563EB", bg: t.includes("fondo") ? "#0B132B" : undefined };
  }
  if (t.includes("rojo") || t.includes("red") || t.includes("carmesí") || t.includes("carmesi")) {
    return { primary: "#EF4444", bg: t.includes("fondo") ? "#180606" : undefined };
  }
  if (t.includes("verde") || t.includes("green") || t.includes("esmeralda")) {
    return { primary: "#10B981", bg: t.includes("fondo") ? "#04140D" : undefined };
  }
  if (t.includes("morado") || t.includes("violeta") || t.includes("púrpura") || t.includes("purpura") || t.includes("purple")) {
    return { primary: "#8B5CF6", bg: t.includes("fondo") ? "#11091F" : undefined };
  }
  if (t.includes("dorado") || t.includes("oro") || t.includes("gold") || t.includes("amarillo") || t.includes("yellow")) {
    return { primary: "#F59E0B", bg: t.includes("fondo") ? "#171206" : undefined };
  }
  if (t.includes("rosa") || t.includes("rosado") || t.includes("fucsia") || t.includes("pink")) {
    return { primary: "#EC4899", bg: t.includes("fondo") ? "#1C0813" : undefined };
  }
  if (t.includes("negro") || t.includes("black") || t.includes("oscuro") || t.includes("dark")) {
    return { primary: "#3B82F6", bg: "#09090B" };
  }
  return null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  try {
    let whereClause: Prisma.MessageWhereInput = {};
    if (session.user.role === "USER") {
      // User can only see messages for their businesses
      const biz = await prisma.business.findMany({ where: { userId: session.user.id }, select: { id: true } });
      const bizIds = biz.map(b => b.id);
      whereClause = { businessId: { in: bizIds } };
    } else {
      // ADMIN
      if (businessId) {
        whereClause = { businessId };
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        business: { select: { name: true, subdomain: true } }
      }
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { businessId, content } = await req.json();

    if (!businessId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // P1-020: Enforce message content length limit
    if (typeof content !== "string" || content.length > 2000) {
      return NextResponse.json({ error: "El mensaje es demasiado largo (máximo 2000 caracteres)." }, { status: 400 });
    }
    
    // P1-001: Rate limit message creation by user with failClosed
    const userKey = `msg:user:${session.user.id}`;
    if (!(await checkRateLimit(userKey, MSG_RATE_MAX, MSG_RATE_WINDOW_MS, { failClosed: true }))) {
      const retryAfter = Math.ceil(await getRateLimitRetryAfterMs(userKey, MSG_RATE_WINDOW_MS) / 1000);
      return NextResponse.json(
        { error: "Estás enviando mensajes demasiado rápido. Intenta en un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // SEC-P0-002 Fix: Validate ownership before creating message
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    const senderType = session.user.role === "ADMIN" ? "ADMIN" : "USER";

    const msg = await prisma.message.create({
      data: {
        businessId,
        content,
        senderType,
        isRead: false
      },
      include: {
        business: { select: { name: true } }
      }
    });

    // --- AI LOGIC ---
    if (senderType === "USER") {
      const recentMsgs = await prisma.message.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        take: 10
      });

      // Check if conversation was transferred to human recently
      const latestIntervention = recentMsgs.find(m => 
        m.senderType === "ADMIN" || 
        m.content.includes("[TRANSFERIDO DESDE IA]") || 
        m.content.includes("[CONSULTA_FINALIZADA]")
      );

      let hasHumanIntervention = false;
      if (latestIntervention) {
        if (!latestIntervention.content.includes("[CONSULTA_FINALIZADA]")) {
          hasHumanIntervention = true;
        }
      }

      if (!hasHumanIntervention) {
        if (!process.env.GEMINI_API_KEY) {
          console.error("Gemini API key not configured");
          const fallbackMsg = await prisma.message.create({
            data: {
              businessId,
              content: "El asistente de IA no está configurado (falta GEMINI_API_KEY en variables de entorno). Por favor contacta al administrador.",
              senderType: "AI",
              isRead: false
            }
          });
          return NextResponse.json({
            userMsg: msg,
            aiMsg: fallbackMsg
          });
        }

        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          // Fetch business info and today's appointments in parallel for fast execution
          const [bizInfo, todayAppointments] = await Promise.all([
            prisma.business.findUnique({
              where: { id: businessId },
              select: {
                id: true,
                name: true,
                type: true,
                subdomain: true,
                customDomain: true,
                status: true,
                primaryColor: true,
                secondaryColor: true,
                accentColor: true,
                fontFamily: true,
                description: true,
                phone: true,
                layoutConfig: true,
                publishedConfig: true,
                _count: {
                  select: {
                    appointments: true,
                    employees: true,
                  }
                }
              }
            }),
            prisma.appointment.findMany({
              where: {
                businessId,
                date: {
                  gte: startOfDay,
                  lte: endOfDay
                }
              },
              select: {
                clientName: true,
                clientPhone: true,
                serviceName: true,
                date: true,
                status: true
              },
              take: 10,
              orderBy: { date: "asc" }
            })
          ]);
          
          const currentLayout = (bizInfo?.layoutConfig as Record<string, any>) || {};
          const heroTitle = currentLayout.heroTitle || bizInfo?.name || "Mi Negocio";
          const heroTitleColor = currentLayout.heroTitleColor || "#ffffff";
          const heroSubtitle = currentLayout.heroSubtitle || bizInfo?.description || "";
          const primaryColor = bizInfo?.primaryColor || "#6366f1";
          const secondaryColor = bizInfo?.secondaryColor || "#a855f7";
          const accentColor = bizInfo?.accentColor || "#f59e0b";
          const fontFamily = bizInfo?.fontFamily || "sans";
          const currentSections = Array.isArray(currentLayout.sections)
            ? currentLayout.sections.map((s: any) => `${s.label || s.id} (${s.visible !== false ? "visible" : "oculta"})`).join(", ")
            : "hero, servicios, reservas, contacto";

          const systemPrompt = `
Eres el Asistente Inteligente y Copiloto Oficial del Panel de Control de SaaS MiniWebs para "${bizInfo?.name || "tu negocio"}".
Tu misión tiene dos propósitos:
1. Guiar y resolver consultas sobre el panel, turnos y ventas.
2. EJECUTAR MODIFICACIONES DIRECTAS en el sitio web del negocio cuando el usuario te lo pida en el chat (por ejemplo, cambiar colores de textos, fondos, títulos, tipografías, WhatsApp, etc.).

FECHA Y HORA ACTUAL: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

════════════════════════════════════════════════════════════════════════════════
📊 ESTADO ACTUAL DEL NEGOCIO Y CONFIGURACIÓN VISUAL:
════════════════════════════════════════════════════════════════════════════════
- Negocio: ${bizInfo?.name} (${bizInfo?.type})
- Subdominio: ${bizInfo?.subdomain}.miniwebs.lat ${bizInfo?.customDomain ? `| Dominio: ${bizInfo.customDomain}` : ""}
- Estado de cuenta: ${bizInfo?.status}
- Título principal del Hero: "${heroTitle}"
- Color del Texto del Título: ${heroTitleColor}
- Subtítulo / Slogan: "${heroSubtitle}"
- Colores de Marca:
  * Principal (P): ${primaryColor}
  * Secundario (S): ${secondaryColor}
  * Acento (A): ${accentColor}
- Tipografía Google Fonts: ${fontFamily}
- WhatsApp / Teléfono: ${bizInfo?.phone || currentLayout.whatsapp || "No configurado"}
- Secciones actuales: ${currentSections}
- Turnos para HOY: ${todayAppointments.length}
${todayAppointments.length > 0 ? todayAppointments.map(a => `  • ${a.date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} - ${a.clientName} (${a.serviceName || "Servicio"}) [${a.status}]`).join("\n") : "  (No hay turnos registrados para hoy)"}

════════════════════════════════════════════════════════════════════════════════
⚡ CAPACIDAD DE ACCIÓN DIRECTA (MODIFICAR EL SISTEMA Y WEB):
════════════════════════════════════════════════════════════════════════════════
Si el usuario solicita realizar un cambio en su página o diseño (por ejemplo: "cambiar color del texto del titulo por rojo", "cambia el color a rojo", "cambiar fondo a rojo", "pon color azul", "cambia el color de fondo por azul", "pon de titulo Barbería Royale", "cambia la tipografía a Montserrat", "oculta la sección de video", "cambia el whatsapp a...", o dice "no se aplicó el cambio"):

DEBES INCLUIR OBLIGATORIAMENTE EN TU RESPUESTA EL SIGUIENTE COMANDO ESTRUCTURADO:
|||APPLY_CHANGE:{"changes":{ ... }}|||

¡REGLA ABSOLUTA: NUNCA DIGAS QUE HICISTE O APLICASTE UN CAMBIO SI NO INCLUYES EL BLOQUE |||APPLY_CHANGE:...|||!

¡REGLA FUNDAMENTAL DE COLORES!:
1. Si el usuario pide cambiar el color de la web, botones o color general (ej: "pon color azul", "cambia a azul", "color azul"):
   DEBES asignar SIEMPRE "primaryColor": "#HEX" (ej: "#2563EB" para azul).
2. Si el usuario pide cambiar el color de FONDO (ej: "cambia el color de fondo por azul", "fondo azul", "pon fondo negro"):
   DEBES asignar SIEMPRE:
   - "primaryColor": "#HEX" (ej: "#2563EB" para que los botones, insignias y detalles de toda la web armonicen con el color solicitado)
   - "backgroundColor": "#HEX" (en layoutConfig: ej: "#0B132B" para fondo azul elegante, o "#09090B" para fondo negro)
   - "bookingBgColor": "#HEX" (un tono complementario para la tarjeta de turnos)
   - "footerBgColor": "#HEX" (un tono complementario para el pie de página)
   ¡NUNCA limites el cambio a solo "secondaryColor" o "footerBgColor" cuando te pidan cambiar el color de fondo o el color de la web!

Campos permitidos dentro de "changes":
- "primaryColor": "#HEX" (¡EL MÁS IMPORTANTE! Color principal de marca, BOTONES, CTA "Reservar Turno", insignias y acentos de toda la web. Si el usuario pide cambiar el color de la web, o pide "color azul", "color rojo", "pon botones rojos" o "cambia a azul", DEBES poner "primaryColor" aquí).
- "secondaryColor": "#HEX" (color secundario)
- "accentColor": "#HEX" (color de acento)
- "themeVariant": "clean" | "essential" | "modern" | "dark" | "luxury" | "flow" | "particles" (Si el usuario pide modo oscuro usa "dark" o "essential"; si pide diseño claro usa "clean"; si pide animaciones usa "modern").
- "fontFamily": "'Inter', sans-serif" | "'Roboto', sans-serif" | "'Playfair Display', serif" | "'Montserrat', sans-serif" | "'Oswald', sans-serif" | "sans"
- "name": "Nuevo nombre del negocio"
- "description": "Nueva descripción general"
- "phone": "Nuevo teléfono"
- "buttonStyle": "rounded" | "pill" | "square"
- "layoutConfig": {
    "heroTitle": "nuevo título",
    "heroTitleColor": "#HEX" (¡Usa esto cuando pidan cambiar el color del título o texto principal! Ej: rojo = "#EF4444"),
    "heroSubtitle": "nuevo subtítulo o slogan",
    "heroText": "texto descriptivo",
    "backgroundColor": "#HEX" (Usa esto si piden cambiar el color de fondo general de la web),
    "footerBgColor": "#HEX" (Color de fondo del pie de página),
    "footerTextColor": "#HEX" (Color de texto del pie de página),
    "bookingBgColor": "#HEX" (Color de fondo de la caja de reservas/turnos),
    "instagram": "@usuario",
    "facebook": "enlace_o_usuario",
    "whatsapp": "numero_telefono",
    "tiktok": "@usuario",
    "sections": [{ "id": "video", "visible": false }, { "id": "gallery", "visible": true }]
  }

REGLAS DE COLORES:
- Siempre traduce nombres de colores en español a códigos HEX modernos y atractivos:
  * "rojo" -> "#EF4444" (o carmesí: "#DC2626")
  * "azul" -> "#2563EB" (o azul profundo: "#0B132B" para fondo)
  * "verde" -> "#10B981" (o esmeralda: "#059669")
  * "dorado" -> "#F59E0B" (o oro: "#D97706")
  * "amarillo" -> "#FACC15"
  * "violeta / morado" -> "#8B5CF6"
  * "rosa / fucsia" -> "#EC4899"
  * "negro" -> "#09090B"
  * "blanco" -> "#FFFFFF"
  * "gris" -> "#6B7280"

REGLAS GENERALES:
1. Cuando apliques un cambio con |||APPLY_CHANGE:...|||, confirma en lenguaje natural qué cambio realizaste (ej: "¡Listo! He aplicado el color azul (#2563EB) en los botones, fondo y diseño de tu web. Ya puedes verlo reflejado.").
2. Si el usuario dice "no se aplicó el cambio" o "continúa el problema", vuelve a aplicar el comando |||APPLY_CHANGE:...||| asignando tanto "primaryColor" como los campos de layoutConfig relevantes.
3. Si el usuario solo hace una pregunta informativa sobre cómo usar el sistema, guíalo amablemente sin generar |||APPLY_CHANGE|||.
4. Si el usuario pide soporte humano exclusivo, responde: "|||TRANSFERIR_ASESOR||| Te estoy transfiriendo con un asesor humano del equipo."
5. Mantén un tono ejecutivo, servicial y conciso (máximo 2 a 4 oraciones). No generes código de programación.
`;

          // Build structured conversation history
          const conversationHistory = [...recentMsgs].reverse().map((m) => {
            const safeContent = String(m.content).substring(0, 500);
            if (m.senderType === "USER") {
              return `[USER_MSG]${safeContent}[/USER_MSG]`;
            }
            return `[AI_MSG]${safeContent}[/AI_MSG]`;
          }).join("\n");

          const fullPrompt = systemPrompt + "\n\n## CONVERSACIÓN (más reciente al final):\n" + conversationHistory + "\n\n[AI_MSG]";

          // Preferred model with dynamic fallback in case of high demand / model version changes
          const preferredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
          const candidateModels = [
            preferredModel,
            "gemini-3.5-flash",
            "gemini-3.8-flash"
          ].filter((v, i, a) => a.indexOf(v) === i);

          let responseText = "";
          let lastModelError: any = null;

          for (const m of candidateModels) {
            try {
              const aiResponse = await ai.models.generateContent({
                model: m,
                contents: fullPrompt,
                config: {
                  temperature: 0.2,
                  maxOutputTokens: 500,
                }
              });
              if (aiResponse?.text) {
                responseText = aiResponse.text;
                break;
              }
            } catch (err: any) {
              console.warn(`Gemini model ${m} failed:`, err?.message || err);
              lastModelError = err;
            }
          }

          if (!responseText) {
            console.error("All Gemini models failed. Last error:", lastModelError?.message || lastModelError);
            responseText = "Lo siento, tuve un problema temporal al procesar tu solicitud con el asistente. Por favor intenta nuevamente.";
          }

          // ─── PARSE & EXECUTE ACTIONS (P0-AI-ACTIONS) ─────────────────────────
          let actionApplied = false;
          let appliedChanges: any = null;
          let updatedBusiness: any = null;

          // Robust regex matching both bounded ||| and trailing boundary
          const changeMatch = responseText.match(/\|\|\|APPLY_CHANGE:([\s\S]*?)(?:\|\|\||$)/);
          if (changeMatch && bizInfo) {
            try {
              let rawJson = changeMatch[1].trim();
              // Strip markdown code fences if Gemini included them (e.g. ```json ... ```)
              rawJson = rawJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
              rawJson = rawJson.replace(/^`+|`+$/g, "").trim();

              const parsed = JSON.parse(rawJson);
              const changes = parsed.changes || parsed;

              const updatePayload: Prisma.BusinessUpdateInput = {};

              // Top level safe properties with color sanitization
              let normPrimary = normalizeHexColor(changes.primaryColor);
              let normSecondary = normalizeHexColor(changes.secondaryColor);
              let normAccent = normalizeHexColor(changes.accentColor);

              // Contextual color inference from prompt
              const promptColor = inferColorFromText(content);

              // Auto-sync primaryColor if missing but a color change was intended
              if (!normPrimary) {
                if (promptColor?.primary) {
                  normPrimary = promptColor.primary;
                } else if (normSecondary) {
                  normPrimary = normSecondary;
                } else if (changes.backgroundColor) {
                  const normBg = normalizeHexColor(changes.backgroundColor);
                  if (normBg && normBg !== "#FFFFFF" && normBg !== "#000000") {
                    normPrimary = normBg;
                  }
                }
              }

              if (normPrimary) updatePayload.primaryColor = normPrimary;
              if (normSecondary) updatePayload.secondaryColor = normSecondary;
              if (normAccent) updatePayload.accentColor = normAccent;

              if (changes.fontFamily && typeof changes.fontFamily === "string") {
                updatePayload.fontFamily = changes.fontFamily.trim();
              }
              if (changes.name && typeof changes.name === "string" && changes.name.trim().length > 0) {
                updatePayload.name = changes.name.trim();
              }
              if (changes.description && typeof changes.description === "string") {
                updatePayload.description = changes.description.trim();
              }
              if (changes.phone && typeof changes.phone === "string") {
                updatePayload.phone = changes.phone.trim();
              }

              // Merge layoutConfig safely: supports both nested changes.layoutConfig and top-level shorthand properties
              const existingLayout = (bizInfo.layoutConfig as Record<string, any>) || {};
              const incomingLayout = (changes.layoutConfig as Record<string, any>) || {};

              const layoutDirectKeys = [
                "heroTitle",
                "heroTitleColor",
                "heroSubtitle",
                "heroText",
                "buttonStyle",
                "backgroundType",
                "backgroundImageUrl",
                "backgroundColor",
                "themeVariant",
                "footerBgColor",
                "footerTextColor",
                "bookingBgColor",
                "instagram",
                "facebook",
                "whatsapp",
                "tiktok",
                "sections"
              ];
              for (const key of layoutDirectKeys) {
                if (changes[key] !== undefined && incomingLayout[key] === undefined) {
                  incomingLayout[key] = changes[key];
                }
              }

              // Color sanitization in layout
              if (incomingLayout.heroTitleColor) {
                const norm = normalizeHexColor(incomingLayout.heroTitleColor);
                if (norm) incomingLayout.heroTitleColor = norm;
              }
              if (incomingLayout.backgroundColor) {
                const norm = normalizeHexColor(incomingLayout.backgroundColor);
                if (norm) incomingLayout.backgroundColor = norm;
              } else if (promptColor?.bg) {
                incomingLayout.backgroundColor = promptColor.bg;
              }
              if (incomingLayout.footerBgColor) {
                const norm = normalizeHexColor(incomingLayout.footerBgColor);
                if (norm) incomingLayout.footerBgColor = norm;
              }
              if (incomingLayout.footerTextColor) {
                const norm = normalizeHexColor(incomingLayout.footerTextColor);
                if (norm) incomingLayout.footerTextColor = norm;
              }
              if (incomingLayout.bookingBgColor) {
                const norm = normalizeHexColor(incomingLayout.bookingBgColor);
                if (norm) incomingLayout.bookingBgColor = norm;
              }

              const mergedLayout: Record<string, any> = {
                ...existingLayout,
                ...incomingLayout,
              };

              // Merge sections array safely
              const defaultSections = [
                { id: "hero", label: "Hero / Portada", visible: true },
                { id: "gallery", label: "Galería de Fotos", visible: true },
                { id: "services", label: "Servicios", visible: true },
                { id: "video", label: "Video Destacado", visible: false },
                { id: "booking", label: "Reservas / Turnos", visible: true },
                { id: "reviews", label: "Reseñas", visible: true },
                { id: "contact", label: "Contacto", visible: true },
                { id: "hours", label: "Horarios", visible: true }
              ];
              const baseSections = Array.isArray(existingLayout.sections) && existingLayout.sections.length > 0
                ? existingLayout.sections
                : defaultSections;

              if (Array.isArray(incomingLayout.sections)) {
                mergedLayout.sections = baseSections.map((sec: any) => {
                  const override = incomingLayout.sections.find((s: any) => s.id === sec.id);
                  if (override) {
                    return {
                      ...sec,
                      ...(override.visible !== undefined ? { visible: Boolean(override.visible) } : {}),
                      config: { ...(sec.config || {}), ...(override.config || {}) }
                    };
                  }
                  return sec;
                });
              }

              // Ensure heroTitle, heroSubtitle, and ctaText are also synced into the hero section in sections
              if (mergedLayout.sections && Array.isArray(mergedLayout.sections)) {
                mergedLayout.sections = mergedLayout.sections.map((sec: any) => {
                  if (sec.id === "hero") {
                    return {
                      ...sec,
                      config: {
                        ...(sec.config || {}),
                        ...(mergedLayout.heroTitle ? { title: mergedLayout.heroTitle } : {}),
                        ...(mergedLayout.heroSubtitle ? { subtitle: mergedLayout.heroSubtitle } : {}),
                        ...(mergedLayout.ctaText ? { ctaText: mergedLayout.ctaText } : {})
                      }
                    };
                  }
                  return sec;
                });
              }

              updatePayload.layoutConfig = mergedLayout;

              // P0-001/SYNC: Si el negocio ya tiene publishedConfig (ya fue publicado),
              // sincronizamos los cambios visuales para que la web pública (ej: /horcus)
              // se actualice de inmediato en vivo sin requerir clic manual en Publicar.
              if (bizInfo.publishedConfig) {
                updatePayload.publishedConfig = mergedLayout;
              }

              // Apply update to business in database
              updatedBusiness = await prisma.business.update({
                where: { id: businessId },
                data: updatePayload
              });

              actionApplied = true;
              appliedChanges = changes;
            } catch (cmdErr) {
              console.error("Error executing AI change on business:", cmdErr);
            }
          }

          // Fallback: If no structured command was output by the LLM, but user explicitly asked to change color/theme
          if (!actionApplied && bizInfo) {
            const promptColor = inferColorFromText(content);
            const lowerContent = content.toLowerCase();
            const isChangeIntent =
              lowerContent.includes("cambia") ||
              lowerContent.includes("pon") ||
              lowerContent.includes("color") ||
              lowerContent.includes("fondo");
            if (promptColor && isChangeIntent) {
              try {
                const updatePayload: Prisma.BusinessUpdateInput = {
                  primaryColor: promptColor.primary,
                  secondaryColor: promptColor.primary,
                };
                const existingLayout = (bizInfo.layoutConfig as Record<string, any>) || {};
                const mergedLayout: Record<string, any> = {
                  ...existingLayout,
                  ...(promptColor.bg ? { backgroundColor: promptColor.bg, footerBgColor: promptColor.bg } : {})
                };
                updatePayload.layoutConfig = mergedLayout;
                if (bizInfo.publishedConfig) {
                  updatePayload.publishedConfig = mergedLayout;
                }
                updatedBusiness = await prisma.business.update({
                  where: { id: businessId },
                  data: updatePayload
                });
                actionApplied = true;
                appliedChanges = {
                  primaryColor: promptColor.primary,
                  ...(promptColor.bg ? { backgroundColor: promptColor.bg } : {})
                };
              } catch (fallbackErr) {
                console.error("Error in fallback color change:", fallbackErr);
              }
            }
          }

          // Strip commands from user-facing text
          responseText = responseText
            .replace(/\|\|\|APPLY_CHANGE:[\s\S]*?\|\|\|/g, "")
            .replace(/\|\|\|APPLY_CHANGE:[\s\S]*/g, "")
            .replace(/\|\|\|/g, "")
            .trim();

          if (!responseText) {
            responseText = actionApplied
              ? "¡Listo! He aplicado los cambios solicitados en tu sitio web. Ya puedes verlos reflejados."
              : "Entendido, solicitud procesada.";
          }

          if (responseText.includes("[TRANSFERIDO DESDE IA]") || responseText.includes("TRANSFERIR_ASESOR")) {
            responseText = `[TRANSFERIDO DESDE IA]\n\n${responseText.replace("TRANSFERIR_ASESOR", "").trim()}`;
          }

          const aiMsg = await prisma.message.create({
            data: {
              businessId,
              content: responseText,
              senderType: "AI",
              isRead: false
            }
          });
          
          return NextResponse.json({
            userMsg: msg,
            aiMsg: aiMsg,
            actionApplied,
            changes: appliedChanges || undefined,
            updatedBusiness: updatedBusiness || undefined
          });
        } catch (aiBlockError) {
          console.error("Critical error in AI assistant execution:", aiBlockError);
          const errorMsg = await prisma.message.create({
            data: {
              businessId,
              content: "Ocurrió un inconveniente temporal con el copiloto IA. Tu mensaje quedó guardado. Por favor intenta de nuevo en unos momentos.",
              senderType: "AI",
              isRead: false
            }
          });
          return NextResponse.json({
            userMsg: msg,
            aiMsg: errorMsg
          });
        }
      }
    }

    return NextResponse.json(msg);
  } catch (error) {
    console.error("Error creating message:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

