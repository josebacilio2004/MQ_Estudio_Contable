# 📅 Agenda MQL - Sistema en Tiempo Real Multi-dispositivo

Sistema de agenda moderno y reactivo diseñado para sincronización simultánea entre **laptop, teléfono móvil y computadora de escritorio**, con redirección directa a enlaces externos (Google Meet, Zoom, Dashboards, sitios web).

---

## 🚀 Arquitectura y Tecnologías

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Nginx (PWA Ready).
- **Backend**: Node.js, Express, Socket.io (Motor WebSocket reactivo).
- **Base de Datos**: PostgreSQL 16 con índices de búsqueda optimizados.
- **Docker Compose**: Orquestación completa en contenedores para pruebas locales y LAN.

---

## ⚡ Puertos y Accesos del Sistema

| Servicio | Puerto Contenedor | URL Local (PC/Laptop) | URL Red Local (Celular / Otra Laptop) |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | `3100` | `http://localhost:3100` | `http://192.168.1.21:3100` |
| **Backend API / WS** | `4100` | `http://localhost:4100` | `http://192.168.1.21:4100` |
| **PostgreSQL DB** | `5435` | `localhost:5435` | `agenda_db:5432` (interno Docker) |

---

## 📲 Cómo Probar la Sincronización Simultánea

1. En tu computadora principal, abre tu navegador en:
   👉 **`http://localhost:3100`**

2. En tu **teléfono móvil** o laptop conectado a la misma red Wi-Fi, abre el navegador en:
   👉 **`http://192.168.1.21:3100`**

3. **Prueba de fuego en vivo:**
   - En tu teléfono, presiona la casilla de verificación de cualquier tarea o evento.
   - Observarás que en la pantalla de tu computadora o laptop se marca **al milisegundo**, sin tener que refrescar la página, acompañado de un destello visual reactivo.
   - Crea un nuevo registro o edítalo desde cualquiera de los dispositivos y se replicará instantáneamente en todos los demás.
   - Haz clic en cualquier enlace (`Google Meet`, `GitHub`, `Sitio Web`) para redirigirte a la página externa sin perder tu sesión de agenda.

---

## 🛠️ Comandos de Control (Docker)

```powershell
# Levantar el sistema en segundo plano
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Detener los contenedores
docker compose down
```
