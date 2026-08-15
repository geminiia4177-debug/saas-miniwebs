import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";

// ─── RATE LIMITING: Messages ──────────────────────────────────────────────────
// P1-004: Prevent abuse of the message system and AI bot.
const MSG_RATE_WINDOW_MS = 60_000;
const MSG_RATE_MAX = 10;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  try {
    let whereClause: any = {};
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
    
    // P1-004: Rate limit message creation by user
    const userKey = `msg:user:${session.user.id}`;
    if (!(await checkRateLimit(userKey, MSG_RATE_MAX, MSG_RATE_WINDOW_MS))) {
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
        } else {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const systemPrompt = `
Eres un asistente de Soporte Técnico experto de la plataforma "SaaS MiniWebs".
Tu trabajo es ayudar a los dueños de negocios (usuarios del Dashboard) a utilizar la plataforma.
Eres amable, claro y resolutivo.

## SOBRE SAAS MINIWEBS
- Es una plataforma para que los negocios tengan su página web con turnos, menú, galería y chatbot de IA.
- En "Principal" -> "Editor Visual" (pestaña 'Diseño') se cambian colores, fuente, logo.
- En "Gestión" -> "Turnos" se ven las reservas.
- En "Principal" -> "Galería" se suben fotos.
- En "Principal" -> "BioLinks" se edita el árbol de enlaces.
- En "Principal" -> "Asesor Inteligente" configura métricas del bot de WhatsApp.

## REGLAS
1. Responde preguntas sobre cómo usar la plataforma de forma directa.
2. Si preguntan algo que no sabes, problema técnico avanzado, o piden explícitamente un humano, responde EXACTAMENTE con:
   "|||TRANSFERIR_ASESOR||| Entiendo, te estoy transfiriendo con un asesor humano. Te contactaremos a la brevedad."
3. Sé breve (máximo 2 o 3 oraciones). No uses jerga.
`;

          // P1-012: Build structured conversation history.
          // User messages are enclosed in literal markers to prevent prompt injection.
          const conversationHistory = [...recentMsgs].reverse().map((m) => {
            // Sanitize by slicing to a safe length
            const safeContent = String(m.content).substring(0, 500);
            if (m.senderType === "USER") {
              return `[USER_MSG]${safeContent}[/USER_MSG]`;
            }
            return `[AI_MSG]${safeContent}[/AI_MSG]`;
          }).join("\n");

          const fullPrompt = systemPrompt + "\n\n## CONVERSACIÓN (más reciente al final):\n" + conversationHistory + "\n\n[AI_MSG]";

          const aiResponse = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: fullPrompt,
          });

          let responseText = aiResponse.text || "Hubo un error de conexión con la IA.";

          if (responseText.includes("|||TRANSFERIR_ASESOR|||")) {
            responseText = responseText.replace("|||TRANSFERIR_ASESOR|||", "").trim();
            // We append a special tag so the system knows it's transferred
            responseText = `[TRANSFERIDO DESDE IA]\n\n${responseText}`;
          }

          const aiMsg = await prisma.message.create({
            data: {
              businessId,
              content: responseText,
              senderType: "AI",
              isRead: false
            }
          });
          
          return NextResponse.json({ userMsg: msg, aiMsg: aiMsg });
        }
      }
    }

    return NextResponse.json(msg);
  } catch (error) {
    console.error("Error creating message:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

