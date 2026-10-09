// Content script que corre dentro del portal oficial de SUNAT Clave SOL y SUNAFIL
// Automatización Robótica (RPA) y Soporte de Sesiones Aisladas (Buzone Architecture)

(function () {
  console.log('🏛️ [Agenda MQL Extension] Verificando credenciales aisladas en portal de SUNAT/SUNAFIL...');

  // Intentar obtener credenciales asignadas específicamente a esta pestaña/ventana
  chrome.runtime.sendMessage({ type: 'GET_TAB_CREDENTIALS' }, (response) => {
    let credentials = response ? response.credentials : null;

    if (!credentials) {
      // Respaldo en storage local
      chrome.storage.local.get(['pendingSunatLogin'], (res) => {
        proceedWithLogin(res.pendingSunatLogin);
      });
    } else {
      proceedWithLogin(credentials);
    }
  });

  function proceedWithLogin(credentials) {
    if (!credentials || !credentials.ruc || !credentials.clave) {
      return;
    }

    // Verificar que las credenciales no tengan más de 5 minutos de antigüedad
    if (credentials.timestamp && Date.now() - credentials.timestamp > 300000) {
      console.log('⌛ [Agenda MQL] Credenciales expiradas (> 5 minutos).');
      chrome.storage.local.remove('pendingSunatLogin');
      return;
    }

    const { ruc, usuario, clave, razonSocial } = credentials;
    console.log(`🔐 [Agenda MQL] Ejecutando Auto-Login RPA para RUC: ${ruc} (${razonSocial || ''})...`);

    showVisualBadge(ruc, razonSocial);

    // Intentar autocompletar buscando los inputs periódicamente
    let attempts = 0;
    const maxAttempts = 35; // 35 * 200ms = 7 segundos

    const interval = setInterval(() => {
      attempts++;

      // Cambiar a la pestaña "Entrar con RUC" si la página inicia en DNI
      const btnPorRuc = document.getElementById('btnPorRuc') || 
                        document.querySelector('.btnPorRuc') ||
                        document.querySelector('button[value="ruc"]');
      if (btnPorRuc && typeof btnPorRuc.click === 'function') {
        const filaRuc = document.getElementById('divFilaRuc');
        if (filaRuc && (filaRuc.style.display === 'none' || getComputedStyle(filaRuc).display === 'none')) {
          btnPorRuc.click();
        }
      }

      // Campos oficiales del portal de SUNAT Clave SOL
      const rucInput = document.getElementById('txtRuc') || 
                       document.querySelector('input[name="txtRuc"]') ||
                       document.querySelector('input[placeholder*="RUC"]');

      const userInput = document.getElementById('txtUsuario') || 
                        document.querySelector('input[name="txtUsuario"]') ||
                        document.querySelector('input[placeholder*="Usuario"]');

      const pwdInput = document.getElementById('txtContrasena') || 
                       document.querySelector('input[name="txtContrasena"]') ||
                       document.querySelector('input[type="password"]');

      const submitBtn = document.getElementById('btnAceptar') || 
                        document.querySelector('button[type="submit"]') ||
                        document.querySelector('.btn-primary');

      if (rucInput && userInput && pwdInput) {
        clearInterval(interval);

        // Limpiar para no repetir en futuras recargas accidentales
        chrome.storage.local.remove('pendingSunatLogin');

        // Inyección de valores nativos
        setNativeValue(rucInput, ruc);
        setNativeValue(userInput, usuario);
        setNativeValue(pwdInput, clave);

        console.log('✅ [Agenda MQL] RUC, Usuario y Clave SOL inyectados exitosamente.');

        // Enviar formulario automáticamente (RPA)
        setTimeout(() => {
          if (submitBtn) {
            console.log('🚀 [Agenda MQL] Pulsando botón Iniciar Sesión...');
            submitBtn.click();
          }
        }, 350);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.warn('⚠️ [Agenda MQL] No se encontraron los campos del formulario tras 7 segundos.');
      }
    }, 200);
  }

  // Función para establecer valor disparando eventos compatibles con React, Angular y jQuery
  function setNativeValue(element, value) {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    element.blur();
  }

  // Notificación visual flotante dentro del portal de SUNAT
  function showVisualBadge(ruc, razonSocial) {
    const badge = document.createElement('div');
    badge.id = 'mql-autologin-banner';
    badge.innerHTML = `
      <div style="position:fixed; top:12px; right:12px; z-index:999999; background:#0f172a; color:#f8fafc; border:1px solid #3b82f6; border-radius:14px; padding:10px 16px; font-family:sans-serif; box-shadow:0 12px 30px rgba(0,0,0,0.6); display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:10px; height:10px; background:#10b981; border-radius:50%; box-shadow:0 0 10px #10b981;"></span>
        <div>
          <div style="font-size:12px; font-weight:bold; color:#60a5fa;">Agenda MQL • Sesión Aislada SUNAT</div>
          <div style="font-size:11px; color:#cbd5e1;">Iniciando sesión: ${razonSocial ? razonSocial.slice(0, 30) : ruc}...</div>
        </div>
      </div>
    `;
    document.body.appendChild(badge);
    setTimeout(() => {
      if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    }, 4500);
  }
})();
