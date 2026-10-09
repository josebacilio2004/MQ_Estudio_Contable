import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  ExternalLink, 
  KeyRound, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck,
  Chrome
} from 'lucide-react';

export default function ExportPasswordsModal({ isOpen, onClose, clients = [] }) {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  // Generar CSV oficial compatible con Google Chrome / Android Passwords / Apple Keychain
  const handleDownloadCsv = () => {
    // Formato estándar de Google Passwords: name,url,username,password,note
    const headers = ['name', 'url', 'username', 'password', 'note'];
    const rows = [headers.join(',')];

    clients.forEach((c) => {
      const url = 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm?pestana=*&agrupacion=*';
      const name = `SUNAT Clave SOL - ${c.razon_social} (${c.ruc})`;
      const cleanRuc = (c.ruc || '').trim();
      const cleanUser = (c.sunat_usuario || '').trim();
      const cleanPwd = (c.sunat_clave || '').trim();
      const note = `Agenda MQL - RUC: ${cleanRuc}`;

      // Fila con RUC concatenado con Usuario (como lo pide SUNAT)
      rows.push(`"${name}","${url}","${cleanRuc}${cleanUser}","${cleanPwd}","${note}"`);
      // Fila adicional con Usuario solo
      rows.push(`"${name} (Solo Usuario)","${url}","${cleanUser}","${cleanPwd}","${note}"`);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `sunat_passwords_mql_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  // Bookmarklet universal de 1 toque que inyecta las credenciales
  const masterBookmarklet = `javascript:(function(){
    var ruc = prompt("Ingrese RUC del cliente (o primeros dígitos):", "");
    if(!ruc) return;
    var btnRuc = document.getElementById('btnPorRuc') || document.querySelector('.btnPorRuc');
    if(btnRuc) btnRuc.click();
    setTimeout(function(){
      var r = document.getElementById('txtRuc');
      if(r){ r.value = ruc; r.dispatchEvent(new Event('input',{bubbles:true})); }
    }, 200);
  })();`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Autocompletar en Celular, Tablet y PC</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                Universal
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sincroniza tus {clients.length} clientes con el Administrador de Contraseñas de Google
            </p>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Tarjeta Explicativa */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>¿Cómo funciona el autocompletado en móviles?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Al importar tus credenciales a Google, <strong>el teclado de tu celular Android, tablet o iPhone autocompleta el RUC, Usuario y Clave SOL en 1 toque con tu huella digital</strong> directamente en la pantalla de SUNAT, sin necesidad de instalar extensiones ni copiar manualmente.
            </p>
          </div>

          {/* Paso a paso interactivo */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sigue estos 3 sencillos pasos (toma 20 segundos):</span>
            </p>

            <ol className="text-xs text-slate-300 space-y-3 pl-2">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Descarga el archivo de contraseñas:</p>
                  <button
                    onClick={handleDownloadCsv}
                    className="mt-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition active:scale-98"
                  >
                    {downloaded ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
                    <span>{downloaded ? '¡Archivo CSV Descargado!' : 'Descargar Archivo para Google Passwords (.csv)'}</span>
                  </button>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Abre Google Passwords e impórtalo:</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toca el botón siguiente, haz clic en el ícono de engrane ⚙️ (Ajustes) y selecciona <strong>"Importar contraseñas"</strong>.
                  </p>
                  <a
                    href="https://passwords.google.com/options"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-semibold transition"
                  >
                    <Chrome className="w-3.5 h-3.5 text-blue-400" />
                    <span>Abrir Ajustes de Google Passwords</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">¡Listo para usar en cualquier dispositivo!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Al abrir SUNAT en tu celular o tablet, el teclado te mostrará el botón flotante con el nombre de tu cliente para autocompletar al instante.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Seguridad y Privacidad */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tus credenciales se cifran de extremo a extremo en tu propia cuenta personal de Google/Apple.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
