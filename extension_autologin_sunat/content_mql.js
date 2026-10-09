// Content script que corre en la web de Agenda MQL para conectar con la extensión

(function () {
  console.log('⚡ [Agenda MQL Extension] Puente activo en la web de Agenda MQL.');

  // Indicar a la página que la extensión está instalada
  function notifyApp() {
    window.postMessage({ 
      type: 'MQL_EXTENSION_STATUS', 
      installed: true, 
      version: '1.1.0' 
    }, '*');
  }

  // Notificar al cargar y cada segundo durante los primeros 5 segundos
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
      const { ruc, usuario, clave } = event.data;
      console.log('📦 [Agenda MQL Extension] Recibida solicitud de login para RUC:', ruc);

      chrome.storage.local.set({
        pendingSunatLogin: {
          ruc,
          usuario,
          clave,
          timestamp: Date.now()
        }
      }, () => {
        console.log('✅ [Agenda MQL Extension] Credenciales guardadas en almacenamiento seguro de la extensión.');
        window.postMessage({ type: 'MQL_AUTOLOGIN_READY', ruc }, '*');
      });
    }
  });
})();
