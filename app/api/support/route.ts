import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { businessId, businessName, messages, message } = data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key no configurada." }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Soporte para ambos formatos (historial completo o mensaje único)
    const conversation = messages || [{ text: message, isUser: true }];

    const systemPrompt = `
Eres un asistente de Soporte Técnico experto de la plataforma "SaaS MiniWebs".
Tu trabajo es ayudar a los dueños de negocios (usuarios del Dashboard) a utilizar la plataforma.
Eres amable, claro y resolutivo.

## SOBRE SAAS MINIWEBS
- Es una plataforma para que los negocios (barberías, clínicas, restaurantes, etc.) tengan su propia página web con reservas de turnos, menú, galería y chat de inteligencia artificial.
- En "Principal" -> "Editor Visual" (pestaña 'Diseño') se pueden cambiar los colores, la fuente, el logo y el título principal.
- En "Principal" -> "Editor Visual" -> Pestaña 'Config.' se puede cambiar el nombre del bot (chatbotName).
- En "Gestión" -> "Turnos" se ven las reservas.
- En "Principal" -> "Galería" se suben fotos.
- En "Principal" -> "BioLinks" se puede editar el árbol de enlaces.
- En "Principal" -> "Asesor Inteligente" te da métricas y permite mandar WhatsApps automáticos.

## REGLAS
1. Responde preguntas frecuentes sobre cómo usar la plataforma de forma directa y paso a paso.
2. Si el usuario pregunta algo que no sabes, si el problema parece técnico/avanzado, o si el usuario pide explícitamente hablar con un humano o asesor, debes responder exactamente con el siguiente comando secreto (y un mensaje amable):
   "|||TRANSFERIR_ASESOR||| Entiendo, te estoy transfiriendo con un asesor humano. Te contactaremos a la brevedad."
3. Sé breve y ve al grano (máximo 2 o 3 oraciones). No uses jerga complicada.
`;

    let fullPrompt = systemPrompt + "\n\n## CONVERSACIÓN:\n";
    for (const msg of conversation) {
      if (msg.isUser) fullPrompt += `Usuario: ${msg.text}\n`;
      else fullPrompt += `Soporte AI: ${msg.text}\n`;
    }
    fullPrompt += `\nSoporte AI:`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: fullPrompt,
    });

    let responseText = aiResponse.text || "Hubo un error de conexión con la inteligencia artificial.";
    let transferred = false;

    if (responseText.includes("|||TRANSFERIR_ASESOR|||")) {
      transferred = true;
      responseText = responseText.replace("|||TRANSFERIR_ASESOR|||", "").trim();
      
      console.log("🚨 TRANSFERENCIA A ASESOR HUMANO SOLICITADA:", { businessId, businessName });
      
      // Integración CallMeBot
      const adminPhone = process.env.SAAS_ADMIN_PHONE;
      const adminApiKey = process.env.SAAS_ADMIN_APIKEY;
      
      if (adminPhone && adminApiKey) {
        const text = encodeURIComponent(`Soporte de ${businessName} requiere asistencia. Último mensaje: ${conversation[conversation.length - 1].text}`);
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${text}&apikey=${adminApiKey}`)
          .then(res => console.log("Notificación enviada a WhatsApp:", res.status))
          .catch(err => console.error("Error enviando WhatsApp:", err));
      } else {
        console.warn("Faltan variables de entorno SAAS_ADMIN_PHONE y SAAS_ADMIN_APIKEY para notificar por WhatsApp.");
      }
    }

    return NextResponse.json({ success: true, message: responseText, transferred });
  } catch (error) {
    console.error("Error procesando mensaje de soporte:", error);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }
}
