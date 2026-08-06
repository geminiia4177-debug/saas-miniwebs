import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key no configurada." }, { status: 500 });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const body = await req.json();
    const { businessId, messages } = body;

    if (!businessId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // 1. Fetch Business Info
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      include: { employees: { where: { isPublic: true } } }
    });

    if (!biz) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // 2. Prepare Context (System Prompt)
    const layoutConfig = (biz.layoutConfig as any) || {};
    const sections = layoutConfig.sections || [];
    const servicesSection = sections.find((s: any) => s.type === "services");
    const aboutSection = sections.find((s: any) => s.type === "about");
    const scheduleSection = sections.find((s: any) => s.type === "schedule");

    const chatbotName = layoutConfig.chatbotName || "Asistente Virtual";
    const address = (biz as any).address || layoutConfig.address || "No especificada";
    const phone = biz.phone || layoutConfig.whatsapp || "No especificado";

    let contextData = `
Eres el asistente virtual oficial de "${biz.name}". Tu nombre es "${chatbotName}". Tu trabajo es responder a las consultas de los clientes de manera amable, breve (máximo 3 oraciones si es posible) y precisa, basándote ÚNICAMENTE en la información proporcionada a continuación.
Si no sabes la respuesta o te preguntan algo fuera de este contexto, diles amablemente que se comuniquen por WhatsApp al número proporcionado o que no dispones de esa información. NO INVENTES PRECIOS, SERVICIOS, HORARIOS NI NINGÚN OTRO DATO QUE NO ESTÉ EXPLÍCITAMENTE EN ESTE DOCUMENTO.

### INFORMACIÓN DEL NEGOCIO:
- **Nombre:** ${biz.name}
- **Tipo de Negocio:** ${biz.type}
- **Descripción General:** ${biz.description || "No especificada"}
- **Dirección / Ubicación:** ${address}
- **Teléfono/WhatsApp de contacto:** ${phone}
`;

    // ── SERVICIOS / PRODUCTOS ──
    let hasServices = false;
    contextData += `\n### SERVICIOS Y PRODUCTOS DISPONIBLES:\n`;
    
    if (servicesSection && servicesSection.items?.length > 0) {
      hasServices = true;
      servicesSection.items.forEach((item: any) => {
        contextData += `- ${item.title || item.name}: ${item.price ? '$' + item.price : 'Consultar precio'}. ${item.desc || ""}\n`;
      });
    }
    const allServices = [
      ...(layoutConfig.barberiaServices || []),
      ...(layoutConfig.barberiaProducts || []),
      ...(layoutConfig.canchaTarifas || []),
      ...(layoutConfig.clinicaServices || []),
      ...(layoutConfig.tallerServices || [])
    ];
    if (allServices.length > 0) {
      hasServices = true;
      allServices.filter((s: any) => s.active !== false).forEach((s: any) => {
        contextData += `- ${s.name}: $${s.price}. ${s.duration ? 'Duración: ' + s.duration + ' min.' : ''} ${s.description || s.desc || ""}\n`;
      });
    }
    if (layoutConfig.menuCategorias?.length > 0) {
      hasServices = true;
      layoutConfig.menuCategorias.forEach((cat: any) => {
        contextData += `\n**Categoría: ${cat.nombre}**\n`;
        cat.products?.forEach((p: any) => {
          if (p.disponible !== false) {
            contextData += `- ${p.nombre}: $${p.precio}. ${p.descripcion || ""}\n`;
          }
        });
      });
    }
    if (!hasServices) contextData += `(No hay servicios configurados todavía)\n`;

    // ── HORARIOS ──
    contextData += `\n### HORARIOS:\n`;
    let hasHours = false;
    if (layoutConfig.hours) {
      hasHours = true;
      Object.entries(layoutConfig.hours).forEach(([day, data]: [string, any]) => {
        if (data.open) {
          contextData += `- ${day.charAt(0).toUpperCase() + day.slice(1)}: ${data.from} a ${data.to}\n`;
        } else {
          contextData += `- ${day.charAt(0).toUpperCase() + day.slice(1)}: Cerrado\n`;
        }
      });
    } else if (scheduleSection) {
      hasHours = true;
      contextData += `${scheduleSection.content || "Ver en la sección de reservas"}\n`;
    }
    if (!hasHours) contextData += `(Solicitar disponibilidad por WhatsApp)\n`;

    // ── ACERCA DE ──
    if (aboutSection) {
      contextData += `\n### ACERCA DE NOSOTROS:\n${aboutSection.content || ""}\n`;
    }
    
    if (biz.employees && biz.employees.length > 0) {
      contextData += `\n### NUESTRO EQUIPO:\n`;
      biz.employees.forEach((emp: any) => {
        contextData += `- ${emp.name} (${emp.role || "Staff"})\n`;
      });
    }

    contextData += `\n### INSTRUCCIONES ADICIONALES:
- Habla en español estilo mexicano. Usa expresiones típicas mexicanas de manera sutil y natural (ej. "¡Hola, qué tal!", "Con mucho gusto", "Claro que sí").
- Puedes usar emojis.
- Responde siempre asumiendo el rol de "${chatbotName}", parte del equipo de "${biz.name}".
`;

    // 3. Build conversation for Gemini
    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

    // Build a single prompt with context + conversation history
    let fullPrompt = contextData + "\n\n### CONVERSACIÓN:\n";
    for (const msg of messages) {
      if (msg.role === "user") {
        fullPrompt += `Cliente: ${msg.content}\n`;
      } else if (msg.role === "assistant") {
        fullPrompt += `Asistente: ${msg.content}\n`;
      }
    }
    fullPrompt += "\nResponde como el Asistente Virtual:";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: fullPrompt,
    });

    const responseText = response.text || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({ message: responseText });

  } catch (error: any) {
    console.error("Error in Chat API:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
