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
        } else {
          const { GoogleGenAI, ThinkingLevel } = await import("@google/genai");
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
                name: true,
                type: true,
                subdomain: true,
                customDomain: true,
                status: true,
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
          
          const systemPrompt = `
Eres el Asistente Inteligente del Panel de Control de SaaS MiniWebs.
Tu misión exclusiva es guiar y asesorar al dueño de "${bizInfo?.name || "tu negocio"}" en el uso, administración, configuración de su sitio web y gestión diaria de turnos/ventas.

FECHA Y HORA ACTUAL: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

════════════════════════════════════════════════════════════════════════════════
📊 ESTADO ACTUAL DEL NEGOCIO EN EL PANEL:
════════════════════════════════════════════════════════════════════════════════
- Negocio: ${bizInfo?.name} (${bizInfo?.type})
- Subdominio: ${bizInfo?.subdomain}.miniwebs.lat ${bizInfo?.customDomain ? `| Dominio: ${bizInfo.customDomain}` : ""}
- Estado de cuenta: ${bizInfo?.status}
- Empleados registrados: ${bizInfo?._count.employees || 0}
- Turnos agendados para HOY: ${todayAppointments.length}
${todayAppointments.length > 0 ? todayAppointments.map(a => `  • ${a.date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} - ${a.clientName} (${a.serviceName || "Servicio"}) [${a.status}]`).join("\n") : "  (No hay turnos registrados para hoy)"}

════════════════════════════════════════════════════════════════════════════════
🧭 MAPA DE NAVEGACIÓN Y CONFIGURACIONES DEL PANEL:
════════════════════════════════════════════════════════════════════════════════
1. PESTAÑA "PRINCIPAL":
   - "Editor Visual":
     * Pestaña 'Diseño' / 'Temas': Cambiar tema visual (Modern, Dark Elegance, Minimal List, Clásico).
     * Pestaña 'Colores': Personalizar Color Primario, Secundario y Acento.
     * Pestaña 'Video': Incrustar URL de YouTube para que aparezca en el sitio web y ver la vista previa en vivo.
     * Pestaña 'Logo y Banner': Subir logo y foto de portada.
     * Pestaña 'Tipografía y Textos': Ajustar escala de fuentes y títulos.
     * Botón 'Guardar Diseño' / 'Publicar': Aplica los cambios inmediatamente a la web pública.
   - "Galería": Subir y eliminar fotos de trabajos, local o catálogo.
   - "BioLinks": Configurar tu árbol de enlaces estilo Linktree para redes sociales.
   - "Asesor Inteligente": Configurar notificaciones automáticas por WhatsApp (CallMeBot), nombre del bot y estadísticas.

2. PESTAÑA "GESTIÓN":
   - "Turnos": Calendario interactivo, lista de reservas, cambio de estado (Pendiente, Confirmado, Cancelado) y creación de turnos manuales.
   - "CRM": Base de clientes, historial de visitas y compras.
   - "Ventas / Caja": Registro de ingresos, cobros y métodos de pago.
   - "Empleados": Alta de personal, roles, fotos y servicios asignados.
   - "Mesas y Pedidos" (para gastronomía): Control de salón y pedidos.

3. PESTAÑA "CONFIGURACIÓN":
   - Datos generales, horarios comerciales de atención por día, teléfono de WhatsApp y contraseña.

════════════════════════════════════════════════════════════════════════════════
🚨 REGLAS DE RESPUESTA:
════════════════════════════════════════════════════════════════════════════════
1. Responde de forma clara, directa y paso a paso indicando la ruta exacta (ej: "Ve a Principal > Editor Visual > pestaña Video").
2. Si el usuario te pregunta por los turnos del día o la actividad del negocio, dale el resumen de los turnos de hoy que tienes listados arriba.
3. Si el usuario pide soporte humano, un problema con su facturación/plan o algo fuera de tu alcance, responde EXACTAMENTE con:
   "|||TRANSFERIR_ASESOR||| Entiendo, te estoy transfiriendo con un asesor humano del equipo. Te responderemos a la brevedad."
4. Mantén un tono ejecutivo, servicial y profesional (máximo 2 a 4 oraciones). No respondas preguntas no relacionadas con la plataforma ni generes código.
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

          const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
          const aiResponse = await ai.models.generateContent({
            model: modelName,
            contents: fullPrompt,
            config: {
              temperature: 0.2,
              maxOutputTokens: 350,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL,
              },
            }
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

