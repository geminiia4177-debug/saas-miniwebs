import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, getRateLimitRetryAfterMs } from "@/lib/rate-limit";

// ─── RATE LIMITING: AI Generation ─────────────────────────────────────────────
// P1-004: Prevent abuse of AI models. Limit to 5 per minute per user.
const AI_RATE_WINDOW_MS = 60_000;
const AI_RATE_MAX = 5;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // P1-004: Rate limit by user for AI generation
    const userKey = `ai:gen:${session.user.id}`;
    if (!(await checkRateLimit(userKey, AI_RATE_MAX, AI_RATE_WINDOW_MS))) {
      const retryAfter = Math.ceil(await getRateLimitRetryAfterMs(userKey, AI_RATE_WINDOW_MS) / 1000);
      return NextResponse.json(
        { error: "Límite de generación de inteligencia artificial excedido. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY no está configurada." }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const body = await req.json();
    const { businessId, campaignType, context, clientName } = body;

    if (!businessId || !campaignType) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Verify ownership
    const isAdmin = session.user.role === "ADMIN";
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (business.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    // SEC-034 & SEC-035 Fix: Remove PII. Do not send real client names to Gemini.
    let prompt = `Actúa como un experto en marketing para un negocio llamado "${business.name}" (Rubro: ${business.type}).
Tu objetivo es escribir un mensaje persuasivo para enviar por WhatsApp a un cliente.
El mensaje debe ser corto, amigable, usar lenguaje argentino/neutro, incluir algunos emojis relevantes y tener un llamado a la acción claro (ej: reservar un turno).
Usa el texto "{{cliente}}" exactamente así para referirte al nombre de la persona. No asumas ni inventes nombres reales.
La URL para reservar es: https://${business.customDomain || `${business.subdomain}.saas-miniwebs.com`}

`;

    if (campaignType === "INACTIVE_CLIENT") {
      prompt += `Contexto: El cliente no ha venido en más de ${context.days} días. Su servicio favorito era ${context.service}.
Escribe un mensaje ofreciéndole un 15% de descuento si vuelve esta semana. Hazle saber que lo extrañan.`;
    } else if (campaignType === "WEAK_DAY") {
      prompt += `Contexto: Queremos llenar la agenda del día ${context.day}, que viene con baja ocupación.
Escribe un mensaje para ofrecer un beneficio especial (ej. 2x1 o 20% off) para quienes reserven este ${context.day}.`;
    } else if (campaignType === "VIP_CLIENT") {
      prompt += `Contexto: El cliente es uno de los clientes VIP del negocio (ha venido ${context.visits} veces).
Escribe un mensaje agradeciéndole por su fidelidad y regalándole un upgrade en su próximo servicio de forma gratuita.`;
    } else {
      prompt += `Contexto: Escribe una promoción atractiva para que el cliente reserve un turno esta semana.`;
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      }
    });

    const text = response.text || "No se pudo generar el mensaje.";

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("Error generating message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
