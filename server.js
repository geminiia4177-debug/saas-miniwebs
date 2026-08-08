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

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global state to share between custom server and Next.js API routes
global.waPool = []; // Pool de clientes de WhatsApp
global.waQrCode = null;
global.waStatus = 'STARTING'; // STARTING, QR_READY, AUTHENTICATED, ERROR

// Retenemos esto por retrocompatibilidad rápida, apunta al primer cliente del pool
Object.defineProperty(global, 'waClient', {
  get: function() {
    return global.waPool.length > 0 ? global.waPool[0].sock : null;
  }
});

async function connectToWhatsApp(poolIndex = 0) {
  const sessionFolder = `baileys_auth_info_${poolIndex}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }) // Silenciar logs extensos
  });

  const poolEntry = {
    id: poolIndex,
    sock: sock,
    status: 'STARTING',
    qrCode: null
  };

  // Reemplazar o insertar en el pool
  global.waPool[poolIndex] = poolEntry;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`> [Pool ${poolIndex}] QR Code ready to be scanned!`);
      poolEntry.status = 'QR_READY';
      poolEntry.qrCode = await QRCode.toDataURL(qr);
      
      // Para la UI actual que espera leer del global
      if (poolIndex === 0) {
        global.waStatus = 'QR_READY';
        global.waQrCode = poolEntry.qrCode;
      }
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`> [Pool ${poolIndex}] Connection closed. Reconnecting:`, shouldReconnect);
      poolEntry.status = 'ERROR';
      poolEntry.qrCode = null;
      
      if (poolIndex === 0) {
        global.waStatus = 'ERROR';
        global.waQrCode = null;
      }

      if (shouldReconnect) {
        poolEntry.status = 'STARTING';
        if (poolIndex === 0) global.waStatus = 'STARTING';
        connectToWhatsApp(poolIndex);
      } else {
        console.log(`> [Pool ${poolIndex}] WhatsApp Logged Out! Sesión borrada.`);
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        global.waPool.splice(poolIndex, 1);
      }
    } else if (connection === 'open') {
      console.log(`> [Pool ${poolIndex}] WhatsApp Client is authenticated and ready!`);
      poolEntry.status = 'AUTHENTICATED';
      poolEntry.qrCode = null;
      
      if (poolIndex === 0) {
        global.waStatus = 'AUTHENTICATED';
        global.waQrCode = null;
      }
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
      // Iniciamos solo un cliente por defecto para el pool
      connectToWhatsApp(0);

      // 🕒 TAREA PROGRAMADA 1: RECORDATORIOS (24 HORAS ANTES) 🕒
      cron.schedule('* * * * *', async () => {
        if (!global.waPool[0] || global.waPool[0].status !== 'AUTHENTICATED') return;
        const activeClient = global.waPool[0].sock;

        // Buscamos turnos que estén a exactamente entre 24 horas y 24 horas con 1 minuto de distancia
        const now = new Date();
        const targetStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const targetEnd = new Date(now.getTime() + (24 * 60 + 1) * 60 * 1000);

        try {
          const upcomingAppointments = await prisma.appointment.findMany({
            where: {
              date: { gte: targetStart, lt: targetEnd },
              reminderSent: false,
            },
            include: { business: true }
          });

          for (const appt of upcomingAppointments) {
            if (!appt.clientPhone) continue;

            let cleanPhone = appt.clientPhone.replace(/\D/g, '');
            if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
            const jid = `${cleanPhone}@s.whatsapp.net`;
            
            const [result] = await activeClient.onWhatsApp(jid);
            if (!result || !result.exists) continue;
            
            const hora = new Date(appt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const msg = `🔔 *Recordatorio*\n¡Hola ${appt.clientName}! Te recordamos que tu turno en ${appt.business?.name || "el local"} es mañana a las ${hora} hs. ¡Te esperamos!`;

            await activeClient.sendMessage(result.jid, { text: msg });
            
            await prisma.appointment.update({
              where: { id: appt.id },
              data: { reminderSent: true }
            });
            console.log(`> Recordatorio enviado a ${appt.clientName} (${cleanPhone})`);
          }
        } catch (error) {
          console.error("Error en cron job de recordatorios:", error);
        }
      });

      // 🕒 TAREA PROGRAMADA 2: COLA DE MENSAJES (ASÍNCRONO) 🕒
      cron.schedule('* * * * *', async () => {
        const authenticatedClients = global.waPool.filter(c => c.status === 'AUTHENTICATED');
        if (authenticatedClients.length === 0) return;

        try {
          // Obtener hasta 50 mensajes pendientes
          const pendingMessages = await prisma.whatsappMessageQueue.findMany({
            where: { status: 'PENDING' },
            take: 50,
            orderBy: { createdAt: 'asc' }
          });

          for (let i = 0; i < pendingMessages.length; i++) {
            const msg = pendingMessages[i];
            
            // Router simple (Round-Robin)
            const senderEntry = authenticatedClients[i % authenticatedClients.length];
            const sender = senderEntry.sock;

            try {
              // Marcar como procesando
              await prisma.whatsappMessageQueue.update({
                where: { id: msg.id },
                data: { status: 'PROCESSING' }
              });

              let cleanPhone = msg.toPhone.replace(/\D/g, '');
              if (cleanPhone.length === 10) cleanPhone = `52${cleanPhone}`;
              const jid = `${cleanPhone}@s.whatsapp.net`;
              
              const [result] = await sender.onWhatsApp(jid);
              if (result && result.exists) {
                await sender.sendMessage(result.jid, { text: msg.message });
                await prisma.whatsappMessageQueue.update({
                  where: { id: msg.id },
                  data: { status: 'SENT' }
                });
                console.log(`> Mensaje encolado enviado a ${cleanPhone} vía Pool[${senderEntry.id}]`);
              } else {
                 await prisma.whatsappMessageQueue.update({
                  where: { id: msg.id },
                  data: { status: 'FAILED', errorMessage: 'Número no existe en WhatsApp' }
                });
              }
            } catch (error) {
              console.error(`Error enviando mensaje de la cola (ID: ${msg.id}):`, error);
              const nextRetries = msg.retries + 1;
              await prisma.whatsappMessageQueue.update({
                where: { id: msg.id },
                data: { 
                  status: nextRetries >= 3 ? 'FAILED' : 'PENDING', 
                  retries: nextRetries,
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
