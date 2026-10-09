// Content script que corre en la web de Agenda MQL para conectar con la extensión
// Soporte de Arquitectura Buzone: AutoLogin RPA y Sesiones Aisladas

(function () {
  console.log('⚡ [Agenda MQL Extension] Puente activo v1.2.0 (Buzone Session Isolation).');

  // Indicar a la página web que la extensión está instalada
  function notifyApp() {
    window.postMessage({ 
      type: 'MQL_EXTENSION_STATUS', 
      installed: true, 
      version: '1.2.0',
      supportsIsolation: true
    }, '*');
  }

  notifyApp();
  const timer = setInterval(notifyApp, 1000);
  setTimeout(() => clearInterval(timer), 5000);

  // Escuchar solicitudes de inicio de sesión desde Agenda MQL
  window.addEventListener('message', (event) => {
    if (!event.data || event.source !== window) return;

    if (event.data.type === 'MQL_CHECK_EXTENSION') {
      notifyApp();
    }

    if (event.data.type === 'MQL_AUTOLOGIN_REQUEST') {
      const { ruc, usuario, clave, razonSocial, mode = 'isolated_window' } = event.data;
      console.log(`📦 [Agenda MQL Extension] Solicitud de login RPA para RUC: ${ruc} (Modo: ${mode})`);

      // 1. Guardar en storage seguro como respaldo
      chrome.storage.local.set({
        pendingSunatLogin: {
          ruc,
          usuario,
          clave,
          razonSocial,
          timestamp: Date.now()
        }
      });

      // 2. Si se solicita ventana aislada (comportamiento tipo Buzone), delegar al background service worker
      if (mode === 'isolated_window' || mode === 'popup') {
        chrome.runtime.sendMessage({
          type: 'START_ISOLATED_SESSION',
          ruc,
          usuario,
          clave,
          razonSocial,
          mode: 'popup'
        }, (res) => {
          console.log('✅ [Agenda MQL Extension] Ventana de sesión aislada creada:', res);
          window.postMessage({ type: 'MQL_AUTOLOGIN_READY', ruc, isolated: true }, '*');
        });
      } else {
        window.postMessage({ type: 'MQL_AUTOLOGIN_READY', ruc, isolated: false }, '*');
      }
    }
  });
})();
