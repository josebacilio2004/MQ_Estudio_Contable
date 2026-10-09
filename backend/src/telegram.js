/**
 * Módulo de Integración con Telegram Bot (@mqestudioscontables1_bot)
 * Provee:
 * 1. Comandos interactivos (/start, /alertas, /clientes, /escanear, /ayuda)
 * 2. Notificaciones push proactivas cuando el robot detecta notificaciones en SUNAT/SUNAFIL
 * 3. Suscripción multi-usuario persistida en PostgreSQL/Supabase
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8300960193:AAGLFhdtA-BRY3TaVfXiWDZok_ox6KqeH4Q';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let isPolling = false;
let pollingOffset = 0;
let dbPool = null;
let scraperRunner = null;

/**
 * Enviar mensaje simple o con formato Markdown a un chat específico
 */
async function sendTelegramMessage(chatId, text, options = {}) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parse_mode || 'HTML',
      disable_web_page_preview: options.disable_web_page_preview ?? true,
      ...options
    };

    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      console.error(`❌ Error enviando mensaje a Telegram chat ${chatId}:`, data.description);
    }
    return data;
  } catch (err) {
    console.error('❌ Excepción al enviar mensaje a Telegram:', err.message);
  }
}

/**
 * Obtener todos los chats suscritos desde Supabase / PostgreSQL
 */
async function getSubscribers() {
  if (!dbPool) return [];
  try {
    const res = await dbPool.query('SELECT chat_id FROM telegram_subscribers');
    return res.rows.map(r => r.chat_id);
  } catch (err) {
    console.error('Error al consultar suscriptores de Telegram:', err.message);
    return [];
  }
}

/**
 * Registrar o actualizar un suscriptor
 */
async function registerSubscriber(chatId, username, firstName) {
  if (!dbPool) return;
  try {
    await dbPool.query(`
      INSERT INTO telegram_subscribers (chat_id, username, first_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_id) 
      DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name
    `, [chatId, username || null, firstName || null]);
    console.log(`📱 Suscriptor registrado en Telegram: ${chatId} (${firstName || username})`);
  } catch (err) {
    console.error('Error al registrar suscriptor:', err.message);
  }
}

/**
 * Emitir alerta proactiva a todos los suscriptores cuando se detecta una notificación
 */
async function broadcastTelegramAlert(client, scanResult) {
  const subscribers = await getSubscribers();
  if (subscribers.length === 0) {
    console.log('ℹ️ No hay suscriptores registrados en Telegram para enviar la alerta.');
    return;
  }

  const alertCount = scanResult.notificaciones_pendientes || 0;
  const origen = scanResult.origen_notificacion || 'SUNAT';
  const detalle = scanResult.detalle_notificacion || 'Revisar buzón electrónico Clave SOL.';

  const message = `
🚨 <b>ALERTA TRIBUTARIA - ${origen.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>Cliente:</b> ${client.razon_social}
🆔 <b>RUC:</b> <code>${client.ruc}</code>
📬 <b>Notificaciones Nuevas:</b> <b>${alertCount}</b>
📋 <b>Detalle:</b>
<i>${detalle}</i>
━━━━━━━━━━━━━━━━━━━━━
🕒 <i>Detectado por Robot M|Q: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</i>
🌐 <a href="https://josebacilio2004.github.io/MQ_Estudio_Contable/">Abrir en Sistema M|Q Estudio Contable</a>
`.trim();

  for (const chatId of subscribers) {
    await sendTelegramMessage(chatId, message);
  }
}

/**
 * Manejar comandos recibidos en Telegram
 */
