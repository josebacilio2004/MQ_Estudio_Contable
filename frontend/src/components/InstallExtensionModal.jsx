import React, { useState } from 'react';
import {
  X,
  Download,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FolderArchive,
  Puzzle,
  ExternalLink,
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function InstallExtensionModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('pc'); // 'pc' | 'mobile'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Instalación y Acceso Multi-Dispositivo</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v1.2.0
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Cómo configurar el AutoLogin en PC y cómo funciona la arquitectura en Celulares y Tablets
            </p>
          </div>
        </div>

        {/* Pestañas Selectoras: PC vs Móvil */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5 shrink-0">
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition ${
              activeTab === 'pc'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>En Computadoras (PC / Laptop)</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition ${
              activeTab === 'mobile'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>En Celulares y Tablets (Móvil)</span>
          </button>
        </div>

        {/* Contenido según la pestaña */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {activeTab === 'pc' ? (
            <div className="space-y-4">
              {/* Tarjeta de Descarga Directa */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                    <FolderArchive className="w-4 h-4 text-blue-400" />
                    <span>Paquete de Extensión para Cualquier PC</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Descarga el archivo ZIP listo para instalar en cualquier máquina con Google Chrome, Edge o Brave.
                  </p>
                </div>
                <a
                  href="./extension_autologin_sunat.zip"
                  download="extension_autologin_sunat.zip"
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Extensión (.zip)</span>
                </a>
              </div>

              {/* Pasos de Instalación en 30 Segundos */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cómo instalarla en la PC de un colega o asistente (1 sola vez):</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300">
                  {/* Paso 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Descomprimir el archivo descargado</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Haz clic derecho en <code className="text-blue-300 font-mono">extension_autologin_sunat.zip</code> y elige <strong>"Extraer aquí"</strong> (guarda la carpeta en Documentos o Escritorio).
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Abrir Extensiones de Chrome o Edge</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        En una nueva pestaña escribe: <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">chrome://extensions</code> y activa el interruptor <strong>"Modo de desarrollador"</strong> (esquina superior derecha).
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">Cargar la carpeta</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Haz clic en el botón <strong>"Cargar descomprimida"</strong> (arriba a la izquierda) y selecciona la carpeta descomprimida.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    ¡Listo! Cada vez que cualquier persona en esa PC haga clic en <strong>"Abrir SUNAT"</strong>, el sistema abrirá una ventana aislada y completará RUC, Usuario y Clave SOL en 0.3 segundos sin cruzarse con otras sesiones.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Explicación de Arquitectura Móvil tipo Buzone */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>Arquitectura Móvil Centralizada en la Nube (Estilo Buzone)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Los navegadores móviles (Chrome en Android o Safari en iPhone) <strong>no admiten extensiones de escritorio</strong>. Por esa razón, plataformas como Buzone y nuestra Suite no abren múltiples pestañas en tu celular, sino que operan a través de <strong>servicios en la nube</strong>:
                </p>
              </div>

              {/* Las 3 Vías Móviles en Nuestro Sistema */}
              <div className="space-y-3">
                {/* Vía 1: Bandeja Integrada */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>1. Consulta 100% en la Nube (Recomendada)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Sin Claves en el Móvil
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Al tocar el botón <strong>"Ver Buzón"</strong> de cualquier cliente en tu celular, el sistema consulta directamente los correos y notificaciones extraídos por el robot del servidor. Puedes leer notificaciones del SIRE, CDT y esquelas sin entrar a SUNAT.
                  </p>
                </div>

                {/* Vía 2: Alertas Telegram Push */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Send className="w-4 h-4" />
                      <span>2. Alertas Inmediatas en tu Celular por Telegram</span>
                    </span>
                    <a
                      href="https://t.me/mqestudioscontables1_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-semibold hover:bg-sky-500/30 transition flex items-center gap-1"
                    >
                      <span>Abrir @mqestudioscontables1_bot</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Cuando el robot del servidor detecta que SUNAT emitió un nuevo documento para cualquiera de tus clientes, envía una notificación instantánea a tu Telegram con el RUC, Razón Social y detalle.
                  </p>
                </div>

                {/* Vía 3: Si quieres entrar a SUNAT desde el celular */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>3. Para emitir o declarar en SUNAT desde el Celular</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-2">
                    <p>
                      <strong>Opción A - Copia en 1 Toque:</strong> Al tocar "Abrir SUNAT" desde tu celular, el sistema copia automáticamente RUC, Usuario y Clave con tabulación al portapapeles y abre el portal oficial listo para pegar.
                    </p>
                    <p>
                      <strong>Opción B - Navegador Kiwi Browser (Android):</strong> Si instalas <a href="https://play.google.com/store/apps/details?id=com.kiwibrowser.browser" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Kiwi Browser</a> en tu celular Android, este navegador SÍ soporta extensiones de Chrome. Puedes cargar el archivo <code className="text-amber-300">.zip</code> y disfrutar del AutoLogin automático en el móvil exactamente igual que en PC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>MQ Estudio Contable &bull; Suite Tributaria Integral</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
