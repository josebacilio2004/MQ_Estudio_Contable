import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Building2, 
  Sparkles, 
  Bookmark,
  AlertCircle,
  HelpCircle,
  Puzzle
} from 'lucide-react';

export default function SunatLoginModal({ isOpen, onClose, client }) {
  const [copiedField, setCopiedField] = useState(null);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    function handleMsg(event) {
      if (event.data && event.data.type === 'MQL_EXTENSION_STATUS' && event.data.installed) {
        setIsExtensionInstalled(true);
      }
    }
    window.addEventListener('message', handleMsg);
    // Preguntar si la extensión está presente
    window.postMessage({ type: 'MQL_CHECK_EXTENSION' }, '*');
    return () => window.removeEventListener('message', handleMsg);
  }, [isOpen]);

  if (!isOpen || !client) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // URL Oficial y Activa de SUNAT Operaciones en Línea (Clave SOL)
  const SUNAT_LOGIN_URL = 'https://api-seguridad.sunat.gob.pe/v1/clientessol/4f3b88b3-d9d6-402a-b85d-6a0bc857746a/oauth2/authen?redirect_uri=https://e-menu.sunat.gob.pe/cl-ti-itmenu/AutenticaMenuInternet.htm&client_id=4f3b88b3-d9d6-402a-b85d-6a0bc857746a&response_type=code';
  const SUNAFIL_URL = 'https://casillaelectronica.sunafil.gob.pe/';

  // Código bookmarklet para auto-rellenar en caso de usar sin extensión
  const bookmarkletCode = `javascript:(function(){
    var ruc = '${client.ruc}';
    var usr = '${client.sunat_usuario}';
    var pwd = '${client.sunat_clave}';
    var btnRuc = document.getElementById('btnPorRuc') || document.querySelector('.btnPorRuc');
    if(btnRuc) { btnRuc.click(); }
    setTimeout(function(){
      var r = document.getElementById('txtRuc') || document.querySelector('input[name="txtRuc"]');
      var u = document.getElementById('txtUsuario') || document.querySelector('input[name="txtUsuario"]');
      var p = document.getElementById('txtContrasena') || document.querySelector('input[name="txtContrasena"]');
      var b = document.getElementById('btnAceptar') || document.querySelector('button[type="submit"]');
      if(r) { r.focus(); r.value = ruc; r.dispatchEvent(new Event('input', {bubbles: true})); r.dispatchEvent(new Event('change', {bubbles: true})); }
      if(u) { u.focus(); u.value = usr; u.dispatchEvent(new Event('input', {bubbles: true})); u.dispatchEvent(new Event('change', {bubbles: true})); }
      if(p) { p.focus(); p.value = pwd; p.dispatchEvent(new Event('input', {bubbles: true})); p.dispatchEvent(new Event('change', {bubbles: true})); }
      if(b) { setTimeout(function(){ b.click(); }, 350); }
    }, 250);
  })();`;

  const handleOpenSunat = () => {
    // 1. Enviar solicitud a la extensión del navegador (canal seguro storage)
    window.postMessage({
      type: 'MQL_AUTOLOGIN_REQUEST',
      ruc: client.ruc,
      usuario: client.sunat_usuario,
      clave: client.sunat_clave
    }, '*');

    // 2. Respaldo en portapapeles
    navigator.clipboard.writeText(`${client.ruc}\t${client.sunat_usuario}\t${client.sunat_clave}`);

    // 3. Respaldo adicional en Hash
    const payload = btoa(JSON.stringify({
      ruc: client.ruc,
      usuario: client.sunat_usuario,
      clave: client.sunat_clave
    }));

    const targetUrl = `${SUNAT_LOGIN_URL}#mql_login=${encodeURIComponent(payload)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenSunafil = () => {
    window.postMessage({
      type: 'MQL_AUTOLOGIN_REQUEST',
      ruc: client.ruc,
      usuario: client.sunat_usuario,
      clave: client.sunat_clave
    }, '*');
    navigator.clipboard.writeText(`${client.ruc}\t${client.sunat_usuario}\t${client.sunat_clave}`);
    window.open(SUNAFIL_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Acceso SUNAT Clave SOL</span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {client.razon_social}
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Tarjeta de Credenciales con Copia Rápida */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Credenciales Clave SOL de este Cliente
            </p>

            {/* RUC */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-400">RUC:</span>
                <span className="font-mono font-bold text-white tracking-wider">{client.ruc}</span>
              </div>
              <button
                onClick={() => handleCopy(client.ruc, 'ruc')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                {copiedField === 'ruc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'ruc' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Usuario SOL */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400">Usuario:</span>
                <span className="font-mono font-bold text-indigo-300">{client.sunat_usuario}</span>
              </div>
              <button
                onClick={() => handleCopy(client.sunat_usuario, 'usuario')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                {copiedField === 'usuario' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'usuario' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Contraseña SOL */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Contraseña:</span>
                <span className="font-mono font-bold text-emerald-300">{client.sunat_clave}</span>
              </div>
              <button
                onClick={() => handleCopy(client.sunat_clave, 'clave')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                {copiedField === 'clave' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'clave' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Botones Principales de Apertura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleOpenSunat}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-98"
            >
              <span>Abrir SUNAT Clave SOL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleOpenSunafil}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-98"
            >
              <span>Abrir Casilla SUNAFIL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Estado de la Extensión AutoLogin */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isExtensionInstalled
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Puzzle className="w-4 h-4" />
                <span>
                  {isExtensionInstalled 
                    ? 'Extensión Agenda MQL Activa (AutoLogin Conectado)' 
                    : 'Extensión no detectada en este navegador'}
                </span>
              </span>
              {!isExtensionInstalled && (
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(!showInstallGuide)}
                  className="text-[11px] underline text-amber-200 hover:text-white"
                >
                  {showInstallGuide ? 'Ocultar pasos' : '¿Cómo activarla?'}
                </button>
              )}
            </div>

            {isExtensionInstalled ? (
              <p className="text-[11px] text-emerald-200/90 mt-1 leading-relaxed">
                ¡Listo! Al hacer clic en "Abrir SUNAT Clave SOL", la extensión rellenará los campos e iniciará sesión automáticamente en 0.3 segundos sin tocar el teclado.
              </p>
            ) : (
              <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                Para que el inicio de sesión sea 100% automático como en Buzon-e, debes cargar la extensión una sola vez en Chrome/Edge.
              </p>
            )}

            {/* Guía desplegable de instalación en 3 pasos */}
            {showInstallGuide && !isExtensionInstalled && (
              <div className="mt-3 pt-3 border-t border-amber-500/30 text-[11px] space-y-1.5 text-slate-200 bg-slate-950/60 p-3 rounded-xl">
                <p className="font-bold text-amber-300">Pasos rápidos para activarla en Chrome o Edge (15 seg):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Abre una pestaña y escribe <code className="text-amber-300 font-mono">chrome://extensions</code></li>
                  <li>Activa la casilla <strong>"Modo de desarrollador"</strong> (arriba a la derecha).</li>
                  <li>Haz clic en <strong>"Cargar descomprimida"</strong> y selecciona la carpeta:
                    <div className="mt-1 p-1.5 bg-slate-900 rounded font-mono text-[10px] text-emerald-400 select-all">
                      D:\jose\Agenda_MQL\extension_autologin_sunat
                    </div>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Alternativa: Script Bookmarklet */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Bookmark className="w-4 h-4" />
              <span>Alternativa sin extensión: Marcador de 1 Clic</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Si estás en otro navegador o celular, puedes usar este script marcador para autocompletar en 1 toque:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  handleCopy(bookmarkletCode, 'bookmarklet');
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                title="Copia el script de autologin"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{copiedField === 'bookmarklet' ? '¡Script Copiado!' : 'Copiar Script Marcador'}</span>
              </a>

              <button
                onClick={() => handleCopy(client.sunat_clave, 'all')}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                {copiedField === 'all' ? '¡Clave copiada!' : 'Copiar Solo Clave'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