async function handleTelegramMessage(msg) {
  const chatId = msg.chat?.id;
  const text = msg.text?.trim() || '';
  const username = msg.from?.username;
  const firstName = msg.from?.first_name || 'Estimado(a)';

  if (!chatId) return;

  // Registrar automáticamente al usuario que interactúa
  await registerSubscriber(chatId, username, firstName);

  if (text.startsWith('/start')) {
    const welcome = `
👋 <b>¡Hola, ${firstName}!</b>

Bienvenido al asistente oficial de <b>M|Q Estudio Contable</b> (<code>@mqestudioscontables1_bot</code>).

✅ Tu chat ha sido vinculado exitosamente. Recibirás <b>alertas instantáneas</b> cada vez que nuestro robot detecte notificaciones en:
• <b>Buzón SOL (SUNAT)</b>
• <b>Casilla Electrónica (SUNAFIL)</b>

📋 <b>Comandos Rápidos Disponibles:</b>
/alertas - Ver clientes con alertas pendientes
/clientes - Ver listado de clientes registrados
/escanear - Ejecutar el robot escáner ahora mismo
/ayuda - Ver más opciones
`.trim();
    await sendTelegramMessage(chatId, welcome);
    return;
  }

  if (text.startsWith('/alertas')) {
    if (!dbPool) return;
    try {
      const res = await dbPool.query(`
        SELECT ruc, razon_social, notificaciones_pendientes, origen_notificacion, detalle_notificacion 
        FROM clients 
        WHERE notificaciones_pendientes > 0
        ORDER BY notificaciones_pendientes DESC
      `);

      if (res.rows.length === 0) {
        await sendTelegramMessage(chatId, '✅ <b>¡Todo al día!</b>\nActualmente ningún cliente tiene alertas pendientes en SUNAT o SUNAFIL.');
        return;
      }

      let response = `⚠️ <b>CLIENTES CON ALERTAS PENDIENTES (${res.rows.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
      res.rows.forEach((c, idx) => {
        response += `\n<b>${idx + 1}. ${c.razon_social}</b>\n`;
        response += `• RUC: <code>${c.ruc}</code>\n`;
        response += `• Alertas: <b>${c.notificaciones_pendientes}</b> (${c.origen_notificacion || 'SUNAT'})\n`;
        if (c.detalle_notificacion) {
          response += `• Detalle: <i>${c.detalle_notificacion}</i>\n`;
        }
      });
      response += `\n━━━━━━━━━━━━━━━━━━━━━\n🌐 <a href="https://josebacilio2004.github.io/MQ_Estudio_Contable/">Gestionar en el Sistema Web</a>`;

      await sendTelegramMessage(chatId, response);
    } catch (e) {
      console.error(e);
      await sendTelegramMessage(chatId, '❌ Error al consultar alertas en la base de datos.');
    }
    return;
  }

  if (text.startsWith('/clientes')) {
    if (!dbPool) return;
    try {
      const res = await dbPool.query(`
        SELECT ruc, razon_social, estado_contribuyente, notificaciones_pendientes 
        FROM clients 
        ORDER BY razon_social ASC
        LIMIT 25
      `);

      if (res.rows.length === 0) {
        await sendTelegramMessage(chatId, 'ℹ️ No hay clientes registrados en el sistema aún.');
        return;
      }

      let response = `📋 <b>DIRECTORIO DE CLIENTES (${res.rows.length})</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
      res.rows.forEach((c, idx) => {
        const icon = c.notificaciones_pendientes > 0 ? '⚠️' : '✅';
        response += `${icon} <b>${c.razon_social}</b>\n   RUC: <code>${c.ruc}</code> | Estado: ${c.estado_contribuyente || 'ACTIVO'}\n`;
      });
      response += `\n━━━━━━━━━━━━━━━━━━━━━\nUsa /alertas para ver solo los que tienen notificaciones.`;

      await sendTelegramMessage(chatId, response);
    } catch (e) {
      console.error(e);
      await sendTelegramMessage(chatId, '❌ Error al consultar la lista de clientes.');
    }
    return;
  }

  if (text.startsWith('/escanear')) {
    const parts = text.split(' ');
    const targetRuc = parts[1]?.trim();

    if (!dbPool || !scraperRunner) {
      await sendTelegramMessage(chatId, '⚠️ El servicio de escaneo no está disponible en este momento.');
      return;
    }

    if (targetRuc) {
      // Escanear un cliente específico por RUC
      try {
        const clientRes = await dbPool.query('SELECT * FROM clients WHERE ruc = $1', [targetRuc]);
        if (clientRes.rows.length === 0) {
          await sendTelegramMessage(chatId, `❌ No se encontró ningún cliente registrado con el RUC <code>${targetRuc}</code>.`);
          return;
        }

        const client = clientRes.rows[0];
        await sendTelegramMessage(chatId, `🤖 <b>Iniciando robot escáner...</b>\nAccediendo a SUNAT Clave SOL para <b>${client.razon_social}</b> (RUC: ${client.ruc})...`);

        const result = await scraperRunner(client);
        if (result.success) {
          await dbPool.query(
            `UPDATE clients 
             SET notificaciones_pendientes = $1, origen_notificacion = $2, detalle_notificacion = $3, updated_at = NOW() 
             WHERE id = $4`,
            [result.notificaciones_pendientes, result.origen_notificacion, result.detalle_notificacion, client.id]
          );

          const statusIcon = result.notificaciones_pendientes > 0 ? '⚠️' : '✅';
          await sendTelegramMessage(chatId, `
${statusIcon} <b>Escaneo Finalizado con Éxito</b>
━━━━━━━━━━━━━━━━━━━━━
🏢 <b>Cliente:</b> ${client.razon_social}
📬 <b>Notificaciones en Buzón SOL:</b> <b>${result.notificaciones_pendientes}</b>
📝 <b>Detalle:</b> <i>${result.detalle_notificacion || 'Sin observaciones'}</i>
`.trim());
        } else {
          await sendTelegramMessage(chatId, `⚠️ <b>Resultado del Escaneo:</b>\n${result.error || 'No se pudo acceder al buzón de SUNAT.'}`);
        }
      } catch (err) {
        console.error(err);
        await sendTelegramMessage(chatId, `❌ Error al ejecutar escáner: ${err.message}`);
      }
    } else {
      // Escaneo masivo en segundo plano
      try {
        const clientsRes = await dbPool.query('SELECT * FROM clients');
        const clients = clientsRes.rows;

        await sendTelegramMessage(chatId, `🤖 <b>Escaneo Masivo Iniciado</b>\nEl robot está revisando los buzones SOL de ${clients.length} cliente(s) en segundo plano. Te avisaremos si encontramos alertas.`);

        (async () => {
          let foundAlerts = 0;
          for (const c of clients) {
            try {
              const res = await scraperRunner(c);
              if (res.success) {
                await dbPool.query(
                  `UPDATE clients 
                   SET notificaciones_pendientes = $1, origen_notificacion = $2, detalle_notificacion = $3, updated_at = NOW() 
                   WHERE id = $4`,
                  [res.notificaciones_pendientes, res.origen_notificacion, res.detalle_notificacion, c.id]
                );

                if (res.notificaciones_pendientes > 0) {
                  foundAlerts++;
                  await broadcastTelegramAlert(c, res);
                }
              }
            } catch (err) {
              console.error(`Error escaneando ${c.ruc}:`, err);
            }
          }

          await sendTelegramMessage(chatId, `✅ <b>Escaneo masivo completado</b>.\nSe revisaron ${clients.length} clientes. Clientes con alertas encontradas: <b>${foundAlerts}</b>.`);
        })();

      } catch (err) {
        console.error(err);
        await sendTelegramMessage(chatId, `❌ Error al iniciar escaneo masivo: ${err.message}`);
      }
    }
    return;
  }

  if (text.startsWith('/ayuda') || text.startsWith('/help')) {
    const helpMsg = `
📖 <b>Comandos de @mqestudioscontables1_bot:</b>

• /alertas - Muestra clientes con notificaciones pendientes en SUNAT o SUNAFIL.
• /clientes - Lista los primeros 25 clientes registrados con su estado.
• /escanear - Ejecuta el robot para revisar todos los clientes en la nube.
• /escanear [RUC] - Revisa inmediatamente el buzón de un cliente específico. (Ej: <code>/escanear 10418236103</code>).
• /ayuda - Muestra esta ayuda interactiva.

🌐 <i>Sistema Web:</i> <a href="https://josebacilio2004.github.io/MQ_Estudio_Contable/">Abrir M|Q Estudio Contable</a>
`.trim();
    await sendTelegramMessage(chatId, helpMsg);
    return;
  }

  // Respuesta por defecto
  await sendTelegramMessage(chatId, `ℹ️ Comando no reconocido. Usa /ayuda para ver las opciones disponibles o /alertas para ver tus notificaciones.`);
}

