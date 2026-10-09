-- Esquema de Base de Datos para Supabase / PostgreSQL (Agenda MQL)
-- Si ejecutas el backend con DATABASE_URL, estas tablas se crean automáticamente al iniciar.
-- También puedes ejecutar este script directamente en el SQL Editor de Supabase:

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
