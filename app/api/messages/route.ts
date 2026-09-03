import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
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
    let whereClause: Prisma.MessageWhereInput = {};
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
Tu misión exclusiva es guiar con total precisión y veracidad al dueño de "${bizInfo?.name || "tu negocio"}" en el uso, administración, configuración de su sitio web y gestión diaria de turnos/ventas.

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
🧭 MAPA DE NAVEGACIÓN Y CONFIGURACIONES REALES DEL PANEL:
════════════════════════════════════════════════════════════════════════════════
El menú lateral (Sidebar) se divide en las siguientes secciones oficiales:

1. SECCIÓN "PRINCIPAL":
   - "Resumen" (tab: 'home'): Métricas rápidas del negocio, turnos pendientes de confirmación y accesos directos.

2. SECCIÓN "CREAR Y EDITAR":
   - "Editor Visual" (tab: 'editor'):
     * Pestaña 'Diseño': Título principal, colores de marca, tipografía Google Fonts, sombreado de portada, foto de portada, estilo de fondo, Niveles de Plantilla (Clásico, Motion, Premium, Inmersivo), temas visuales, animación y estilo de botones.
     * Pestañas de Catálogo según tu rubro ('Servicios', 'Productos', 'Canchas', 'Menú', 'Planes'): Administrar servicios, precios, duración y fotos.
     * Pestaña 'Video': Incrustar URL de YouTube para que aparezca en tu página.
     * Pestaña 'Config. / Secciones': Reordenar las secciones de tu página y activar/ocultar cada bloque.
     * Botones superiores: 'Guardar Borrador' y 'Publicar Web'.
   - "Galería de Fotos" (tab: 'gallery'): Subir, ver y eliminar fotos de tus trabajos, local o catálogo.

3. SECCIÓN "CONTENIDO":
   - "Turnos" (tab: 'appointments'): Calendario y lista de reservas, cambio de estado (Confirmar, Cancelar, Completar) y botón para 'Agregar Turno Manual'.
   - "Pedidos / Mesas" (tab: 'orders', disponible en gastronomía): Control de pedidos y mesas.

4. SECCIÓN "HERRAMIENTAS":
   - "Asesor Inteligente" (tab: 'intelligence'): Detección de clientes inactivos (+45 días) y clientes VIP, día más débil y generación de mensajes WhatsApp con IA para ventas.
   - "BioLinks" (tab: 'biolinks'): Configurar tu página de enlaces para Instagram o TikTok.
   - "CRM y Finanzas" (tab: 'crm'):
     * Subpestaña 'Clientes': Base de todos tus clientes con historial de visitas, servicio favorito, estado (VIP / Activo / Inactivo) y botón para contactar por WhatsApp.
     * Subpestaña 'Ingresos y Caja': Registro de cobros y ventas con gráfico mensual.
     * Subpestaña 'Empleados / Staff': Control de personal y comisiones.
     * Subpestaña 'Proveedores': Lista de proveedores y pedidos por WhatsApp.

5. SECCIÓN "CONFIGURACIÓN":
   - "Ajustes Generales" (tab: 'config'):
     * Logo del negocio (subir o eliminar).
     * Información del Negocio: Nombre, Slogan/Tagline, Teléfono de WhatsApp, enlace (subdominio).
     * Datos Bancarios y Cobros por Transferencia: Configurar CLABE interbancaria (18 dígitos - México), Banco y Titular, o CBU/CVU y Alias (Argentina).
     * Plantillas de WhatsApp: Mensajes automáticos de confirmación y para transferencias bancarias.
     * Horarios de Atención: Días y franjas horarias de apertura.
     * Redes Sociales: WhatsApp, Instagram, Facebook, TikTok.
     * Integraciones: Notificaciones internas a tu WhatsApp con CallMeBot.
     * Seguridad y Contraseña: Cambiar la contraseña del panel.

════════════════════════════════════════════════════════════════════════════════
🚨 REGLAS ESTRICTAS DE RESPUESTA (NO MENTIR NI INVENTAR RUTAS):
════════════════════════════════════════════════════════════════════════════════
1. Responde de forma clara, directa y paso a paso indicando la ruta exacta y real usando el mapa oficial de arriba. NUNCA inventes nombres de pestañas que no existan.
2. Si el usuario pregunta por transferencias bancarias o CLABE, indícale que vaya a Configuración > Ajustes Generales > sección "Datos Bancarios y Cobros por Transferencia".
3. Si el usuario te pregunta por los turnos del día o la actividad del negocio, dale el resumen de los turnos de hoy que tienes listados arriba.
4. Si el usuario pide soporte humano, un problema con su facturación/plan o algo fuera de tu alcance, responde EXACTAMENTE con:
   "|||TRANSFERIR_ASESOR||| Entiendo, te estoy transfiriendo con un asesor humano del equipo. Te responderemos a la brevedad."
5. Mantén un tono ejecutivo, servicial, cálido y profesional (máximo 2 a 4 oraciones). No generes código de programación.
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

