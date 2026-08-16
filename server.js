const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global state to share between custom server and Next.js API routes
global.waPool = new Map(); // Mapa de clientes de WhatsApp por businessId
global.waStatus = new Map(); // Status por businessId
global.waQrCode = new Map(); // QRCodes por businessId

// Retenemos esto por retrocompatibilidad rápida temporal, pero ya no debería usarse
Object.defineProperty(global, 'waClient', {
  get: function() {
    return Array.from(global.waPool.values())[0]?.sock || null;
  }
});

async function connectToWhatsApp(businessId) {
  const sessionFolder = `baileys_auth_info_${businessId}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }) // Silenciar logs extensos
  });

  const poolEntry = {
    id: businessId,
    sock: sock,
    status: 'STARTING',
    qrCode: null
  };

  // Insertar en el mapa
  global.waPool.set(businessId, poolEntry);
  global.waStatus.set(businessId, 'STARTING');

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`> [Business ${businessId}] QR Code ready to be scanned!`);
      poolEntry.status = 'QR_READY';
      poolEntry.qrCode = await QRCode.toDataURL(qr);
      
      global.waStatus.set(businessId, 'QR_READY');
      global.waQrCode.set(businessId, poolEntry.qrCode);
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`> [Business ${businessId}] Connection closed. Reconnecting:`, shouldReconnect);
      poolEntry.status = 'ERROR';
      poolEntry.qrCode = null;
      
      global.waStatus.set(businessId, 'ERROR');
      global.waQrCode.set(businessId, null);

      if (shouldReconnect) {
        poolEntry.status = 'STARTING';
        global.waStatus.set(businessId, 'STARTING');
        connectToWhatsApp(businessId);
      } else {
        console.log(`> [Business ${businessId}] WhatsApp Logged Out! Sesión borrada.`);
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        global.waPool.delete(businessId);
        global.waStatus.delete(businessId);
        global.waQrCode.delete(businessId);
      }
    } else if (connection === 'open') {
      console.log(`> [Business ${businessId}] WhatsApp Client is authenticated and ready!`);
      poolEntry.status = 'AUTHENTICATED';
      poolEntry.qrCode = null;
      
      global.waStatus.set(businessId, 'AUTHENTICATED');
      global.waQrCode.set(businessId, null);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      console.log('> Initializing WhatsApp Pool...');
      // Start clients for all businesses that have a WhatsappConnection
      prisma.whatsappConnection.findMany({ where: { isActive: true } }).then(conns => {
         for (const conn of conns) {
           if (conn.businessId) connectToWhatsApp(conn.businessId);
         }
      });

      // 🕒 TAREA PROGRAMADA 1: RECORDATORIOS (24 HORAS ANTES) — CLAIM ATÓMICO CON LEASE RECUPERABLE (P0-001 / P1-003 / P1-004) 🕒
      cron.schedule('* * * * *', async () => {
        const now = new Date();
        // P1-004: Ventana tolerante a pequeñas caídas o retrasos (23h30m a 24h30m antes del turno)
        const targetStart = new Date(now.getTime() + (23 * 60 + 30) * 60 * 1000);
        const targetEnd = new Date(now.getTime() + (24 * 60 + 30) * 60 * 1000);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        try {
          const upcomingAppointments = await prisma.appointment.findMany({
            where: {
              date: { gte: targetStart, lt: targetEnd },
              reminderSent: false,
              OR: [
                { reminderClaimedAt: null },
                { reminderClaimedAt: { lt: fiveMinutesAgo } }
              ]
            },
            include: { business: true }
          });

          for (const appt of upcomingAppointments) {
            if (!appt.clientPhone) continue;
            
            // P0-001: Claim atómico con lease de 5 minutos para evitar bloqueos permanentes ante caídas
            const claim = await prisma.appointment.updateMany({
              where: {
                id: appt.id,
                reminderSent: false,
                OR: [
                  { reminderClaimedAt: null },
                  { reminderClaimedAt: { lt: fiveMinutesAgo } }
                ]
              },
              data: { reminderClaimedAt: new Date() }
            });

            if (claim.count === 0) continue; // Ya reclamado por otro worker concurrente

            const businessClient = global.waPool.get(appt.businessId);
            if (!businessClient || businessClient.status !== 'AUTHENTICATED') {
              // Liberar claim inmediatamente si este worker no tiene la sesión de WhatsApp activa
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { reminderClaimedAt: null }
              });
              continue;
            }

            const activeClient = businessClient.sock;

            let cleanPhone = appt.clientPhone.replace(/\D/g, '');
            if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
            const jid = `${cleanPhone}@s.whatsapp.net`;
            
            try {
              const [result] = await activeClient.onWhatsApp(jid);
              if (!result || !result.exists) {
                // Número inválido en WA: marcar como procesado para no bloquear
                await prisma.appointment.update({
                  where: { id: appt.id },
                  data: { reminderSent: true, reminderClaimedAt: null }
                });
                continue;
              }
              
              // P1-003: Usar el timezone configurado del negocio (por defecto America/Mexico_City)
              const bizTimezone = appt.business?.timezone || 'America/Mexico_City';
              const hora = new Date(appt.date).toLocaleTimeString('es-MX', {
                timeZone: bizTimezone,
                hour: '2-digit',
                minute: '2-digit'
              });
              const msg = `🔔 *Recordatorio*\n¡Hola ${appt.clientName}! Te recordamos que tu turno en ${appt.business?.name || "el local"} es mañana a las ${hora} hs. ¡Te esperamos!`;

              await activeClient.sendMessage(result.jid, { text: msg });
              
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { reminderSent: true, reminderClaimedAt: null }
              });
              console.log(`> [Reminder] Recordatorio enviado a ${appt.clientName} (${cleanPhone}) vía Business[${appt.businessId}]`);
            } catch (sendErr) {
              console.error(`> [Reminder] Error enviando recordatorio a ${appt.clientName}:`, sendErr);
              // Liberar claim en caso de fallo transitorio
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { reminderClaimedAt: null }
              });
            }
          }
        } catch (error) {
          console.error("Error en cron job de recordatorios:", error);
        }
      });

      // 🕒 TAREA PROGRAMADA 2: COLA DE MENSAJES (ASÍNCRONO CON CLAIM ATÓMICO Y LEASE TOKEN P0-002 / P1-001) 🕒
      cron.schedule('* * * * *', async () => {
        try {
          // P0-002: Recuperar mensajes en PROCESSING abandonados (> 5 minutos) revocando leaseToken
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const stalledMessages = await prisma.whatsappMessageQueue.findMany({
            where: {
              status: 'PROCESSING',
              lockedAt: { lt: fiveMinutesAgo }
            },
            take: 20
          });

          for (const stalled of stalledMessages) {
            const nextRetries = (stalled.retries || 0) + 1;
            await prisma.whatsappMessageQueue.updateMany({
              where: { id: stalled.id, status: 'PROCESSING', lockedAt: stalled.lockedAt },
              data: {
                status: nextRetries >= 3 ? 'FAILED' : 'PENDING',
                retries: nextRetries,
                lockedAt: null,
                leaseToken: null,
                errorMessage: 'Recuperado de timeout en PROCESSING'
              }
            });
          }

          // Obtener hasta 50 mensajes pendientes
          const pendingMessages = await prisma.whatsappMessageQueue.findMany({
            where: { status: 'PENDING' },
            take: 50,
            orderBy: { createdAt: 'asc' }
          });

          for (let i = 0; i < pendingMessages.length; i++) {
            const msg = pendingMessages[i];
            
            // Router by businessId
            const senderEntry = global.waPool.get(msg.businessId);
            if (!senderEntry || senderEntry.status !== 'AUTHENTICATED') {
               continue; // Cannot send right now
            }
            
            const sender = senderEntry.sock;

            try {
              // P1-001: Usar crypto.randomUUID() para generar lease tokens criptográficamente seguros
              const leaseToken = crypto.randomUUID();
              const claimResult = await prisma.whatsappMessageQueue.updateMany({
                where: { id: msg.id, status: 'PENDING' },
                data: { status: 'PROCESSING', lockedAt: new Date(), leaseToken: leaseToken }
              });

              if (claimResult.count === 0) {
                // Otro worker o hilo ya reclamó este mensaje
                continue;
              }

              let cleanPhone = msg.toPhone.replace(/\D/g, '');
              if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
              const jid = `${cleanPhone}@s.whatsapp.net`;
              
              const [result] = await sender.onWhatsApp(jid);
              if (result && result.exists) {
                await sender.sendMessage(result.jid, { text: msg.message });
                // P0-002: Solo marcar SENT si el leaseToken sigue siendo el nuestro
                const updateRes = await prisma.whatsappMessageQueue.updateMany({
                  where: { id: msg.id, leaseToken: leaseToken },
                  data: { status: 'SENT', lockedAt: null, leaseToken: null }
                });
                if (updateRes.count > 0) {
                  console.log(`> Mensaje encolado enviado a ${cleanPhone} vía Business[${msg.businessId}]`);
                } else {
                  console.warn(`> Lease expirado o revocado para mensaje ${msg.id}. No se sobreescribe estado.`);
                }
              } else {
                 await prisma.whatsappMessageQueue.updateMany({
                  where: { id: msg.id, leaseToken: leaseToken },
                  data: { status: 'FAILED', lockedAt: null, leaseToken: null, errorMessage: 'Número no existe en WhatsApp' }
                });
              }
            } catch (error) {
              console.error(`Error enviando mensaje de la cola (ID: ${msg.id}):`, error);
              const nextRetries = (msg.retries || 0) + 1;
              await prisma.whatsappMessageQueue.updateMany({
                where: { id: msg.id, leaseToken: leaseToken },
                data: { 
                  status: nextRetries >= 3 ? 'FAILED' : 'PENDING', 
                  retries: nextRetries,
                  lockedAt: null,
                  leaseToken: null,
                  errorMessage: error.message
                }
              });
            }
          }
        } catch (error) {
           console.error("Error general procesando cola de WhatsApp:", error);
        }
      });

    });
});
