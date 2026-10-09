// Background Service Worker - Agenda MQL & Buzone Isolation Architecture
// Gestión de Contenedores de Sesión Aislados (Session Isolation) y Automatización RPA

console.log('🚀 [Agenda MQL Background] Service Worker de Aislamiento de Sesiones activo.');

// Mapeo en memoria de tabId -> credenciales de sesión
const tabSessionMap = new Map();

// Escuchar mensajes desde content scripts (web de Agenda MQL o portal SUNAT)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_ISOLATED_SESSION') {
    const { ruc, usuario, clave, razonSocial, mode = 'popup' } = message;
    console.log(`🔐 [Session Isolation] Iniciando sesión aislada para ${razonSocial} (RUC: ${ruc}) en modo: ${mode}`);

    const sunatUrl = 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm?pestana=*&agrupacion=*';

    // Abrir como ventana aislada dedicada (tipo Popup de aplicación) o ventana normal
    const createData = {
      url: sunatUrl,
      type: mode === 'popup' ? 'popup' : 'normal',
      width: 1280,
      height: 850,
      focused: true
    };

    chrome.windows.create(createData, (win) => {
      if (win && win.tabs && win.tabs.length > 0) {
        const tab = win.tabs[0];
        // Vincular credenciales estrictamente a esta pestaña
        tabSessionMap.set(tab.id, {
          ruc,
          usuario,
          clave,
          razonSocial,
          timestamp: Date.now()
        });

        // Guardar también en almacenamiento seguro de respaldo
        chrome.storage.local.set({
          [`session_tab_${tab.id}`]: { ruc, usuario, clave, razonSocial, timestamp: Date.now() },
          pendingSunatLogin: { ruc, usuario, clave, razonSocial, timestamp: Date.now() }
        });

        sendResponse({ success: true, tabId: tab.id, windowId: win.id });
      }
    });

    return true; // Respuesta asíncrona
  }

  // Solicitud desde content_sunat.js para obtener las credenciales de su pestaña
  if (message.type === 'GET_TAB_CREDENTIALS') {
    const tabId = sender.tab ? sender.tab.id : null;
    let creds = tabId ? tabSessionMap.get(tabId) : null;

    if (!creds && tabId) {
      chrome.storage.local.get([`session_tab_${tabId}`, 'pendingSunatLogin'], (res) => {
        creds = res[`session_tab_${tabId}`] || res.pendingSunatLogin;
        sendResponse({ credentials: creds });
      });
      return true;
    }

    sendResponse({ credentials: creds });
  }

  // Limpieza al cerrar pestaña
  if (message.type === 'CLEAR_TAB_CREDENTIALS') {
    if (sender.tab) {
      tabSessionMap.delete(sender.tab.id);
      chrome.storage.local.remove(`session_tab_${sender.tab.id}`);
    }
  }
});

// Limpiar del mapa cuando una pestaña se cierra
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSessionMap.delete(tabId);
  chrome.storage.local.remove(`session_tab_${tabId}`);
});
