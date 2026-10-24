import { prisma } from "@/lib/db";
import { notifyWaitlistOnCancellation } from "@/lib/anti-no-show";
import crypto from "crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "confirm";
    const token = searchParams.get("token");

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, phone: true } } },
    });

    if (!appointment) {
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Turno no encontrado</title><style>body{font-family:sans-serif;background:#090d16;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}</style></head><body><div><h2>Turno no encontrado o ya expirado</h2><p>Por favor contacta directamente al negocio.</p></div></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // P0-HMAC: Token validation with HMAC signature or SHA256 tracking token
    if (token) {
      const secret = process.env.ENCRYPTION_KEY || "miniwebs-security-key";
      const expectedHmac = crypto.createHmac("sha256", secret).update(id).digest("hex").slice(0, 16);
      const isHmacValid = token === expectedHmac;
      
      let isHashValid = false;
      if (appointment.publicTrackingTokenHash) {
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        isHashValid = (hash === appointment.publicTrackingTokenHash);
      }

      if (!isHmacValid && !isHashValid && appointment.publicTrackingTokenHash) {
        return new Response(
          `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#090d16;color:#fff;text-align:center;padding:50px;"><h2>Enlace no válido o expirado</h2></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }
    }

    if (action === "confirm") {
      await prisma.appointment.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      return new Response(
        `<!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Turno Confirmado — ${appointment.business.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070B12; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
            .card { background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .icon { width: 72px; height: 72px; border-radius: 50%; background: #10B98120; border: 2px solid #10B981; color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 20px; }
            h1 { font-size: 24px; margin: 0 0 10px; font-weight: 800; color: #fff; }
            p { color: #94A3B8; font-size: 15px; line-height: 1.5; margin: 0 0 24px; }
            .badge { background: rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 12px; font-size: 14px; color: #E2E8F0; margin-bottom: 24px; display: inline-block; }
            .btn { display: inline-block; background: #25D366; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 28px; border-radius: 999px; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>¡Asistencia Confirmada!</h1>
            <p>Hola <strong>${appointment.clientName}</strong>, tu cita en <strong>${appointment.business.name}</strong> está 100% asegurada.</p>
            <div class="badge">
              🗓️ ${new Date(appointment.date).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}<br>
              ⏰ ${new Date(appointment.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div>
              <a href="https://wa.me/${(appointment.business.phone || "").replace(/\D/g, "")}" class="btn">Abrir chat en WhatsApp</a>
            </div>
          </div>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    } else {
      // Cancel
      await prisma.appointment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "Cancelado desde recordatorio WhatsApp",
        },
      });

      // Free slot for waitlist
      await notifyWaitlistOnCancellation({
        businessId: appointment.businessId,
        freedDate: appointment.date,
        serviceName: appointment.serviceName,
      });

      return new Response(
        `<!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Turno Cancelado — ${appointment.business.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070B12; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
            .card { background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px 24px; max-width: 420px; width: 100%; text-align: center; }
            .icon { width: 72px; height: 72px; border-radius: 50%; background: #EF444420; border: 2px solid #EF4444; color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
            h1 { font-size: 22px; margin: 0 0 10px; font-weight: 800; color: #fff; }
            p { color: #94A3B8; font-size: 15px; line-height: 1.5; margin: 0 0 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✕</div>
            <h1>Turno Cancelado</h1>
            <p>Gracias por avisarnos, ${appointment.clientName}. Tu lugar fue liberado para que otro cliente pueda aprovecharlo.</p>
            <p style="font-size:13px; color:#64748B;">Esperamos verte pronto en ${appointment.business.name}.</p>
          </div>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (err: any) {
    console.error("Error confirmando turno:", err?.message || err);
    return new Response("Error al procesar la solicitud", { status: 500 });
  }
}
