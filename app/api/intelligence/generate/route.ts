import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const text = response.text || "No se pudo generar el mensaje.";

    return NextResponse.json({ message: text });

  } catch (error) {
    console.error("Error generating message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
