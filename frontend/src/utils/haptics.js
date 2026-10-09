// Utilidad para Feedback Háptico en móviles y Notificaciones Push Web
// MQ Estudio Contable - Agenda MQL

/**
 * Dispara una vibración háptica suave en dispositivos móviles (Android / navegadores compatibles)
 * @param {number|number[]} pattern Duración en milisegundos o patrón [vibra, pausa, vibra]
 */
export function triggerHaptic(pattern = 15) {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // Silencioso en caso de no soportar o restricciones de usuario
  }
}

/**
 * Solicita permisos de notificación al usuario en el navegador
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Muestra una notificación push local en el navegador/celular
 */
export function showPushNotification(title, options = {}) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notif = new Notification(title, {
      icon: '/icon_sin_fondo.png',
      badge: '/icon_sin_fondo.png',
      vibrate: [200, 100, 200],
      ...options
    });

    if (options.url) {
      notif.onclick = () => {
        window.focus();
        window.open(options.url, '_blank');
        notif.close();
      };
    }
  } catch (err) {
    console.warn('No se pudo emitir notificación web:', err);
  }
}

// Registro de eventos ya notificados para no repetir
const notifiedEventIds = new Set();

/**
 * Revisa si un evento está a 10 minutos o menos de ocurrir y emite una alerta
 */
export function checkUpcomingEvents(items = []) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = new Date();

  items.forEach((item) => {
    if (!item.event_date || !item.event_time || item.is_completed) return;
    if (notifiedEventIds.has(item.id)) return;

    try {
      // Parsear fecha y hora: formato YYYY-MM-DD y HH:mm
      const [year, month, day] = item.event_date.split('-').map(Number);
      const [hours, minutes] = item.event_time.split(':').map(Number);

      const eventDate = new Date(year, month - 1, day, hours, minutes, 0);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Si falta entre 1 y 12 minutos
      if (diffMinutes >= 0 && diffMinutes <= 12) {
        notifiedEventIds.add(item.id);
        triggerHaptic([100, 50, 100]);
        showPushNotification(`⏰ En ${diffMinutes} min: ${item.title}`, {
          body: `${item.description ? item.description.slice(0, 120) : 'Reunión o compromiso programado en tu Agenda MQL'}\nHora: ${item.event_time}`,
          url: item.external_url || window.location.href,
          tag: `event-${item.id}`
        });
      }
    } catch (e) {
      // Ignorar errores de parseo de fecha
    }
  });
}
