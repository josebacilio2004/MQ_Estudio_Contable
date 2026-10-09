const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { pool, initDb } = require('./db');
const { hashPassword, verifyPassword, generateToken, authMiddleware } = require('./auth');
const { checkClientBuzon } = require('./scraper');
const { initTelegramBot, broadcastTelegramAlert } = require('./telegram');

const app = express();
const server = http.createServer(app);

// Configuración CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'x-user-id']
}));

app.use(express.json());

// Servidor Socket.io para sincronización en tiempo real
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

let connectedClientsCount = 0;

io.on('connection', (socket) => {
  connectedClientsCount++;
  console.log(`🔌 Dispositivo conectado: ${socket.id} (Total activos: ${connectedClientsCount})`);
  io.emit('clients:count', connectedClientsCount);

  // Unirse a sala de sincronización privada del usuario
  socket.on('user:join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socket.userId = userId;
      console.log(`👤 Socket ${socket.id} suscrito a sala de usuario: user:${userId}`);
    }
  });

  // Movimiento rápido de estado vía WebSocket
  socket.on('item:toggle_status', async (data) => {
    try {
      const { id, is_completed, deviceId, userId } = data;
      const targetUser = userId || socket.userId;
      const kanban_status = is_completed ? 'done' : 'todo';

      let query = `
        UPDATE agenda_items 
        SET is_completed = $1, kanban_status = $2, updated_at = NOW() 
        WHERE id = $3
      `;
      const values = [is_completed, kanban_status, id];

      if (targetUser) {
        query += ` AND user_id = $4`;
        values.push(targetUser);
      }
      query += ` RETURNING *`;

      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const payload = {
          item: updated,
          originDeviceId: deviceId,
          timestamp: new Date().toISOString()
        };
        if (updated.user_id) {
          io.to(`user:${updated.user_id}`).emit('item:updated', payload);
        } else {
          io.emit('item:updated', payload);
        }
      }
    } catch (err) {
      console.error('Error procesando item:toggle_status:', err);
    }
  });

  // Movimiento directo en Tablero Kanban vía WebSocket
  socket.on('item:move_kanban', async (data) => {
    try {
      const { id, kanban_status, deviceId, userId } = data;
      const targetUser = userId || socket.userId;
      const is_completed = kanban_status === 'done';

      let query = `
        UPDATE agenda_items 
        SET kanban_status = $1, is_completed = $2, updated_at = NOW() 
        WHERE id = $3
      `;
      const values = [kanban_status, is_completed, id];

      if (targetUser) {
        query += ` AND user_id = $4`;
        values.push(targetUser);
      }
      query += ` RETURNING *`;

      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        const updated = res.rows[0];
        const payload = {
          item: updated,
          originDeviceId: deviceId,
          timestamp: new Date().toISOString()
        };
        if (updated.user_id) {
          io.to(`user:${updated.user_id}`).emit('item:updated', payload);
        } else {
          io.emit('item:updated', payload);
        }
      }
    } catch (err) {
      console.error('Error procesando item:move_kanban:', err);
    }
  });

  socket.on('disconnect', () => {
    connectedClientsCount = Math.max(0, connectedClientsCount - 1);
    console.log(`🔌 Dispositivo desconectado: ${socket.id} (Total activos: ${connectedClientsCount})`);
    io.emit('clients:count', connectedClientsCount);
  });
});

// Helper para emitir a la sala del usuario y con fallback
function broadcastToUser(userId, event, payload) {
  if (userId) {
    io.to(`user:${userId}`).emit(event, payload);
  }
  io.emit(event, payload);
}

// ==========================================
// --- RUTAS DE AUTENTICACIÓN Y USUARIOS ---
// ==========================================

// Salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), clients: connectedClientsCount });
});

// Registro de nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, full_name, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'El usuario y la contraseña son obligatorios.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Comprobar si ya existe
    const exists = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [cleanUsername]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Este nombre de usuario ya está registrado. Por favor elija otro.' });
    }

    const userId = 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const password_hash = hashPassword(password);
    const role = 'contador';

    const insertRes = await pool.query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, full_name, role, created_at`,
      [userId, cleanUsername, email ? email.trim() : null, password_hash, full_name ? full_name.trim() : cleanUsername, role]
    );

    const newUser = insertRes.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error al registrar nuevo usuario.' });
  }
});

// Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Debe ingresar usuario y contraseña.' });
    }

    const cleanInput = username.trim().toLowerCase();

    const userRes = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(username) = $1 OR (email IS NOT NULL AND LOWER(email) = $1)`,
      [cleanInput]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const user = userRes.rows[0];
    const isValid = verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = generateToken(safeUser);

    res.json({
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

// Obtener datos del usuario logueado
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('Error en auth/me:', err);
    res.status(500).json({ error: 'Error al obtener datos del usuario.' });
  }
});

// ==========================================
// --- CRUD DE AGENDA Y KANBAN (POR USUARIO)
// ==========================================

// Listar elementos de la agenda del usuario autenticado
app.get('/api/items', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM agenda_items 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY event_date ASC, event_time ASC, created_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener elementos:', err);
    res.status(500).json({ error: 'Error interno al consultar la agenda' });
  }
});

