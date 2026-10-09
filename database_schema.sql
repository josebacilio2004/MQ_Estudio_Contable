-- ================================================================
-- Esquema de Base de Datos para Supabase / PostgreSQL (M|Q Estudio Contable)
-- Arquitectura Multi-Tenant con Control de Usuarios Aislado
-- ================================================================

-- 1. Tabla de Usuarios del Sistema (Contadores / Administradores)
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

-- 2. Tabla de Agenda y Tablero Kanban (Aislada por user_id)
CREATE TABLE IF NOT EXISTS agenda_items (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_agenda_user ON agenda_items(user_id);
CREATE INDEX IF NOT EXISTS idx_agenda_date ON agenda_items(event_date);
CREATE INDEX IF NOT EXISTS idx_agenda_updated ON agenda_items(updated_at);

-- 3. Tabla de Clientes RUC y Credenciales SUNAT (Aislada por user_id)
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_ruc ON clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_razon ON clients(razon_social);

-- 4. Tabla de Suscriptores de Alertas por Telegram (@mqestudioscontables1_bot)
CREATE TABLE IF NOT EXISTS telegram_subscribers (
  chat_id BIGINT PRIMARY KEY,
  username VARCHAR(100),
  first_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
