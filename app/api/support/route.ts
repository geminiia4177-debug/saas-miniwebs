import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { businessId, businessName, message } = data;

    // Aquí iría la integración con el sistema de tickets del SaaS
    // o el bot de Telegram del dueño de "MiniWebs SaaS"
    // Ejemplo de CallMeBot (Telegram/WhatsApp):
    // const adminPhone = process.env.SAAS_ADMIN_PHONE;
    // const adminApiKey = process.env.SAAS_ADMIN_APIKEY;
    // await fetch(`https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodeURIComponent(`Soporte de ${businessName}: ${message}`)}&apikey=${adminApiKey}`);

    console.log("📩 NUEVO MENSAJE DE SOPORTE:", { businessId, businessName, message });

    return NextResponse.json({ success: true, message: "Mensaje recibido" });
  } catch (error) {
    console.error("Error procesando mensaje de soporte:", error);
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }
}
