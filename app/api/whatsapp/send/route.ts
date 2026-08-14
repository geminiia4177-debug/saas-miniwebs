import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { phone, message, businessId, idempotencyKey } = await request.json();
    
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

    // BUG-P1-010 Fix: Idempotency support for WhatsApp queue
    try {
      const queuedMessage = await prisma.whatsappMessageQueue.create({
        data: {
          businessId,
          toPhone: phone,
          message,
          idempotencyKey: idempotencyKey || null
        }
      });

      return NextResponse.json({ success: true, queuedMessageId: queuedMessage.id });
    } catch (e: any) {
      if (e.code === 'P2002' && idempotencyKey) {
        // Prisma error for unique constraint on idempotencyKey
        const existing = await prisma.whatsappMessageQueue.findUnique({ where: { idempotencyKey } });
        return NextResponse.json({ success: true, queuedMessageId: existing?.id, duplicate: true });
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
