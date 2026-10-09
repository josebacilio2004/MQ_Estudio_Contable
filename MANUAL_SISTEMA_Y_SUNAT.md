# 📖 Manual Técnico y Operativo: Sistema M|Q Estudio Contable
## Gestión Integral Tributaria, Control de Usuarios y Automatización de Clave SOL

---

## 🏛️ 1. Arquitectura General del Sistema

El sistema **M\|Q Estudio Contable** está diseñado bajo una arquitectura desacoplada, reactiva y de alto rendimiento que no genera costos de infraestructura ($0/mes), garantizando sincronización en tiempo real y accesibilidad desde cualquier dispositivo (laptops, computadoras de escritorio, tablets y teléfonos móviles).

```
                      ┌───────────────────────────────────────┐
                      │          USUARIO / DISPOSITIVOS       │
                      │  (Celular, Tablet, Laptop, Desktop)  │
                      └──────────────────┬────────────────────┘
                                         │ HTTPS / WSS
                                         ▼
         ┌─────────────────────────────────────────────────────────────┐
         │           FRONTEND: GitHub Pages (Directorio /docs)          │
         │      • React 18 + Tailwind CSS + Lucide Icons + Vite        │
         │      • Carga ultrarrápida vía CDN mundial con SSL           │
         │      • Responsive: Adaptado para navegación táctil y PC     │
         └───────────────────────────────┬─────────────────────────────┘
                                         │ REST API / WebSockets
                                         ▼
         ┌─────────────────────────────────────────────────────────────┐
         │             BACKEND: Render (Web Service Docker)            │
         │      • Node.js 20 + Express + Socket.IO                     │
         │      • Motor Chromium Headless (Puppeteer para Scraper)     │
         │      • Gestión de Sesiones JWT / HMAC-SHA256                │
         │      • Aislamiento de datos por sala de usuario             │
         └───────────────────────────────┬─────────────────────────────┘
                                         │ PostgreSQL (SSL Pooler)
                                         ▼
         ┌─────────────────────────────────────────────────────────────┐
         │              BASE DE DATOS: Supabase (PostgreSQL)           │
         │      • Tablas: users, clients, agenda_items                 │
         │      • Aislamiento Multi-Tenant por `user_id`               │
         │      • Conexión mediante Session Pooler (IPv4 compatible)   │
         └─────────────────────────────────────────────────────────────┘
```

---

## 🔐 2. Control de Usuarios y Aislamiento de Datos (Multi-Tenant)

### ¿Cómo funciona la independencia de datos?
Cada contador o asistente que utiliza el sistema cuenta con su propia cuenta privada. El sistema es **Multi-Tenant a nivel de fila (Row-Level Multi-Tenancy)**:

1. **Registro e Inicio de Sesión (`/api/auth/register` y `/api/auth/login`)**:
   - Cada usuario se registra con un nombre de usuario único, contraseña cifrada mediante HMAC-SHA256 con salt seguro, nombre completo y correo.
   - Al autenticarse, el servidor genera un token firmado que el frontend almacena de forma segura en `localStorage`.
2. **Aislamiento Estricto**:
   - Todas las consultas SQL filtran estrictamente por el `user_id` del token autenticado:
     ```sql
     SELECT * FROM clients WHERE user_id = $1;
     SELECT * FROM agenda_items WHERE user_id = $1;
     ```
   - Un usuario jamás podrá visualizar, editar ni borrar los clientes o la agenda de otro usuario.
3. **Salas de Sincronización en Tiempo Real (`user:{userId}`)**:
   - Cuando un dispositivo se conecta al WebSocket, se suscribe automáticamente a su canal privado: `socket.emit('user:join', user.id)`.
   - Si la contadora tiene abierto el sistema en su laptop y en su celular a la vez, cualquier cliente registrado o tarea completada en la laptop se refleja instantáneamente en su celular, **sin enviar datos a los celulares de otros contadores**.
4. **Cuenta Principal de Demostración Inicial**:
   - **Usuario**: `mqcontable`
   - **Contraseña**: `Admin2026*`

---

## ⚡ 3. Funcionamiento de los Inicios de Sesión a SUNAT (Clave SOL)

Uno de los mayores requerimientos de un estudio contable es la administración rápida de múltiples clientes con RUC sin perder tiempo digitando credenciales en el portal de SUNAT y revisando manualmente si existen notificaciones de cobranza, resoluciones o requerimientos de fiscalización (SUNAT y SUNAFIL).

El sistema cuenta con **dos métodos complementarios**:

---

### 🤖 Método A: Robot Scraper en Servidor (100% Desatendido / Sin Extensiones)
> **Ideal para:** Celulares, tablets y computadoras cuando se desea saber si hay notificaciones sin entrar manualmente a SUNAT.

