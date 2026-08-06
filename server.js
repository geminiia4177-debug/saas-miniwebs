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
global.waClient = null;
global.waQrCode = null;
global.waStatus = 'STARTING'; // STARTING, QR_READY, AUTHENTICATED, ERROR

async function connectToWhatsApp() {
  // Configuración de estado para recordar la sesión
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }) // Silenciar logs extensos
  });

  global.waClient = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('> QR Code ready to be scanned!');
      global.waStatus = 'QR_READY';
      // Convertimos el string crudo a una imagen base64 para la UI
      global.waQrCode = await QRCode.toDataURL(qr);
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('> Connection closed. Reconnecting:', shouldReconnect);
      global.waStatus = 'ERROR';
      global.waQrCode = null;
      global.waClient = null;

      if (shouldReconnect) {
        global.waStatus = 'STARTING';
        connectToWhatsApp();
      } else {
        console.log('> WhatsApp Logged Out! Sesión borrada.');
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
      }
    } else if (connection === 'open') {
      console.log('> WhatsApp Client is authenticated and ready!');
      global.waStatus = 'AUTHENTICATED';
      global.waQrCode = null;
    }
  });

  // Guardar credenciales al actualizarse (ej. cuando escaneas el QR)
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
      
      console.log('> Initializing WhatsApp Client (Baileys)...');
      connectToWhatsApp();

      // 🕒 TAREA PROGRAMADA: RECORDATORIOS DE 3 HORAS 🕒
      cron.schedule('* * * * *', async () => {
        if (global.waClient && global.waStatus === 'AUTHENTICATED') {
          // Buscamos turnos que estén a exactamente entre 3 horas y 3 horas con 1 minuto de distancia
          const now = new Date();
          const targetStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);
          const targetEnd = new Date(now.getTime() + (3 * 60 + 1) * 60 * 1000);

          try {
            const upcomingAppointments = await prisma.appointment.findMany({
              where: {
                date: {
                  gte: targetStart,
                  lt: targetEnd,
                },
                reminderSent: false,
              },
              include: { business: true } // Para obtener el nombre del negocio
            });

            for (const appt of upcomingAppointments) {
              if (!appt.clientPhone) continue;

              // Limpieza y formato de México
              let cleanPhone = appt.clientPhone.replace(/\D/g, '');
              if (cleanPhone.length === 10) {
                cleanPhone = `52${cleanPhone}`;
              }
              const jid = `${cleanPhone}@s.whatsapp.net`;
              
              // Verificar si el número existe en WhatsApp
              const [result] = await global.waClient.onWhatsApp(jid);
              if (!result || !result.exists) {
                console.log(`> Recordatorio: El número ${jid} no existe en WhatsApp. Omitiendo.`);
                continue;
              }
              
              const hora = new Date(appt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
              const msg = `🔔 *Recordatorio*\n¡Hola ${appt.clientName}! Te recordamos que tu turno en ${appt.business?.name || "el local"} es en aproximadamente 3 horas, a las ${hora} hs. ¡Te esperamos!`;

              await global.waClient.sendMessage(result.jid, { text: msg });
              
              // Marcamos como enviado
              await prisma.appointment.update({
                where: { id: appt.id },
                data: { reminderSent: true }
              });
              
              console.log(`> Recordatorio automático enviado a ${appt.clientName} (${cleanPhone})`);
            }
          } catch (error) {
            console.error("Error en cron job de recordatorios:", error);
          }
        }
      });
    });
});
