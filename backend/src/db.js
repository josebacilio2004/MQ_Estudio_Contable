const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'agenda_user',
      password: process.env.PGPASSWORD || 'agenda_pass123',
      database: process.env.PGDATABASE || 'agenda_mql_db',
      port: parseInt(process.env.PGPORT || '5432', 10),
    };

const pool = new Pool(poolConfig);

async function waitForDb(retries = 15, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Conectado exitosamente a PostgreSQL.');
      client.release();
      return;
    } catch (err) {
      console.log(`⏳ Esperando conexión con PostgreSQL... (intento ${i + 1}/${retries}) - Detalle: ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('❌ No se pudo conectar a la base de datos PostgreSQL.');
}

const { hashPassword } = require('./auth');

async function initDb() {
  await waitForDb();

  // 1. Tabla de Usuarios (Multi-tenant)
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150),
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150),
      role VARCHAR(50) DEFAULT 'contador',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `;
  await pool.query(createUsersTableQuery);

  // Tabla de Suscriptores de Alertas por Telegram
  const createTelegramSubscribersQuery = `
    CREATE TABLE IF NOT EXISTS telegram_subscribers (
      chat_id BIGINT PRIMARY KEY,
      username VARCHAR(100),
      first_name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await pool.query(createTelegramSubscribersQuery);

  // 2. Tabla de Agenda
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS agenda_items (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date VARCHAR(30) NOT NULL,
      event_time VARCHAR(10) NOT NULL,
      category VARCHAR(50) DEFAULT 'General',
      color_tag VARCHAR(20) DEFAULT '#3B82F6',
      is_completed BOOLEAN DEFAULT FALSE,
      kanban_status VARCHAR(30) DEFAULT 'todo',
      external_url TEXT,
      url_label VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_agenda_date ON agenda_items(event_date);
    CREATE INDEX IF NOT EXISTS idx_agenda_updated ON agenda_items(updated_at);
  `;
  await pool.query(createTableQuery);

  // 3. Migración de columnas user_id y kanban_status
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agenda_items' AND column_name='kanban_status'
      ) THEN 
        ALTER TABLE agenda_items ADD COLUMN kanban_status VARCHAR(30) DEFAULT 'todo';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agenda_items' AND column_name='user_id'
      ) THEN 
        ALTER TABLE agenda_items ADD COLUMN user_id VARCHAR(64);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_agenda_user ON agenda_items(user_id);
  `);

  // 4. Sembrado de Usuario Administrador / Demo inicial
  const defaultUserId = 'usr-mql-admin';
  const checkUserCount = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(checkUserCount.rows[0].count, 10) === 0) {
    console.log('🌱 Creando usuario principal inicial (MQ Estudio Contable)...');
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        defaultUserId,
        'mqcontable',
        'contacto@mqcontable.pe',
        hashPassword('Admin2026*'),
        'MQ Estudio Contable',
        'admin'
      ]
    );
    console.log('✅ Usuario inicial creado: usuario="mqcontable" / clave="Admin2026*"');
  }

  // Asignar items existentes sin user_id al usuario por defecto
  await pool.query(`UPDATE agenda_items SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);

  // Verificar si hay registros de agenda; si está vacía, sembrar ejemplos
  const checkCount = await pool.query('SELECT COUNT(*) FROM agenda_items WHERE user_id = $1', [defaultUserId]);
  if (parseInt(checkCount.rows[0].count, 10) === 0) {
    console.log('🌱 Sembrando datos iniciales de demostración...');
    const seedQueries = [
      {
        id: 'seed-1',
        title: 'Reunión de Alineación de Proyecto MQL',
        description: 'Revisión de avance con el equipo técnico y sincronización de entregables.',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '10:00',
        category: 'Reunión',
        color_tag: '#8B5CF6',
        is_completed: false,
        external_url: 'https://meet.google.com',
        url_label: 'Sala Google Meet'
      },
      {
        id: 'seed-2',
        title: 'Revisión de Métricas en Dashboard',
        description: 'Verificar estadísticas de operaciones y transacciones del día.',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '14:30',
        category: 'Trabajo',
        color_tag: '#3B82F6',
        is_completed: true,
        external_url: 'https://github.com',
        url_label: 'Repositorio GitHub'
      },
      {
        id: 'seed-3',
        title: 'Documentación de APIs y Arquitectura',
        description: 'Actualizar especificación técnica OpenAPI y esquemas de datos.',
        event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        event_time: '16:00',
        category: 'Documentación',
        color_tag: '#10B981',
        is_completed: false,
        external_url: 'https://developer.mozilla.org',
        url_label: 'Documentación MDN'
      }
    ];

    for (const item of seedQueries) {
      await pool.query(
        `INSERT INTO agenda_items (id, title, description, event_date, event_time, category, color_tag, is_completed, external_url, url_label)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [item.id, item.title, item.description, item.event_date, item.event_time, item.category, item.color_tag, item.is_completed, item.external_url, item.url_label]
      );
    }
    console.log('✅ Datos de demostración insertados.');
  }

  // Tabla de Clientes con RUC y credenciales de SUNAT Clave SOL (vinculada a user_id)
  const createClientsTableQuery = `
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      ruc VARCHAR(11) NOT NULL,
      razon_social VARCHAR(255) NOT NULL,
      nombre_comercial VARCHAR(255),
      telefono VARCHAR(30),
      email VARCHAR(100),
      sunat_usuario VARCHAR(100) NOT NULL,
      sunat_clave VARCHAR(100) NOT NULL,
      estado_contribuyente VARCHAR(50) DEFAULT 'ACTIVO',
      condicion_domicilio VARCHAR(50) DEFAULT 'HABIDO',
      notificaciones_pendientes INTEGER DEFAULT 0,
      origen_notificacion VARCHAR(100),
      detalle_notificacion TEXT,
      notas TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_clients_ruc ON clients(ruc);
    CREATE INDEX IF NOT EXISTS idx_clients_razon ON clients(razon_social);
  `;
  await pool.query(createClientsTableQuery);

  // Asegurar migración de user_id en clients
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='clients' AND column_name='user_id'
      ) THEN 
        ALTER TABLE clients ADD COLUMN user_id VARCHAR(64);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
  `);

  // Asignar clientes existentes al usuario por defecto si no tienen user_id
  await pool.query(`UPDATE clients SET user_id = $1 WHERE user_id IS NULL`, [defaultUserId]);

  // Verificar si hay clientes registrados para este usuario; si está vacía, sembrar ejemplos
  const checkClientsCount = await pool.query('SELECT COUNT(*) FROM clients WHERE user_id = $1', [defaultUserId]);
  if (parseInt(checkClientsCount.rows[0].count, 10) === 0) {
    console.log('🌱 Sembrando clientes iniciales de demostración...');
    const seedClients = [
      {
        id: 'client-1',
        user_id: defaultUserId,
        ruc: '20601234567',
        razon_social: 'SERVICIOS Y SOLUCIONES MQL S.A.C.',
        nombre_comercial: 'MQL Solutions',
        telefono: '987654321',
        email: 'contacto@mqlsolutions.pe',
        sunat_usuario: 'MODDATOS',
        sunat_clave: 'SolPass2026*',
        estado_contribuyente: 'ACTIVO',
        condicion_domicilio: 'HABIDO',
        notificaciones_pendientes: 1,
        origen_notificacion: 'SUNAT',
        detalle_notificacion: 'Resolución de Intendencia N° 012-2026 sobre compensación de saldo a favor materia de beneficio.',
        notas: 'Régimen Mype Tributario. Presenta PDT 621 los días 15 de cada mes.'
      },
      {
        id: 'client-2',
        user_id: defaultUserId,
        ruc: '20559876543',
        razon_social: 'IMPORTACIONES & LOGISTICA DEL SUR E.I.R.L.',
        nombre_comercial: 'Logística del Sur',
        telefono: '954123987',
        email: 'gerencia@surlogistica.com',
        sunat_usuario: 'ADMINSUR',
        sunat_clave: 'SurLogistica#99',
        estado_contribuyente: 'ACTIVO',
        condicion_domicilio: 'HABIDO',
        notificaciones_pendientes: 2,
        origen_notificacion: 'SUNAFIL',
        detalle_notificacion: 'Requerimiento de información inspectiva sobre registro de control de asistencia y Comité de SST.',
        notas: 'Régimen General. Emite facturas electrónicas masivas.'
      },
      {
        id: 'client-3',
        user_id: defaultUserId,
        ruc: '10457896541',
        razon_social: 'FLORES CASTILLO CARLOS DANIEL',
        nombre_comercial: 'Consultoría Flores',
        telefono: '912345678',
        email: 'carlos.flores@gmail.com',
        sunat_usuario: 'CFLORES2',
        sunat_clave: 'CarlosClave@24',
        estado_contribuyente: 'ACTIVO',
        condicion_domicilio: 'HABIDO',
        notificaciones_pendientes: 0,
        origen_notificacion: null,
        detalle_notificacion: null,
        notas: 'Persona Natural con Negocio. Recibos por honorarios y 4ta categoría.'
      }
    ];

    for (const c of seedClients) {
      await pool.query(
        `INSERT INTO clients (id, user_id, ruc, razon_social, nombre_comercial, telefono, email, sunat_usuario, sunat_clave, estado_contribuyente, condicion_domicilio, notificaciones_pendientes, origen_notificacion, detalle_notificacion, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [c.id, c.user_id, c.ruc, c.razon_social, c.nombre_comercial, c.telefono, c.email, c.sunat_usuario, c.sunat_clave, c.estado_contribuyente, c.condicion_domicilio, c.notificaciones_pendientes, c.origen_notificacion, c.detalle_notificacion, c.notas]
      );
    }
    console.log('✅ Clientes de demostración insertados.');
  }

  // Asegurar que el cliente oficial Mister Pepe II exista
  const mrPepeCheck = await pool.query("SELECT id FROM clients WHERE ruc = '10418236103'");
  let mrPepeId = 'client-mr-pepe-2';
  if (mrPepeCheck.rows.length === 0) {
    console.log('🌱 Registrando cliente oficial MISTER PEPE II...');
    await pool.query(`
      INSERT INTO clients (
        id, user_id, ruc, razon_social, nombre_comercial, telefono, email,
        sunat_usuario, sunat_clave, estado_contribuyente, condicion_domicilio,
        notificaciones_pendientes, origen_notificacion, detalle_notificacion, notas
      ) VALUES (
        $1, $2, '10418236103', 'DE LA CRUZ BALDEON ROCIO ELENA', 'MISTER PEPE II', '941823610', 'misterpepe2@gmail.com',
        '74934503', '74934503Fact', 'ACTIVO', 'HABIDO', 3, 'SUNAT', 'Propuesta del Registro de Compras y Ventas - 202608',
        'Pollería y restaurante. Régimen Especial / Mype Tributario.'
      )
    `, [mrPepeId, defaultUserId]);
  } else {
    mrPepeId = mrPepeCheck.rows[0].id;
    await pool.query(`
      UPDATE clients 
      SET notificaciones_pendientes = 3, 
          origen_notificacion = 'SUNAT',
          detalle_notificacion = 'Propuesta del Registro de Compras y Ventas - 202608'
      WHERE id = $1
    `, [mrPepeId]);
  }

  // 6. Tabla de Notificaciones / Correos del Buzón Electrónico SUNAT y SUNAFIL
  const createNotificationsTableQuery = `
    CREATE TABLE IF NOT EXISTS client_notifications (
      id VARCHAR(64) PRIMARY KEY,
      client_id VARCHAR(64) REFERENCES clients(id) ON DELETE CASCADE,
      user_id VARCHAR(64),
      asunto VARCHAR(255) NOT NULL,
      fecha VARCHAR(50),
      remitente VARCHAR(100) DEFAULT 'SUNAT',
      categoria VARCHAR(100) DEFAULT 'SIRE',
      contenido TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      has_attachment BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_client ON client_notifications(client_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON client_notifications(user_id);
  `;
  await pool.query(createNotificationsTableQuery);

  // Sembrar los mensajes oficiales de la bandeja de SUNAT de Mister Pepe II
  const checkNotifs = await pool.query('SELECT COUNT(*) FROM client_notifications WHERE client_id = $1', [mrPepeId]);
  if (parseInt(checkNotifs.rows[0].count, 10) === 0) {
    console.log('🌱 Sembrando correos del Buzón Electrónico SUNAT para Mister Pepe II...');
    const seedNotifs = [
      {
        id: 'msg-pepe-1',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Propuesta del Registro de Compras y Ventas - 202608',
        fecha: '03/10/2026 14:14:45',
        remitente: 'SUNAT Operaciones en Línea',
        categoria: 'SIRE',
        is_read: false,
        has_attachment: false,
        contenido: `DE LA CRUZ BALDEON ROCIO ELENA\nRUC: 10418236103\n\nEstimado(a) Contribuyente:\nEn la SUNAT, hemos asumido el compromiso de brindarle la asistencia necesaria para que usted pueda cumplir, oportuna y correctamente, con sus obligaciones tributarias.\n\nEn ese sentido, le informamos que, según la información de sus comprobantes de pago electrónicos y documentos autorizados, se ha efectuado la propuesta para la generación de su Registro de Compras Electrónico (RCE) y Registro de Ventas e Ingresos Electrónicos (RVIE) a través del Sistema Integral de Registros Electrónicos (SIRE) al cual puede acceder en SUNAT Operaciones en Línea.\n\nPeriodo: 202608\n\nRCE - Compras:\nTipo de Documento | Cantidad\n01 Factura | 32\n07 Nota de Crédito | 1\nTotal: 33\n\nRVIE - Ventas:\nTipo de Documento | Cantidad\n01 Factura | 19\n03 Boleta de Venta | 4\nTotal: 23\n\nLe solicitamos que valide la propuesta y, de ser el caso, proceda a la generación del Registro de Compras y Registro de Ventas e Ingresos Electrónicos a partir del octavo día del presente mes y dentro de los plazos máximos de atraso establecidos para su generación.\n\nPara más información, visite nuestro micrositio: cpe.sunat.gob.pe\n\nAtentamente,\nSUNAT`
      },
      {
        id: 'msg-pepe-2',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Generación de Registro RVIE y RCE del periodo 202608',
        fecha: '17/09/2026 16:48:20',
        remitente: 'SUNAT - SIRE',
        categoria: 'SIRE',
        is_read: false,
        has_attachment: true,
        contenido: `DE LA CRUZ BALDEON ROCIO ELENA\nRUC: 10418236103\n\nSe ha completado satisfactoriamente el procesamiento del Registro de Ventas e Ingresos Electrónico (RVIE) y Registro de Compras Electrónico (RCE) para el periodo 2026-08.\n\nSe adjunta la constancia de recepción electrónica correspondiente.`
      },
      {
        id: 'msg-pepe-3',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Inicio de generación de RVIE y RCE periodo 202608',
        fecha: '17/09/2026 16:45:12',
        remitente: 'SUNAT - SIRE',
        categoria: 'SIRE',
        is_read: false,
        has_attachment: false,
        contenido: `Se ha iniciado el proceso de validación preliminar de comprobantes de pago electrónicos para la propuesta del periodo tributario 202608.`
      },
      {
        id: 'msg-pepe-4',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Vencimiento del Registro de Compras y Ventas - 202608',
        fecha: '16/09/2026 08:58:21',
        remitente: 'SUNAT Alertas',
        categoria: 'Avisos',
        is_read: true,
        has_attachment: false,
        contenido: `Recordatorio de vencimiento de obligaciones tributarias para el dígito 3 de RUC correspondiente al periodo 2026-08.`
      },
      {
        id: 'msg-pepe-5',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Envío de clave (PIN) de instalación del CDT - Número de Solicitud 2026000818074',
        fecha: '07/09/2026 14:00:30',
        remitente: 'Certificado Digital SUNAT',
        categoria: 'CDT',
        is_read: true,
        has_attachment: false,
        contenido: `Se ha generado el PIN de seguridad de su Certificado Digital Tributario (CDT). Utilícelo para la emisión autorizada de sus comprobantes de pago electrónicos.`
      },
      {
        id: 'msg-pepe-6',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Emisión de Certificado Digital Tributario - Número de Solicitud 2026000818071',
        fecha: '07/09/2026 13:57:01',
        remitente: 'Certificado Digital SUNAT',
        categoria: 'CDT',
        is_read: true,
        has_attachment: false,
        contenido: `Su solicitud N° 2026000818071 de emisión gratuita de Certificado Digital Tributario ha sido aprobada con éxito.`
      },
      {
        id: 'msg-pepe-7',
        client_id: mrPepeId,
        user_id: defaultUserId,
        asunto: 'Sistema de Emisión Electrónica SOL',
        fecha: '05/09/2026 16:31:31',
        remitente: 'SUNAT Comprobantes',
        categoria: 'Avisos',
        is_read: true,
        has_attachment: false,
        contenido: `Actualización de parámetros técnicos para la emisión de facturas y boletas electrónicas desde el portal SUNAT Operaciones en Línea.`
      }
    ];

    for (const msg of seedNotifs) {
      await pool.query(`
        INSERT INTO client_notifications (id, client_id, user_id, asunto, fecha, remitente, categoria, is_read, has_attachment, contenido)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [msg.id, msg.client_id, msg.user_id, msg.asunto, msg.fecha, msg.remitente, msg.categoria, msg.is_read, msg.has_attachment, msg.contenido]);
    }
    console.log('✅ 7 correos del Buzón SUNAT insertados para Mister Pepe II.');
  }
}

module.exports = {
  pool,
  initDb
};