#### Flujo paso a paso:
1. **Acción del usuario:** En la tarjeta del cliente, el usuario pulsa el botón **`🤖 Escanear`** (o pulsa **`Escanear Buzones (Robot)`** en la barra superior para procesar todos los clientes).
2. **Petición al Servidor:** El dispositivo envía una solicitud `POST /api/scraper/check/:id` con su token de autenticación.
3. **Lanzamiento de Navegador Virtual:**
   - En el servidor de Render, se inicia una instancia silenciosa de **Chromium Headless** mediante Puppeteer con banderas de bajo consumo (`--no-sandbox`, `--disable-gpu`, `--single-process`).
4. **Navegación y Autenticación Oficial:**
   - El robot se dirige a la URL de autenticación oficial de SUNAT Clave SOL:
     ```text
     https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/authen...
     ```
   - Selecciona la pestaña RUC (`#btnPorRuc`).
   - Digita automáticamente el RUC (`#txtRuc`), Usuario SOL (`#txtUsuario`) y Clave SOL (`#txtContrasena`).
   - Envía el formulario simulando comportamiento humano (`delay: 30ms`).
5. **Detección de Credenciales Erróneas:**
   - Si la Clave SOL fue modificada por el cliente o es incorrecta, el robot detecta el error en pantalla (`#divError`, `Credenciales no válidas`) y actualiza el estado en el sistema para advertir al contador.
6. **Inspección del Buzón SOL:**
   - Si el acceso es exitoso, el robot navega a la sección de Buzón Electrónico y cuenta los mensajes o notificaciones no leídas.
7. **Notificación en Vivo:**
   - Cierra el navegador virtual.
   - Guarda el número de notificaciones y el detalle en Supabase.
   - Emite el evento `client:updated` por WebSocket.
   - **Resultado:** En segundos, la tarjeta del cliente se ilumina en ámbar/rojo en todos los dispositivos conectados, mostrando el número de alertas y permitiendo enviar un mensaje preformateado por WhatsApp al cliente con 1 solo clic.

---

### 🖥️ Método B: Autologin Interactivo en el Navegador (Extensión Chrome)
> **Ideal para:** La computadora de escritorio de la contadora cuando necesita realizar trámites manuales, emitir facturas electrónicas, consultar declaraciones PDT o presentar descargos en el portal de SUNAT.

#### ¿Por qué SUNAT bloquea el auto-login por URL tradicional?
SUNAT implementa protección CSRF y directivas estrictas de seguridad (SameSite cookies y formularios POST) que no permiten enviar usuario y contraseña directamente en los parámetros de la URL pública.

#### Cómo lo resuelve nuestra extensión:
1. La contadora pulsa el botón **`Portal SUNAT`** en la tarjeta de cualquier cliente.
2. La extensión de Chrome incluida en [`extension_autologin_sunat/`](file:///d:/jose/Agenda_MQL/extension_autologin_sunat) detecta la solicitud y recibe las credenciales del cliente mediante un hash temporal en memoria.
3. Se abre automáticamente una nueva pestaña con la pantalla de inicio de sesión de SUNAT.
4. El script de contenido (`content_sunat.js`) inyecta instantáneamente el RUC, el Usuario SOL y la Clave en los inputs `#txtRuc`, `#txtUsuario` y `#txtContrasena`, disparando el evento de submit.
5. La contadora queda con la sesión abierta en el menú de SUNAT **en menos de 1 segundo**, lista para trabajar sin tener que copiar y pegar credenciales.

---

## 🔒 4. Buenas Prácticas de Seguridad para Credenciales SOL

Para garantizar la máxima seguridad en el estudio contable:
1. **Uso de Usuarios Secundarios SOL**:
   - Se recomienda registrar siempre en el sistema el **Usuario Secundario SOL** creado en el portal de SUNAT (ej. `74934503Fact` con permisos específicos de consulta de buzón y facturación), en lugar de la clave principal del titular, evitando riesgos de accesos no autorizados a cuentas bancarias o detracciones.
2. **Cifrado en Tránsito y Reposo**:
   - Las conexiones entre el Frontend (GitHub Pages), Backend (Render) y Base de Datos (Supabase) viajan 100% bajo túneles TLS/SSL cifrados (`https://` y `wss://`).
3. **Visibilidad Oculta por Defecto**:
   - En la interfaz gráfica del sistema, las contraseñas SOL se muestran como `••••••••`. El usuario puede pulsar el botón **Ver** u ocultarlas según lo necesite, o utilizar el botón de copiado rápido al portapapeles.

---

## 📱 5. Conexión de Dispositivos Móviles (Celulares y Tablets)

Para abrir el sistema en cualquier celular o tablet:
1. Abre tu navegador móvil (Chrome, Safari, Edge, Firefox).
2. Ingresa a la URL de tu frontend:
   ```text
   https://josebacilio2004.github.io/MQ_Estudio_Contable/
   ```
3. Inicia sesión con tu usuario y contraseña.
4. Puedes pulsar el menú del navegador y seleccionar **"Agregar a la pantalla de inicio"** para usar el sistema como una aplicación móvil nativa (PWA / Web App).
