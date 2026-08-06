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
    const { businessId, messages, chatbotName } = body;

    if (!businessId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // 1. Fetch business info from DB
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      include: { employees: { where: { isPublic: true } } }
    });

    if (!biz) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const layoutConfig = (biz.layoutConfig as any) || {};
    const botName = chatbotName || layoutConfig.chatbotName || "Asistente Virtual";
    const address = (biz as any).address || layoutConfig.address || "No especificada";
    const phone = biz.phone || layoutConfig.whatsapp || "No especificado";

    // 2. Build services list for all template types
    const allServices: { name: string; price: string; duration?: number; desc?: string }[] = [];
    
    // Generic sections services
    const sections = layoutConfig.sections || [];
    const servicesSection = sections.find((s: any) => s.type === "services");
    if (servicesSection?.items?.length > 0) {
      servicesSection.items.forEach((item: any) => {
        allServices.push({ name: item.title || item.name, price: item.price || "Consultar", duration: item.duration, desc: item.desc });
      });
    }
    // Barberia, Taller, Clinica, Cancha
    [...(layoutConfig.barberiaServices || []), ...(layoutConfig.clinicaServices || []), ...(layoutConfig.tallerServices || []), ...(layoutConfig.canchaTarifas || [])]
      .filter((s: any) => s.active !== false)
      .forEach((s: any) => allServices.push({ name: s.name, price: s.price, duration: s.duration, desc: s.description || s.desc }));
    // Menu products
    if (layoutConfig.menuCategorias?.length > 0) {
      layoutConfig.menuCategorias.forEach((cat: any) => {
        cat.products?.filter((p: any) => p.disponible !== false).forEach((p: any) => {
          allServices.push({ name: p.nombre, price: p.precio, desc: p.descripcion });
        });
      });
    }

    // 3. Build business hours string
    let hoursText = "";
    if (layoutConfig.hours) {
      const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
      dias.forEach(day => {
        const d = layoutConfig.hours[day];
        if (d?.open) hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.from}–${d.to}. `;
        else if (d) hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: Cerrado. `;
      });
    }

    // 4. Get today's available slots for context (next 3 days)
    const todaySlots = await getNextAvailableSlots(businessId, allServices[0]?.name);

    // 5. Build the intelligent system prompt
    const systemPrompt = `
Eres ${botName}, el asistente virtual de "${biz.name}". Eres simpático, eficiente y hablas estilo mexicano (usa "cuate", "órale", "con gusto", "claro que sí", etc. de forma natural y sin exagerar).

## TU TRABAJO:
Tu misión principal es ayudar a los clientes a RESERVAR TURNOS directamente en el chat, y responder preguntas específicas. Nunca mandes a nadie a WhatsApp para reservar. El WhatsApp es solo para urgencias o casos especiales.

## REGLAS DE CONVERSACIÓN INTELIGENTE:
1. **PREGUNTAS DE PRECIO**: Si alguien pregunta "¿cuánto cuestan los servicios?" o "qué precios tienen?", NO enumeres TODO. Pregunta qué servicio en particular le interesa saber.
2. **RESERVAS**: Cuando alguien quiera reservar, sigue este flujo paso a paso (un dato a la vez):
   a) Pregunta qué servicio quiere
   b) Pregunta qué fecha prefiere
   c) Muéstrale los turnos disponibles ese día usando la función CONSULTAR_TURNOS
   d) Una vez elegida la hora, pide nombre completo
   e) Pide teléfono de contacto
   f) Confirma todos los datos y reserva usando CREAR_TURNO
3. **SÉ BREVE**: Máximo 2-3 oraciones por respuesta. No hagas preguntas múltiples en una sola respuesta.
4. **NO INVENTES**: Si no tienes el dato, di que no lo tienes, no lo imagines.
5. **ACCIONES ESPECIALES**: Cuando necesites consultar disponibilidad o crear un turno, usa los comandos especiales al final de tu respuesta.

## DATOS DEL NEGOCIO:
- Nombre: ${biz.name}
- Tipo: ${biz.type}
- Descripción: ${biz.description || "Sin descripción"}
- Dirección: ${address}
- Teléfono de contacto: ${phone}

## HORARIOS DE ATENCIÓN:
${hoursText || "No especificados (pedir por WhatsApp)"}

## SERVICIOS Y PRECIOS:
${allServices.length > 0 ? allServices.map(s => `- ${s.name}: $${s.price}${s.duration ? ` (${s.duration} min)` : ""}${s.desc ? ". " + s.desc : ""}`).join("\n") : "No hay servicios configurados"}

## TURNOS DISPONIBLES (próximos días):
${todaySlots}

## EMPLEADOS:
${biz.employees?.length > 0 ? biz.employees.map((e: any) => `- ${e.name} (${e.role || "Staff"})`).join("\n") : "Personal general"}

## COMANDOS ESPECIALES (úsalos al final de tu respuesta, separados por |||):
- Para consultar turnos: |||CONSULTAR_TURNOS:YYYY-MM-DD:NombreServicio|||
- Para crear turno: |||CREAR_TURNO:NombreCliente:Telefono:Servicio:YYYY-MM-DD:HH:MM|||

Ejemplo de respuesta con comando:
"¡Claro que sí! Déjame ver qué hay disponible para el martes 😊
|||CONSULTAR_TURNOS:2025-06-10:Corte de pelo|||"
`;

    // 6. Build conversation history
    let fullPrompt = systemPrompt + "\n\n## CONVERSACIÓN:\n";
    for (const msg of messages) {
      if (msg.role === "user") fullPrompt += `Cliente: ${msg.content}\n`;
      else if (msg.role === "assistant") fullPrompt += `${botName}: ${msg.content}\n`;
    }
    fullPrompt += `\n${botName}:`;

    // 7. Generate AI response
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: fullPrompt,
    });

    let responseText = aiResponse.text || "Lo siento, tuve un error. ¿Me puedes repetir eso?";

    // 8. Process special commands
    const commandMatch = responseText.match(/\|\|\|(.*?)\|\|\|/g);
    if (commandMatch) {
      responseText = responseText.replace(/\|\|\|.*?\|\|\|/g, "").trim();

      for (const cmd of commandMatch) {
        const cmdContent = cmd.replace(/\|\|\|/g, "");
        const parts = cmdContent.split(":");

        if (parts[0] === "CONSULTAR_TURNOS") {
          const [, date, ...serviceNameParts] = parts;
          const serviceName = serviceNameParts.join(":");
          const slots = await fetchSlots(businessId, date, serviceName);
          if (slots.length > 0) {
            responseText += `\n\n🗓️ Horarios disponibles para **${date}**:\n${slots.map(s => `• ${s}`).join("\n")}\n\n¿Cuál te queda mejor?`;
          } else {
            responseText += `\n\n😕 No hay turnos disponibles para ese día. ¿Quieres intentar otro día?`;
          }
        }

        if (parts[0] === "CREAR_TURNO") {
          const [, clientName, clientPhone, serviceName, date, time] = parts;
          const result = await createAppointment(businessId, clientName, clientPhone, serviceName, date, time);
          if (result.success) {
            responseText += `\n\n✅ ¡Tu turno quedó confirmado!\n📅 ${date} a las ${time}hs\n💈 Servicio: ${serviceName}\n\n¡Te esperamos, ${clientName}! Si necesitas cancelar o cambiar, comunícate con nosotros.`;
          } else {
            responseText += `\n\n😕 Hubo un problema al reservar. Por favor intenta de nuevo o comunícate con nosotros.`;
          }
        }
      }
    }

    return NextResponse.json({ message: responseText });

  } catch (error: any) {
    console.error("Error in Chat API:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// Helper: Get next available slots overview
async function getNextAvailableSlots(businessId: string, firstService?: string): Promise<string> {
  if (!firstService) return "Consultar disponibilidad directamente";
  try {
    const today = new Date();
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const slots = await fetchSlots(businessId, dateStr, firstService);
      if (slots.length > 0) {
        const dayName = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
        results.push(`${dayName}: ${slots.slice(0, 4).join(", ")}${slots.length > 4 ? " y más..." : ""}`);
        if (results.length >= 3) break;
      }
    }
    return results.length > 0 ? results.join("\n") : "Sin disponibilidad inmediata";
  } catch {
    return "Disponibilidad a consultar";
  }
}

// Helper: Fetch available slots from slots API
async function fetchSlots(businessId: string, date: string, serviceName: string): Promise<string[]> {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { layoutConfig: true }
    });
    if (!biz) return [];

    const layout = biz.layoutConfig as any || {};
    const sections = layout.sections || [];
    const bookingSection = sections.find((s: any) => s.id === "booking");
    const hours = layout.hours || bookingSection?.config?.hours || {
      lunes: { open: true, from: "09:00", to: "18:00" },
      martes: { open: true, from: "09:00", to: "18:00" },
      miercoles: { open: true, from: "09:00", to: "18:00" },
      jueves: { open: true, from: "09:00", to: "18:00" },
      viernes: { open: true, from: "09:00", to: "18:00" },
      sabado: { open: false, from: "09:00", to: "13:00" },
      domingo: { open: false, from: "09:00", to: "13:00" }
    };

    // Find service duration
    const allSrvs = [
      ...(sections.find((s: any) => s.type === "services")?.items || []),
      ...(layout.barberiaServices || []), ...(layout.clinicaServices || []),
      ...(layout.tallerServices || []), ...(layout.canchaTarifas || [])
    ];
    const serviceItem = allSrvs.find((s: any) => (s.name || s.title)?.toLowerCase() === serviceName?.toLowerCase());
    const duration = serviceItem?.duration || 30;

    // Determine day
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const dayName = days[dateObj.getDay()];
    const dayConfig = hours[dayName];
    if (!dayConfig?.open) return [];

    // Get existing appointments
    const startOfDay = new Date(date + "T00:00:00.000Z");
    startOfDay.setUTCHours(-24);
    const endOfDay = new Date(date + "T23:59:59.999Z");
    endOfDay.setUTCHours(48);

    const existing = await prisma.appointment.findMany({
      where: { businessId, date: { gte: startOfDay, lte: endOfDay }, status: { not: "CANCELLED" } }
    });

    const parseTime = (t: string) => {
      const [h, m] = (t || "09:00").split(":").map(Number);
      return h * 60 + (m || 0);
    };

    const bookedRanges = existing.map(app => {
      const argDate = new Date(app.date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      const startMin = argDate.getHours() * 60 + argDate.getMinutes();
      const srvItem = allSrvs.find((s: any) => s.name === app.serviceName);
      return { start: startMin, end: startMin + (srvItem?.duration || 30) };
    });

    const openMin = parseTime(dayConfig.from || "09:00");
    const closeMin = parseTime(dayConfig.to || "18:00");
    const slots: string[] = [];

    for (let cur = openMin; cur + duration <= closeMin; cur += duration) {
      const overlaps = bookedRanges.some(r => cur < r.end && cur + duration > r.start);
      if (!overlaps) {
        const h = Math.floor(cur / 60).toString().padStart(2, "0");
        const m = (cur % 60).toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  } catch (e) {
    console.error("fetchSlots error:", e);
    return [];
  }
}

// Helper: Create appointment directly from chat
async function createAppointment(
  businessId: string, clientName: string, clientPhone: string,
  serviceName: string, date: string, time: string
): Promise<{ success: boolean }> {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    // Create date in Argentina timezone equivalent (UTC-3)
    const appointmentDate = new Date(Date.UTC(year, month - 1, day, hour + 3, minute));

    await prisma.appointment.create({
      data: {
        businessId,
        clientName,
        clientPhone,
        serviceName,
        date: appointmentDate,
        status: "CONFIRMED",
        notes: "Reservado vía chatbot"
      }
    });
    return { success: true };
  } catch (e) {
    console.error("createAppointment error:", e);
    return { success: false };
  }
}
