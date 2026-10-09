const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const server = http.createServer(app);

// Configuración CORS permisiva para pruebas en localhost e IP local
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Servidor Socket.io para sincronización bidireccional en tiempo real
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

let connectedClientsCount = 0;

io.on('connection', (socket) => {
  connectedClientsCount++;
  console.log(`🔌 Cliente conectado: ${socket.id} (Total activos: ${connectedClientsCount})`);
  io.emit('clients:count', connectedClientsCount);

  // Escuchar evento directo desde socket para máxima reactividad
  socket.on('item:toggle_status', async (data) => {
    try {
      const { id, is_completed, deviceId } = data;
      const kanban_status = is_completed ? 'done' : 'todo';
      const res = await pool.query(
        `UPDATE agenda_items 
         SET is_completed = $1, kanban_status = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [is_completed, kanban_status, id]
      );
      if (res.rows.length > 0) {
        const updated = res.rows[0];
        io.emit('item:updated', {
          item: updated,
          originDeviceId: deviceId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error procesando item:toggle_status:', err);
    }
  });

  // Movimiento directo en Tablero Kanban vía WebSocket
  socket.on('item:move_kanban', async (data) => {
    try {
      const { id, kanban_status, deviceId } = data;
      const is_completed = kanban_status === 'done';
      const res = await pool.query(
        `UPDATE agenda_items 
         SET kanban_status = $1, is_completed = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [kanban_status, is_completed, id]
      );
      if (res.rows.length > 0) {
        const updated = res.rows[0];
        io.emit('item:updated', {
          item: updated,
          originDeviceId: deviceId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error procesando item:move_kanban:', err);
    }
  });

  socket.on('disconnect', () => {
    connectedClientsCount = Math.max(0, connectedClientsCount - 1);
    console.log(`🔌 Cliente desconectado: ${socket.id} (Total activos: ${connectedClientsCount})`);
    io.emit('clients:count', connectedClientsCount);
  });
});

// --- REST API ENDPOINTS ---

// Salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), clients: connectedClientsCount });
});

// Listar todos los elementos de la agenda
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM agenda_items 
      ORDER BY event_date ASC, event_time ASC, created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener elementos:', err);
    res.status(500).json({ error: 'Error interno al consultar la agenda' });
  }
});

// Crear nuevo elemento en la agenda
app.post('/api/items', async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      event_time,
      category,
      color_tag,
      external_url,
      url_label,
      deviceId
    } = req.body;

    if (!title || !event_date || !event_time) {
      return res.status(400).json({ error: 'Título, fecha y hora son obligatorios' });
    }

    const id = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const kanban_status = req.body.kanban_status || 'todo';

    const query = `
      INSERT INTO agenda_items (id, title, description, event_date, event_time, category, color_tag, is_completed, kanban_status, external_url, url_label)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      id,
      title.trim(),
      description ? description.trim() : '',
      event_date,
      event_time,
      category || 'General',
      color_tag || '#3B82F6',
      false,
      kanban_status,
      external_url ? external_url.trim() : null,
      url_label ? url_label.trim() : null
    ];

    const result = await pool.query(query, values);
    const createdItem = result.rows[0];

    // Transmisión inmediata a todos los dispositivos conectados
    io.emit('item:created', {
      item: createdItem,
      originDeviceId: deviceId
    });

    res.status(201).json(createdItem);
  } catch (err) {
    console.error('Error al crear elemento:', err);
    res.status(500).json({ error: 'Error al registrar elemento en la agenda' });
  }
});

// Modificar/Marcar estado completado de forma rápida
app.patch('/api/items/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, deviceId } = req.body;
    const kanban_status = is_completed ? 'done' : 'todo';

    const result = await pool.query(
      `UPDATE agenda_items 
       SET is_completed = $1, kanban_status = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [is_completed, kanban_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];

    io.emit('item:updated', {
      item: updatedItem,
      originDeviceId: deviceId,
      timestamp: new Date().toISOString()
    });

    res.json(updatedItem);
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado del elemento' });
  }
});

