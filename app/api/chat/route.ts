import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";



export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key no configurada." }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const sections = (biz.layoutConfig as any)?.sections || [];
    const servicesSection = sections.find((s: any) => s.type === "services");
    const aboutSection = sections.find((s: any) => s.type === "about");
    const scheduleSection = sections.find((s: any) => s.type === "schedule");

    let contextData = `
Eres el asistente virtual oficial de "${biz.name}". Tu trabajo es responder a las consultas de los clientes de manera amable, breve (máximo 3 oraciones si es posible) y precisa, basándote ÚNICAMENTE en la información proporcionada a continuación.
Si no sabes la respuesta o te preguntan algo fuera de este contexto, diles amablemente que se comuniquen por WhatsApp al número proporcionado o que no dispones de esa información. No inventes precios ni servicios.

### INFORMACIÓN DEL NEGOCIO:
- **Nombre:** ${biz.name}
- **Tipo de Negocio:** ${biz.type}
- **Descripción General:** ${biz.description || "No especificada"}
- **Teléfono/WhatsApp de contacto:** ${biz.phone || "No especificado"}
`;

    if (servicesSection && servicesSection.items) {
      contextData += `\n### SERVICIOS OFRECIDOS:\n`;
      servicesSection.items.forEach((item: any) => {
        contextData += `- ${item.title || item.name}: ${item.price ? '$' + item.price : 'Consultar precio'}. ${item.desc || ""}\n`;
      });
    }

    if (scheduleSection) {
      contextData += `\n### HORARIOS:\n${scheduleSection.content || "Ver en la sección de reservas"}\n`;
    }

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
- Habla en español (neutro o argentino, según corresponda a las palabras clave del usuario).
- Puedes usar emojis.
- Responde siempre como parte del equipo de "${biz.name}".
`;

    // 3. Prepare Gemini Chat History
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: contextData });
    
    const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ message: responseText });

  } catch (error) {
    console.error("Error in Chat API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
