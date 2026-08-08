import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const globalAny: any = global;
  
  if (globalAny.waStatus !== 'AUTHENTICATED' || !globalAny.waClient) {
    return NextResponse.json({ error: 'WhatsApp no está autenticado aún. Por favor escanea el código QR primero.' }, { status: 400 });
  }

  try {
    const { phone, message, businessId } = await request.json();
    
    if (!phone || !message || !businessId) {
      return NextResponse.json({ error: 'Faltan parámetros: phone, message o businessId.' }, { status: 400 });
    }

    if (session.user?.role !== 'ADMIN') {
      const business = await prisma.business.findUnique({
        where: { id: businessId }
      });
      if (!business || business.userId !== session.user?.id) {
        return NextResponse.json({ error: 'No autorizado para enviar mensajes en nombre de este negocio.' }, { status: 403 });
      }
    }

    // En vez de enviar sincrónicamente, encolamos el mensaje
    const queuedMessage = await prisma.whatsappMessageQueue.create({
      data: {
        businessId,
        toPhone: phone,
        message
      }
    });

    return NextResponse.json({ success: true, queuedMessageId: queuedMessage.id });
  } catch (error: any) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