// Desplazamiento en Tablero Kanban
app.patch('/api/items/:id/kanban', async (req, res) => {
  try {
    const { id } = req.params;
    const { kanban_status, deviceId } = req.body;
    const is_completed = kanban_status === 'done';

    const result = await pool.query(
      `UPDATE agenda_items 
       SET kanban_status = $1, is_completed = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [kanban_status, is_completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];

    io.emit('item:updated', {
      item: updatedItem,
      originDeviceId: deviceId,
      timestamp: new Date().toISOString()
    });

    res.json(updatedItem);
  } catch (err) {
    console.error('Error al mover en kanban:', err);
    res.status(500).json({ error: 'Error al actualizar columna kanban' });
  }
});

// Actualizar elemento completo
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      event_date,
      event_time,
      category,
      color_tag,
      is_completed,
      external_url,
      url_label,
      deviceId
    } = req.body;

    const kanban_status = req.body.kanban_status || (is_completed ? 'done' : 'todo');

    const query = `
      UPDATE agenda_items
      SET title = $1, description = $2, event_date = $3, event_time = $4,
          category = $5, color_tag = $6, is_completed = $7, kanban_status = $8,
          external_url = $9, url_label = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      title,
      description,
      event_date,
      event_time,
      category,
      color_tag,
      is_completed,
      kanban_status,
      external_url,
      url_label,
      id
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];
    io.emit('item:updated', {
      item: updatedItem,
      originDeviceId: deviceId
    });

    res.json(updatedItem);
  } catch (err) {
    console.error('Error al actualizar elemento:', err);
    res.status(500).json({ error: 'Error al actualizar elemento' });
  }
});

// Eliminar elemento de la agenda
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.query;

    const result = await pool.query('DELETE FROM agenda_items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    // Difundir eliminación a todos los dispositivos
    io.emit('item:deleted', {
      id,
      originDeviceId: deviceId
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error al eliminar elemento:', err);
    res.status(500).json({ error: 'Error al eliminar elemento' });
  }
});

// ==========================================
// --- CRUD DE GESTIÓN DE CLIENTES (RUC) ---
// ==========================================

// Listar todos los clientes
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM clients 
      ORDER BY notificaciones_pendientes DESC, razon_social ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al consultar clientes:', err);
    res.status(500).json({ error: 'Error al consultar clientes' });
  }
});

