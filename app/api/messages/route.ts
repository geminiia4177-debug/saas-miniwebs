import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      orderBy: { createdAt: "asc" },
      include: {
        business: { select: { name: true, subdomain: true } }
      }
    });

    return NextResponse.json(messages);
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

          let fullPrompt = systemPrompt + "\n\n## CONVERSACIÓN:\n";
          // Reverse to chronological order
          const chronoMsgs = [...recentMsgs].reverse();
          for (const m of chronoMsgs) {
            if (m.senderType === "USER") fullPrompt += `Usuario: ${m.content}\n`;
            else fullPrompt += `Soporte AI: ${m.content}\n`;
          }
          fullPrompt += `\nSoporte AI:`;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
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
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

