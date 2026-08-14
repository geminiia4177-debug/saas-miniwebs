import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { publicAppointmentCreateSchema } from "@/lib/validations";
import crypto from "crypto";

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
      // SEC-P1-011 Fix: Require secure tracking token for public access instead of predictable ID
      const trackingToken = searchParams.get("trackingToken");
      if (!trackingToken) {
        return NextResponse.json({ error: "No autorizado. Se requiere token de seguimiento para consulta pública." }, { status: 401 });
      }

      const publicTrackingTokenHash = crypto.createHash('sha256').update(trackingToken).digest('hex');

      const turnosPublicos = await prisma.appointment.findMany({
        where: { businessId, publicTrackingTokenHash },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          status: true,
          serviceName: true,
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
    const parseResult = publicAppointmentCreateSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Datos de turno inválidos", details: parseResult.error.format() }, { status: 400 });
    }
    const data = parseResult.data as any;

    // SEC-011 Fix: Ignore client status and force PENDING
    data.status = "PENDING";

    // BUG-P1-004 Fix: Reject dates in the past (allowing 5 mins buffer for clock drift)
    if (data.date.getTime() < Date.now() - 5 * 60000) {
      return NextResponse.json({ error: "La fecha y hora del turno no puede estar en el pasado." }, { status: 400 });
    }

    // SEC-P1-011 Fix: Generate public tracking token
    const trackingToken = crypto.randomBytes(16).toString('hex');
    data.publicTrackingTokenHash = crypto.createHash('sha256').update(trackingToken).digest('hex');

    // SEC-P0-007 Fix: Check business status before allowing booking
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { status: true, layoutConfig: true, callMeBotApiKey: true, name: true, bankDetails: true }
    });
    
    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    if (business.status === "BLOCKED") return NextResponse.json({ error: "Este negocio no admite nuevas reservas." }, { status: 403 });

    // SEC-P0-008 Fix: Validate service name against configured services
    if (data.serviceName) {
      const layoutConfig = (business.layoutConfig as any) || {};
      const allServices = [
        ...(layoutConfig.barberiaServices || []),
        ...(layoutConfig.clinicaServices || [])
      ];
      if (layoutConfig.menuCategorias) {
        layoutConfig.menuCategorias.forEach((cat: any) => {
          if (cat.products) allServices.push(...cat.products);
        });
      }
      
      // Only strictly validate if the business has structured services defined
      if (allServices.length > 0) {
        const found = allServices.find(s => (s.nombre || s.name || s.title) === data.serviceName);
        if (!found && !data.serviceName.includes("Mesa")) {
          // Permitting 'Mesa' for restaurant bookings since they might not be in menuCategorias
          return NextResponse.json({ error: "Servicio no válido" }, { status: 400 });
        }
      }
    }

    // Validate employeeId if present
    if (data.employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
      if (!emp || emp.businessId !== data.businessId) {
        return NextResponse.json({ error: "Empleado inválido para este negocio" }, { status: 400 });
      }
    }

    // SEC-P0-006 Fix: Wrap slot availability check and create in $transaction
    let nuevoTurno;
    try {
      nuevoTurno = await prisma.$transaction(async (tx) => {
        const existingSlot = await tx.appointment.findFirst({
          where: {
            businessId: data.businessId,
            date: data.date,
            status: { in: ['PENDING', 'CONFIRMED'] },
            ...(data.employeeId ? { employeeId: data.employeeId } : {})
          }
        });

        if (existingSlot) {
          throw new Error("SLOT_TAKEN");
        }

        // SEC-037 Fix: Secure paymentReference generation
        if (data.paymentMethod === 'TRANSFER') {
          data.paymentReference = "TRX-" + crypto.randomUUID().substring(0, 8).toUpperCase();
        }
        
        return await tx.appointment.create({ data: data as any });
      });
    } catch (e: any) {
      if (e.message === "SLOT_TAKEN") {
        return NextResponse.json({ error: "El horario seleccionado acaba de ser reservado." }, { status: 409 });
      }
      throw e;
    }

    // CallMeBot Integration (Internal Notification)
    try {
      if (business?.layoutConfig) {
        const layoutConfig = business.layoutConfig as any;
        const phone = layoutConfig.callMeBotPhone;
        // Obtenemos apiKey desde el campo directo en Business
        const apiKey = business.callMeBotApiKey;

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

    // 🔥 WHASTAPP ENCOLA DE MENSAJE 🔥
    if (data.clientPhone) {
      try {
        const businessInfo = await prisma.business.findUnique({
          where: { id: data.businessId },
          select: { name: true, layoutConfig: true, bankDetails: true }
        });

        // Limpiar el teléfono
        let cleanPhone = data.clientPhone.replace(/\D/g, '');
        
        // Formato para teléfonos de México
        if (cleanPhone.length === 10) {
          cleanPhone = `52${cleanPhone}`; // Asumimos México por defecto
        }
        
        const jid = `${cleanPhone}@s.whatsapp.net`;
        
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

        const layoutConfig = businessInfo?.layoutConfig as any || {};
        
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
          .replace(/{{datos_bancarios}}/g, businessInfo?.bankDetails || "nuestra cuenta bancaria");

        // Guardar en la cola en lugar de enviar directo
        await prisma.whatsappMessageQueue.create({
          data: {
            businessId: data.businessId,
            toPhone: jid,
            message: mensajeCliente,
            status: "PENDING"
          }
        });
        
        console.log(`> Turno: Mensaje a ${jid} encolado exitosamente.`);
      } catch (waError) {
        console.error("Error encolando confirmación por WhatsApp al cliente:", waError);
      }
    }

    return NextResponse.json({ ...nuevoTurno, trackingToken }, { status: 201 });
  } catch (error) {
    // 🔥 ACÁ ESTÁ LA MAGIA PARA VER EL ERROR 🔥
    console.error("🚨 ERROR FATAL AL CREAR TURNO:", error);
    return NextResponse.json({ error: "Error al guardar el turno" }, { status: 500 });
  }
}