// Crear nuevo elemento en la agenda vinculado al usuario
app.post('/api/items', authMiddleware, async (req, res) => {
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
      INSERT INTO agenda_items (id, user_id, title, description, event_date, event_time, category, color_tag, is_completed, kanban_status, external_url, url_label)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      id,
      req.userId,
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

    // Transmisión inmediata a los dispositivos del usuario
    broadcastToUser(req.userId, 'item:created', {
      item: createdItem,
      originDeviceId: deviceId
    });

    res.status(201).json(createdItem);
  } catch (err) {
    console.error('Error al crear elemento:', err);
    res.status(500).json({ error: 'Error al registrar elemento en la agenda' });
  }
});

// Toggle estado completado
app.patch('/api/items/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed, deviceId } = req.body;
    const kanban_status = is_completed ? 'done' : 'todo';

    const result = await pool.query(
      `UPDATE agenda_items 
       SET is_completed = $1, kanban_status = $2, updated_at = NOW() 
       WHERE id = $3 AND (user_id = $4 OR user_id IS NULL)
       RETURNING *`,
      [is_completed, kanban_status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];
    broadcastToUser(req.userId, 'item:updated', {
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

// Desplazamiento en Kanban
app.patch('/api/items/:id/kanban', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { kanban_status, deviceId } = req.body;
    const is_completed = kanban_status === 'done';

    const result = await pool.query(
      `UPDATE agenda_items 
       SET kanban_status = $1, is_completed = $2, updated_at = NOW() 
       WHERE id = $3 AND (user_id = $4 OR user_id IS NULL)
       RETURNING *`,
      [kanban_status, is_completed, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];
    broadcastToUser(req.userId, 'item:updated', {
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
app.put('/api/items/:id', authMiddleware, async (req, res) => {
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
      WHERE id = $11 AND (user_id = $12 OR user_id IS NULL)
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
      id,
      req.userId
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    const updatedItem = result.rows[0];
    broadcastToUser(req.userId, 'item:updated', {
      item: updatedItem,
      originDeviceId: deviceId
    });

    res.json(updatedItem);
  } catch (err) {
    console.error('Error al actualizar elemento:', err);
    res.status(500).json({ error: 'Error al actualizar elemento' });
  }
});

// Eliminar elemento
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.query;

    const result = await pool.query(
      'DELETE FROM agenda_items WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING id',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    broadcastToUser(req.userId, 'item:deleted', {
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
// --- CRUD DE CLIENTES RUC (POR USUARIO) ---
// ==========================================

// Listar clientes del usuario autenticado
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM clients 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY notificaciones_pendientes DESC, razon_social ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al consultar clientes:', err);
    res.status(500).json({ error: 'Error al consultar clientes' });
  }
});

// Registrar nuevo cliente vinculado al usuario
app.post('/api/clients', authMiddleware, async (req, res) => {
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
        id, user_id, ruc, razon_social, nombre_comercial, telefono, email,
        sunat_usuario, sunat_clave, estado_contribuyente, condicion_domicilio,
        notificaciones_pendientes, origen_notificacion, detalle_notificacion, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      id,
      req.userId,
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

    broadcastToUser(req.userId, 'client:created', {
      client: newClient,
      originDeviceId: deviceId
    });

    res.status(201).json(newClient);
  } catch (err) {
    console.error('Error al registrar cliente:', err);
    res.status(500).json({ error: 'Error al registrar cliente.' });
  }
});

// Actualizar datos del cliente
app.put('/api/clients/:id', authMiddleware, async (req, res) => {
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
      WHERE id = $14 AND (user_id = $15 OR user_id IS NULL)
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
      id,
      req.userId
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updatedClient = result.rows[0];
    broadcastToUser(req.userId, 'client:updated', {
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
app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.query;

    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING id',
      [id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    broadcastToUser(req.userId, 'client:deleted', {
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
app.patch('/api/clients/:id/notifications', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { notificaciones_pendientes, origen_notificacion, detalle_notificacion, deviceId } = req.body;

    const result = await pool.query(
      `UPDATE clients
       SET notificaciones_pendientes = $1, origen_notificacion = $2, detalle_notificacion = $3, updated_at = NOW()
       WHERE id = $4 AND (user_id = $5 OR user_id IS NULL)
       RETURNING *`,
      [parseInt(notificaciones_pendientes || 0, 10), origen_notificacion, detalle_notificacion, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updatedClient = result.rows[0];
    broadcastToUser(req.userId, 'client:updated', {
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
// --- BANDEJA / BUZÓN ELECTRÓNICO CLIENTES --
// ==========================================

// Obtener mensajes del buzón de un cliente
app.get('/api/clients/:id/inbox', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar pertenencia del cliente
    const clientRes = await pool.query(
      'SELECT id, ruc, razon_social, notificaciones_pendientes FROM clients WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
      [id, req.userId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const notifs = await pool.query(
      `SELECT * FROM client_notifications 
       WHERE client_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    const unreadCount = notifs.rows.filter(m => !m.is_read).length;

    res.json({
      client: clientRes.rows[0],
      notifications: notifs.rows,
      unread_count: unreadCount
    });
  } catch (err) {
    console.error('Error al consultar buzón del cliente:', err);
    res.status(500).json({ error: 'Error al obtener notificaciones del buzón' });
  }
});

// Marcar mensaje como leído / no leído
app.patch('/api/clients/:id/inbox/:msgId/read', authMiddleware, async (req, res) => {
  try {
    const { id, msgId } = req.params;
    const { is_read = true, deviceId } = req.body;

    // Verificar pertenencia del cliente
    const clientRes = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
      [id, req.userId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Actualizar mensaje
    const msgUpdate = await pool.query(
      `UPDATE client_notifications 
       SET is_read = $1 
       WHERE id = $2 AND client_id = $3 
       RETURNING *`,
      [Boolean(is_read), msgId, id]
    );

    if (msgUpdate.rows.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    // Recalcular conteo de pendientes y actualizar tabla clients
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM client_notifications WHERE client_id = $1 AND is_read = false',
      [id]
    );
    const newUnread = parseInt(countRes.rows[0].count, 10);

    const updatedClientRes = await pool.query(
      `UPDATE clients 
       SET notificaciones_pendientes = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [newUnread, id]
    );

    const updatedClient = updatedClientRes.rows[0];

    // Transmitir actualización en tiempo real a todos los dispositivos del usuario
    broadcastToUser(req.userId, 'client:updated', {
      client: updatedClient,
      originDeviceId: deviceId
    });

    res.json({
      message: msgUpdate.rows[0],
      unread_count: newUnread,
      client: updatedClient
    });
  } catch (err) {
    console.error('Error al marcar mensaje como leído:', err);
    res.status(500).json({ error: 'Error al actualizar estado del mensaje' });
  }
});

// Agregar mensaje manual o desde scraper a la bandeja
app.post('/api/clients/:id/inbox', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { asunto, fecha, remitente, categoria, contenido, has_attachment, deviceId } = req.body;

    if (!asunto) {
      return res.status(400).json({ error: 'El asunto es obligatorio.' });
    }

    const clientRes = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
      [id, req.userId]
    );

    if (clientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const dateStr = fecha || new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    const insertRes = await pool.query(
      `INSERT INTO client_notifications (id, client_id, user_id, asunto, fecha, remitente, categoria, contenido, is_read, has_attachment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
       RETURNING *`,
      [msgId, id, req.userId, asunto.trim(), dateStr, remitente || 'SUNAT Operaciones en Línea', categoria || 'SIRE', contenido || '', Boolean(has_attachment)]
    );

    // Incrementar notificaciones pendientes del cliente
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM client_notifications WHERE client_id = $1 AND is_read = false',
      [id]
    );
    const newUnread = parseInt(countRes.rows[0].count, 10);

    const updatedClientRes = await pool.query(
      `UPDATE clients 
       SET notificaciones_pendientes = $1, origen_notificacion = 'SUNAT', detalle_notificacion = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [newUnread, asunto.trim(), id]
    );

    const updatedClient = updatedClientRes.rows[0];

    broadcastToUser(req.userId, 'client:updated', {
      client: updatedClient,
      originDeviceId: deviceId
    });

    res.status(201).json({
      message: insertRes.rows[0],
      unread_count: newUnread,
      client: updatedClient
    });
  } catch (err) {
    console.error('Error al insertar mensaje en buzón:', err);
    res.status(500).json({ error: 'Error al agregar mensaje' });
  }
});


// ==========================================
// --- ENDPOINTS DEL SCRAPER ROBOT (SUNAT) --
// ==========================================

// Escaneo bajo demanda de un cliente específico del usuario
app.post('/api/scraper/check/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body || {};

    const clientRes = await pool.query(
      'SELECT * FROM clients WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
      [id, req.userId]
    );
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
      broadcastToUser(req.userId, 'client:updated', {
        client: updated,
        originDeviceId: deviceId
      });

      // Enviar alerta instantánea por Telegram si hay notificaciones
      if (scanResult.notificaciones_pendientes > 0) {
        broadcastTelegramAlert(updated, scanResult).catch(console.error);
      }

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

// Escaneo masivo de los clientes del usuario
app.post('/api/scraper/check-all', authMiddleware, async (req, res) => {
  try {
    const clientsRes = await pool.query(
      'SELECT * FROM clients WHERE user_id = $1 OR user_id IS NULL',
      [req.userId]
    );
    const clients = clientsRes.rows;

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
            const clientUpdated = upd.rows[0];
            broadcastToUser(req.userId, 'client:updated', { client: clientUpdated });

            // Enviar alerta por Telegram si tiene notificaciones pendientes
            if (scan.notificaciones_pendientes > 0) {
              broadcastTelegramAlert(clientUpdated, scan).catch(console.error);
            }
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
    // Iniciar Bot interactivo de Telegram
    initTelegramBot(pool, checkClientBuzon).catch(console.error);
  });
}).catch((err) => {
  console.error('❌ Error fatal al iniciar la base de datos:', err);
  process.exit(1);
});
