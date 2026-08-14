import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

// Simple in-memory rate limiter for Phase 0
const RATE_LIMIT_MAP = new Map<string, { count: number, timestamp: number }>();
function checkRateLimit(ip: string, businessId: string) {
  const key = `${ip}-${businessId}`;
  const now = Date.now();
  const record = RATE_LIMIT_MAP.get(key) || { count: 0, timestamp: now };
  
  if (now - record.timestamp > 60000) {
    record.count = 0;
    record.timestamp = now;
  }
  
  if (record.count >= 15) return false; // Max 15 requests per minute per IP per Business
  
  record.count++;
  RATE_LIMIT_MAP.set(key, record);
  return true;
}

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

    // SEC-010 Fix: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    if (!checkRateLimit(ip, businessId)) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 });
    }

    // SEC-010 Fix: Limit messages length to prevent context abuse
    let chatMessages = messages;
    if (chatMessages.length > 15) {
      chatMessages = chatMessages.slice(-15);
    }

    // 1. Fetch business info from DB
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      include: { employees: { where: { isPublic: true } } }
    });

    if (!biz) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    // SEC-010 Fix: Check if business is active
    if (biz.status !== 'ACTIVE' && biz.status !== 'DEMO') {
      return NextResponse.json({ error: "El asistente no está disponible para este negocio temporalmente." }, { status: 403 });
    }

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

    // 4. Build the intelligent system prompt (NO pre-fetching slots - let AI ask for date first)
    const today = new Date();
    const todayStr = today.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const todayISO = today.toISOString().split("T")[0];

    // 5. Build the intelligent system prompt
    const systemPrompt = `
Eres ${botName}, asistente de "${biz.name}". Eres amable, directo y hablas de forma natural en español mexicano. Usa expresiones como "claro que sí", "con gusto", "perfecto" de forma NATURAL y sin exagerar. NUNCA uses "cuate" ni "órale" repetidamente, suena forzado.

FECHA HOY: ${todayStr} (${todayISO}). Usa el año correcto (${today.getFullYear()}) al generar fechas para los comandos.

## TUS PRIORIDADES:
1. Ayudar a RESERVAR TURNOS directamente (no mandas a WhatsApp para reservar)
2. Responder preguntas puntuales del negocio

## FLUJO DE RESERVA (sigue el orden estricto, UN dato a la vez):
- Paso 1: Pregunta qué SERVICIO quiere
- Paso 2: Pregunta qué FECHA le queda mejor (NO muestres horarios todavía)
- Paso 3: Cuando tenga fecha → usa CONSULTAR_TURNOS para mostrar los horarios disponibles
- Paso 4: El usuario elige hora → pide su NOMBRE completo
- Paso 5: Pide su TELÉFONO
- Paso 6: Con nombre y teléfono ya en mano, ejecuta CREAR_TURNO INMEDIATAMENTE. NO preguntes si confirman. El sistema lo confirma automáticamente.

## REGLAS IMPORTANTES:
- Si preguntan precios en general → pregunta de QUÉ servicio antes de listar
- Respuestas cortas: máximo 2 oraciones antes del comando
- Cuando ejecutas CREAR_TURNO, tu mensaje solo debe decir algo como "Perfecto, ya te agendo" — el sistema agrega la confirmación automáticamente
- NO preguntes "\u00bfConfirmamos?" ni nada similar después de tener todos los datos
- No inventes datos que no están en este documento

## DATOS DEL NEGOCIO:
- Nombre: ${biz.name}
- Tipo: ${biz.type}
- Descripción: ${biz.description || "Sin descripción"}
- Dirección: ${address}
- Teléfono: ${phone}

## HORARIOS DE ATENCIÓN:
${hoursText || "No especificados"}

## SERVICIOS Y PRECIOS:
${allServices.length > 0 ? allServices.map(s => `- ${s.name}: $${s.price}${s.duration ? ` (${s.duration} min)` : ""}${s.desc ? ". " + s.desc : ""}`).join("\n") : "No hay servicios configurados"}

## EMPLEADOS:
${biz.employees?.length > 0 ? biz.employees.map((e: any) => `- ${e.name} (${e.role || "Staff"})`).join("\n") : "Personal general"}

## COMANDOS (ponlos AL FINAL de tu mensaje, el sistema los procesa automáticamente):
- Consultar disponibilidad: |||CONSULTAR_TURNOS:YYYY-MM-DD:NombreServicio|||
- Crear turno: |||CREAR_TURNO:NombreCliente:Telefono:Servicio:YYYY-MM-DD:HH:MM|||

Ejemplo correcto:
"Perfecto, déjame checar para el ${todayISO} 😊
|||CONSULTAR_TURNOS:${todayISO}:Corte de pelo|||"
`;

    // SEC-015 Fix: Use structured messages and systemInstruction to prevent prompt injection
    const formattedMessages = chatMessages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content?.substring(0, 500) || "" }]
    }));

    // 7. Generate AI response
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction: systemPrompt
      }
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
          // Clean the AI text (remove trailing questions since we append our own)
          responseText = responseText.replace(/(\?[^?]*)$/, "").trim();
          if (slots.length > 0) {
            const formatted = slots.map(s => `• ${s}`).join("  ");
            responseText += `\n\n🗓️ *Horarios disponibles:*\n${formatted}\n\n¿Cuál te queda bien?`;
          } else {
            responseText += `\n\n😕 No hay horarios disponibles ese día. ¿Probamos otro día?`;
          }
        }

        if (parts[0] === "CREAR_TURNO") {
          // Format: CREAR_TURNO:NombreCliente:Telefono:Servicio:YYYY-MM-DD:HH:MM
          // NOTE: splitting by ":" means "11:00" becomes two parts (parts[5]="11", parts[6]="00")
          const clientName = parts[1] || "";
          const clientPhone = parts[2] || "";
          const serviceName = parts[3] || "";
          const date = parts[4] || "";
          const time = `${parts[5] || "09"}:${parts[6] || "00"}`; // reconstruct HH:MM
          const result = await createAppointment(businessId, clientName, clientPhone, serviceName, date, time);
          if (result.success) {
            responseText += `\n\n✅ ¡Tu turno quedó confirmado!\n📅 ${date} a las ${time}hs\n💈 Servicio: ${serviceName}\n\n¡Te esperamos, ${clientName}! Si necesitas cancelar o cambiar, llámanos.`;
          } else {
            responseText += `\n\n😕 Hubo un problema al guardar el turno. ¿Me repites los datos?`;
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
    // Build ISO date string and parse safely (avoid UTC offset issues)
    const isoString = `${date}T${time}:00.000Z`;
    // Adjust for UTC-3 (Argentina) → add 3 hours to get correct UTC storage
    const localDate = new Date(isoString);
    localDate.setUTCHours(localDate.getUTCHours() + 3);

    // SEC-010 Fix: Verify slot is still available before creating the appointment
    const slots = await fetchSlots(businessId, date, serviceName);
    if (!slots.includes(time)) {
      return { success: false }; // Slot is not valid or taken
    }

    await prisma.appointment.create({
      data: {
        businessId,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceName: serviceName.trim(),
        date: localDate,
        status: "PENDING", // Force PENDING instead of CONFIRMED for safety
        notes: "Reservado vía chatbot ✅"
      }
    });
    return { success: true };
  } catch (e) {
    console.error("createAppointment error:", e);
    return { success: false };
  }
}
