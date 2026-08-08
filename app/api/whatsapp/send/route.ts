import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({ error: 'Faltan parámetros: phone o message.' }, { status: 400 });
    }

    // En Baileys, el sufijo para un chat individual es @s.whatsapp.net
    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    const result = await globalAny.waClient.sendMessage(jid, { text: message });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error enviando mensaje por WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