/**
 * Bucle de Long Polling para escuchar mensajes entrantes de Telegram
 */
async function pollTelegramUpdates() {
  if (!isPolling) return;

  try {
    const url = `${TELEGRAM_API_URL}/getUpdates?offset=${pollingOffset}&timeout=20`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        pollingOffset = update.update_id + 1;
        if (update.message) {
          await handleTelegramMessage(update.message);
        }
      }
    }
  } catch (err) {
    // Si hay error de red, esperar 5 segundos antes de reintentar
    await new Promise(r => setTimeout(r, 5000));
  }

  if (isPolling) {
    setImmediate(pollTelegramUpdates);
  }
}

/**
 * Inicializar el Bot de Telegram con la base de datos y el motor de scraping
 */
async function initTelegramBot(pool, scraperFn) {
  dbPool = pool;
  scraperRunner = scraperFn;

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ No se ha configurado TELEGRAM_BOT_TOKEN.');
    return;
  }

  try {
    const res = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await res.json();
    if (data.ok) {
      console.log(`🤖 [Telegram Bot] Activo y conectado como @${data.result.username} (${data.result.first_name})`);
      isPolling = true;
      pollTelegramUpdates();
    } else {
      console.error('❌ Error al inicializar bot de Telegram:', data.description);
    }
  } catch (err) {
    console.error('❌ Excepción al conectar con Telegram:', err.message);
  }
}

module.exports = {
  initTelegramBot,
  broadcastTelegramAlert,
  sendTelegramMessage
};