// Registrar nuevo cliente con RUC y credenciales de SUNAT
app.post('/api/clients', async (req, res) => {
  try {
    const {
      ruc,
      razon_social,
      nombre_comercial,
      telefono,
      email,
      sunat_usuario,
      sunat_clave,
      estado_contribuyente,
      condicion_domicilio,
      notificaciones_pendientes,
      origen_notificacion,
      detalle_notificacion,
      notas,
      deviceId
    } = req.body;

    if (!ruc || !razon_social || !sunat_usuario || !sunat_clave) {
      return res.status(400).json({ error: 'RUC, Razón Social, Usuario y Clave SOL son obligatorios.' });
    }

    if (ruc.trim().length !== 11) {
      return res.status(400).json({ error: 'El RUC debe tener exactamente 11 dígitos numéricos.' });
    }

    const id = 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    const query = `
      INSERT INTO clients (
        id, ruc, razon_social, nombre_comercial, telefono, email,
        sunat_usuario, sunat_clave, estado_contribuyente, condicion_domicilio,
        notificaciones_pendientes, origen_notificacion, detalle_notificacion, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      id,
      ruc.trim(),
      razon_social.trim(),
      nombre_comercial ? nombre_comercial.trim() : null,
      telefono ? telefono.trim() : null,
      email ? email.trim() : null,
      sunat_usuario.trim(),
      sunat_clave.trim(),
      estado_contribuyente || 'ACTIVO',
      condicion_domicilio || 'HABIDO',
      parseInt(notificaciones_pendientes || 0, 10),
      origen_notificacion || null,
      detalle_notificacion || null,
      notas || null
    ];

    const result = await pool.query(query, values);
    const newClient = result.rows[0];

    io.emit('client:created', {
      client: newClient,
      originDeviceId: deviceId
    });

    res.status(201).json(newClient);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente registrado con ese número de RUC.' });
    }
    console.error('Error al registrar cliente:', err);
    res.status(500).json({ error: 'Error al registrar cliente.' });
  }
});

// Actualizar datos del cliente
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ruc,
      razon_social,
      nombre_comercial,
      telefono,
      email,
      sunat_usuario,
      sunat_clave,
      estado_contribuyente,
      condicion_domicilio,
      notificaciones_pendientes,
      origen_notificacion,
      detalle_notificacion,
      notas,
      deviceId
    } = req.body;

    const query = `
      UPDATE clients
      SET ruc = $1, razon_social = $2, nombre_comercial = $3, telefono = $4,
          email = $5, sunat_usuario = $6, sunat_clave = $7, estado_contribuyente = $8,
          condicion_domicilio = $9, notificaciones_pendientes = $10, origen_notificacion = $11,
          detalle_notificacion = $12, notas = $13, updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `;

    const values = [
      ruc.trim(),
      razon_social.trim(),
      nombre_comercial ? nombre_comercial.trim() : null,
      telefono ? telefono.trim() : null,
      email ? email.trim() : null,
      sunat_usuario.trim(),
      sunat_clave.trim(),
      estado_contribuyente || 'ACTIVO',
      condicion_domicilio || 'HABIDO',
      parseInt(notificaciones_pendientes || 0, 10),
      origen_notificacion || null,
      detalle_notificacion || null,
      notas || null,
      id
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updatedClient = result.rows[0];
    io.emit('client:updated', {
      client: updatedClient,
      originDeviceId: deviceId
    });

    res.json(updatedClient);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ error: 'Error al actualizar información del cliente' });
  }
});

// Eliminar cliente
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.query;

    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    io.emit('client:deleted', {
      id,
      originDeviceId: deviceId
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// Marcar/Actualizar notificaciones de bandejas (SUNAT / SUNAFIL)
app.patch('/api/clients/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const { notificaciones_pendientes, origen_notificacion, detalle_notificacion, deviceId } = req.body;

    const result = await pool.query(
      `UPDATE clients
       SET notificaciones_pendientes = $1, origen_notificacion = $2, detalle_notificacion = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [parseInt(notificaciones_pendientes || 0, 10), origen_notificacion, detalle_notificacion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updatedClient = result.rows[0];
    io.emit('client:updated', {
      client: updatedClient,
      originDeviceId: deviceId
    });

    res.json(updatedClient);
  } catch (err) {
    console.error('Error al actualizar notificaciones de bandeja:', err);
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

// ==========================================
// --- ENDPOINTS DEL SCRAPER ROBOT (SUNAT) --
// ==========================================

const { checkClientBuzon } = require('./scraper');

// Escaneo bajo demanda de un cliente específico
app.post('/api/scraper/check/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body || {};

    const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const client = clientRes.rows[0];
    const scanResult = await checkClientBuzon(client);

    if (scanResult.success) {
      const updateRes = await pool.query(
        `UPDATE clients 
         SET notificaciones_pendientes = $1, 
             origen_notificacion = $2, 
             detalle_notificacion = $3, 
             updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [
          scanResult.notificaciones_pendientes,
          scanResult.origen_notificacion,
          scanResult.detalle_notificacion,
          id
        ]
      );

      const updated = updateRes.rows[0];
      io.emit('client:updated', {
        client: updated,
        originDeviceId: deviceId
      });

      return res.json({ success: true, client: updated });
    } else {
      return res.json({
        success: false,
        error: scanResult.error || 'No se pudo completar el escaneo',
        client
      });
    }
  } catch (err) {
    console.error('Error en escáner robot:', err);
    res.status(500).json({ error: 'Error interno en el robot de escaneo.' });
  }
});

// Escaneo masivo de todos los clientes
app.post('/api/scraper/check-all', async (req, res) => {
  try {
    const clientsRes = await pool.query('SELECT * FROM clients');
    const clients = clientsRes.rows;

    // Responder de inmediato y ejecutar en segundo plano
    res.json({ message: `Escaneo en segundo plano iniciado para ${clients.length} clientes.` });

    (async () => {
      for (const c of clients) {
        try {
          const scan = await checkClientBuzon(c);
          if (scan.success) {
            const upd = await pool.query(
              `UPDATE clients 
               SET notificaciones_pendientes = $1, origen_notificacion = $2, detalle_notificacion = $3, updated_at = NOW() 
               WHERE id = $4 
               RETURNING *`,
              [scan.notificaciones_pendientes, scan.origen_notificacion, scan.detalle_notificacion, c.id]
            );
            io.emit('client:updated', { client: upd.rows[0] });
          }
        } catch (e) {
          console.error(`Error escaneando cliente ${c.ruc}:`, e);
        }
      }
    })();

  } catch (err) {
    console.error('Error en escaneo masivo:', err);
    res.status(500).json({ error: 'Error al iniciar escaneo masivo' });
  }
});

const PORT = process.env.PORT || 4100;

initDb().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Agenda MQL corriendo en puerto ${PORT}`);
    console.log(`📡 WebSocket listo para conexiones concurrentes.`);
  });
}).catch((err) => {
  console.error('❌ Error fatal al iniciar la base de datos:', err);
  process.exit(1);
});
