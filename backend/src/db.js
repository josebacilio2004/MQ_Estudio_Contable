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

async function initDb() {
  await waitForDb();

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS agenda_items (
      id VARCHAR(64) PRIMARY KEY,
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

  // Asegurar migración de columna kanban_status si la tabla ya existía
  await pool.query(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='agenda_items' AND column_name='kanban_status'
      ) THEN 
        ALTER TABLE agenda_items ADD COLUMN kanban_status VARCHAR(30) DEFAULT 'todo';
      END IF;
    END $$;
  `);

  // Verificar si hay registros; si está vacía, sembrar ejemplos
  const checkCount = await pool.query('SELECT COUNT(*) FROM agenda_items');
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

  // Tabla de Clientes con RUC y credenciales de SUNAT Clave SOL
  const createClientsTableQuery = `
    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(64) PRIMARY KEY,
      ruc VARCHAR(11) UNIQUE NOT NULL,
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

  // Verificar si hay clientes registrados; si está vacía, sembrar ejemplos
  const checkClientsCount = await pool.query('SELECT COUNT(*) FROM clients');
  if (parseInt(checkClientsCount.rows[0].count, 10) === 0) {
    console.log('🌱 Sembrando clientes iniciales de demostración...');
    const seedClients = [
      {
        id: 'client-1',
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
        `INSERT INTO clients (id, ruc, razon_social, nombre_comercial, telefono, email, sunat_usuario, sunat_clave, estado_contribuyente, condicion_domicilio, notificaciones_pendientes, origen_notificacion, detalle_notificacion, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [c.id, c.ruc, c.razon_social, c.nombre_comercial, c.telefono, c.email, c.sunat_usuario, c.sunat_clave, c.estado_contribuyente, c.condicion_domicilio, c.notificaciones_pendientes, c.origen_notificacion, c.detalle_notificacion, c.notas]
      );
    }
    console.log('✅ Clientes de demostración insertados.');
  }
}

module.exports = {
  pool,
  initDb
};
