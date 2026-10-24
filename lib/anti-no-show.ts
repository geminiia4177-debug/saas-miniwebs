import { prisma } from "@/lib/db";
import { normalizePhoneToE164 } from "@/lib/phone";
import crypto from "crypto";

export function generateAppointmentToken(appointmentId: string): string {
  const secret = process.env.ENCRYPTION_KEY || "miniwebs-security-key";
  return crypto.createHmac("sha256", secret).update(appointmentId).digest("hex").slice(0, 16);
}

export interface WaitlistEntry {
  id: string;
  businessId: string;
  clientName: string;
  clientPhone: string;
  requestedDate: string; // YYYY-MM-DD
  serviceName?: string;
  notes?: string;
  status: "WAITING" | "NOTIFIED" | "BOOKED" | "EXPIRED";
  createdAt: string;
}

/**
 * Builds the interactive 2-touch WhatsApp confirmation message.
 * Optimized for Mexican local businesses without intimidating technical jargon.
 */
export function buildAntiNoShowMessage(params: {
  businessName: string;
  clientName: string;
  serviceName: string;
  formattedDate: string;
  formattedTime: string;
  confirmationUrl: string;
  cancelUrl: string;
  businessPhone?: string;
}): string {
  const {
    businessName,
    clientName,
    serviceName,
    formattedDate,
    formattedTime,
    confirmationUrl,
    cancelUrl,
  } = params;

  return (
    `👋 *¡Hola ${clientName}!* Te recordamos tu cita en *${businessName}*:\n\n` +
    `🗓️ *Fecha:* ${formattedDate}\n` +
    `⏰ *Hora:* ${formattedTime}\n` +
    `✂️ *Servicio:* ${serviceName}\n\n` +
    `Para asegurar tu lugar y evitar que tu turno se libere, por favor confírmanos con un toque:\n\n` +
    `✅ *Confirmar asistencia:* ${confirmationUrl}\n` +
    `❌ *No podré asistir:* ${cancelUrl}\n\n` +
    `_Si necesitas reprogramar, responde directamente a este WhatsApp._`
  );
}

/**
 * Enqueues a notification to the first waiting customer when an appointment is cancelled.
 */
export async function notifyWaitlistOnCancellation(params: {
  businessId: string;
  freedDate: Date;
  serviceName?: string | null;
}) {
  try {
    const { businessId, freedDate, serviceName } = params;

    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, layoutConfig: true, publishedConfig: true },
    });

    if (!biz) return null;
    const config = (biz.publishedConfig || biz.layoutConfig || {}) as any;
    if (!config.antiNoShowEnabled || !config.waitlistEnabled) return null;

    // Check if there is any waitlist in layoutConfig
    const waitlist = Array.isArray(config.waitlist) ? (config.waitlist as WaitlistEntry[]) : [];
    const dateStr = freedDate.toISOString().split("T")[0];

    const waitingIndex = waitlist.findIndex(
      (entry) => entry.status === "WAITING" && entry.requestedDate === dateStr
    );

    if (waitingIndex === -1) return null;

    const luckyClient = waitlist[waitingIndex];
    const timeStr = freedDate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });

    const message =
      `🎉 *¡Buenas noticias ${luckyClient.clientName}!* Se acaba de liberar un turno en *${biz.name}*:\n\n` +
      `🗓️ *Hoy:* ${timeStr}\n` +
      `✂️ *Servicio:* ${serviceName || luckyClient.serviceName || "Turno disponible"}\n\n` +
      `¿Deseas tomarlo? Responde *SÍ* ahora para reservarlo antes de que alguien más lo tome.`;

    const cleanE164 = normalizePhoneToE164(luckyClient.clientPhone);
    if (cleanE164) {
      await prisma.whatsappMessageQueue.create({
        data: {
          businessId,
          toPhone: `${cleanE164}@s.whatsapp.net`,
          message,
          status: "PENDING",
          idempotencyKey: `waitlist_freed:${luckyClient.id}:${freedDate.getTime()}`,
        },
      });

      // Update waitlist entry status
      waitlist[waitingIndex].status = "NOTIFIED";
      await prisma.business.update({
        where: { id: businessId },
        data: {
          layoutConfig: {
            ...config,
            waitlist,
          },
        },
      });
    }

    return luckyClient;
  } catch (err: any) {
    console.error("Error en notifyWaitlistOnCancellation:", err?.message || err);
    return null;
  }
}
