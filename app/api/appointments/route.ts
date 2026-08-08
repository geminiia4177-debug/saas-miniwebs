import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const patente = searchParams.get("patente");
  const search = searchParams.get("search");
  const businessId = searchParams.get("businessId");

  if (!businessId) return NextResponse.json({ error: "Falta el ID del negocio" }, { status: 400 });

  try {
    let whereClause: any = { businessId: businessId };
    
    // Si NO hay sesión de administrador o dueño, es una consulta pública (tracking)
    let isOwnerOrAdmin = false;
    
    if (session) {
      const userRole = session.user?.role;
      const userId = session.user?.id;
      
      if (userRole === "ADMIN") {
        isOwnerOrAdmin = true;
      } else if (userId) {
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (business && business.userId === userId) {
          isOwnerOrAdmin = true;
        }
      }
    }

    if (!isOwnerOrAdmin) {
      // Para búsquedas públicas es obligatorio enviar patente o término de búsqueda
      if (!patente && !search) {
        return NextResponse.json({ error: "No autorizado. Se requiere término de búsqueda." }, { status: 401 });
      }

      const q = patente || search;
      whereClause = {
        ...whereClause,
        OR: [
          { patente: { contains: q, mode: 'insensitive' } },
          { notes: { contains: `PATENTE:${q}`, mode: 'insensitive' } }
        ]
      };

      const turnosPublicos = await prisma.appointment.findMany({
        where: whereClause,
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          status: true,
          serviceName: true,
          notes: true,
          patente: true,
          businessId: true,
        }
      });
      return NextResponse.json(turnosPublicos);
    }

    // Si es admin/dueño y envió búsqueda (para filtrar en el dashboard)
    if (patente || search) {
      const q = patente || search;
      whereClause = {
        ...whereClause,
        OR: [
          { patente: { contains: q, mode: 'insensitive' } },
          { notes: { contains: `PATENTE:${q}`, mode: 'insensitive' } }
        ]
      };
    }

    const turnos = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
    return NextResponse.json(turnos);
  } catch (error) {
    console.error("❌ Error leyendo turnos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    const parseResult = appointmentSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Datos de turno inválidos", details: parseResult.error.format() }, { status: 400 });
    }
    const data = parseResult.data;

    if (data.paymentMethod === 'TRANSFER') {
      data.paymentReference = "TRX-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    const nuevoTurno = await prisma.appointment.create({ data });

    // CallMeBot Integration (Internal Notification)
    try {
      const business = await prisma.business.findUnique({
        where: { id: data.businessId }
      });
      if (business?.layoutConfig) {
        const layoutConfig = business.layoutConfig as any;
        const phone = layoutConfig.callMeBotPhone;
        const apiKey = layoutConfig.callMeBotApiKey;

        if (phone && apiKey) {
          const date = new Date(nuevoTurno.date).toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
          const message = `🔔 *Nuevo Turno*\nCliente: ${nuevoTurno.clientName}\nTeléfono: ${nuevoTurno.clientPhone}\nServicio: ${nuevoTurno.serviceName || "Turno reservado"}\nFecha: ${date}`;
          const cleanPhone = phone.replace('+', '');
          const encodedMessage = encodeURIComponent(message);
          const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;
          
          // Await to ensure Next.js doesn't kill the request handler before the fetch completes
          const botRes = await fetch(callMeBotUrl);
          const botText = await botRes.text();
          if (!botRes.ok) {
            console.error("CallMeBot error response:", botText);
          } else {
            console.log("CallMeBot success:", botText);
          }
        }
      }
    } catch (e) {
      console.error("Error sending CallMeBot notification:", e);
    }

    // 🔥 WHASTAPP AUTOMÁTICO PARA EL CLIENTE 🔥
    const globalAny: any = global;
    if (globalAny.waClient && globalAny.waStatus === 'AUTHENTICATED' && data.clientPhone) {
      try {
        const businessInfo = await prisma.business.findUnique({
          where: { id: data.businessId },
          select: { name: true }
        });

        // Limpiar el teléfono
        let cleanPhone = data.clientPhone.replace(/\D/g, '');
        
        // Formato para teléfonos de México
        if (cleanPhone.length === 10) {
          cleanPhone = `52${cleanPhone}`; // Asumimos México por defecto
        }
        
        const jid = `${cleanPhone}@s.whatsapp.net`;
        console.log(`> Intentando enviar WhatsApp al cliente: ${jid}`);
        
        // Verificar que el número exista en WhatsApp antes de enviar
        const [result] = await globalAny.waClient.onWhatsApp(jid);
        if (!result || !result.exists) {
          console.log(`> El número ${jid} no está registrado en WhatsApp. Se omite envío.`);
          return NextResponse.json(nuevoTurno, { status: 201 });
        }
        
        // Formatear la fecha y hora
        const apptDate = new Date(nuevoTurno.date);
        const hoy = new Date();
        const esHoy = apptDate.getDate() === hoy.getDate() && apptDate.getMonth() === hoy.getMonth() && apptDate.getFullYear() === hoy.getFullYear();
        
        let diaTexto = "hoy";
        if (!esHoy) {
          diaTexto = "el " + apptDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
        }

        const hora = apptDate.toLocaleTimeString('es-AR', {
          hour: '2-digit', minute: '2-digit'
        });

        // Recuperar plantillas personalizadas (si existen en layoutConfig)
        const businessLayout = await prisma.business.findUnique({
          where: { id: data.businessId },
          select: { layoutConfig: true }
        });
        const layoutConfig = businessLayout?.layoutConfig as any || {};
        
        const templateConfirmed = layoutConfig.waTemplateConfirmed || `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`;
        const templateTransfer = layoutConfig.waTemplateTransfer || `¡Hola! {{cliente}} para confirmar tu turno, transfiere a {{datos_bancarios}} y pon el código {{referencia}} en el concepto.`;
        
        const templateToUse = nuevoTurno.paymentMethod === 'TRANSFER' ? templateTransfer : templateConfirmed;

        // Reemplazar variables
        let mensajeCliente = templateToUse
          .replace(/{{cliente}}/g, nuevoTurno.clientName)
          .replace(/{{negocio}}/g, businessInfo?.name || "el local")
          .replace(/{{fecha}}/g, diaTexto)
          .replace(/{{hora}}/g, hora)
          .replace(/{{servicio}}/g, nuevoTurno.serviceName || "servicio")
          .replace(/{{referencia}}/g, nuevoTurno.paymentReference || "")
          .replace(/{{datos_bancarios}}/g, layoutConfig.bankDetails || "nuestra cuenta bancaria");

        await globalAny.waClient.sendMessage(result.jid, { text: mensajeCliente });
        console.log(`> WhatsApp enviado correctamente a ${result.jid}`);
        
        // Marcar como enviado
        await prisma.appointment.update({
          where: { id: nuevoTurno.id },
          data: { whatsappSent: true }
        });
      } catch (waError) {
        console.error("Error enviando confirmación por WhatsApp al cliente:", waError);
      }
    }

    return NextResponse.json(nuevoTurno, { status: 201 });
  } catch (error) {
    // 🔥 ACÁ ESTÁ LA MAGIA PARA VER EL ERROR 🔥
    console.error("🚨 ERROR FATAL AL CREAR TURNO:", error);
    return NextResponse.json({ error: "Error al guardar el turno" }, { status: 500 });
  }
}