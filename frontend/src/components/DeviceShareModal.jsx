import React, { useState } from 'react';
import { X, Smartphone, Laptop, Copy, Check, Info, Wifi } from 'lucide-react';

export default function DeviceShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHost = window.location.hostname || 'localhost';
  const localUrl = `http://localhost:3100`;
  const networkUrl = currentHost !== 'localhost' 
    ? `http://${currentHost}:3100` 
    : `http://192.168.1.21:3100`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interconexión Multi-dispositivo</h3>
            <p className="text-xs text-slate-400">Prueba en simultáneo en PC y Celular</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Para ver la sincronización automática en vivo al instante, abre la agenda en tu teléfono inteligente o en otra computadora conectada a la misma red Wi-Fi:
        </p>

        {/* Bloque URL de Red Local */}
        <div className="space-y-3 mb-5">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-blue-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Para tu Celular o Laptop (Wi-Fi):</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
              <code className="text-xs font-mono text-emerald-400 select-all">{networkUrl}</code>
              <button
                onClick={() => handleCopy(networkUrl)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Laptop className="w-3.5 h-3.5" />
                <span>En esta misma computadora:</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
              <code className="text-xs font-mono text-slate-300 select-all">{localUrl}</code>
              <button
                onClick={() => handleCopy(localUrl)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tip de sincronización */}
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          <p>
            <strong>Prueba de fuego:</strong> Marca un registro en tu teléfono y observa cómo la pantalla de tu computadora o laptop se actualiza al milisegundo sin recargar la página.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
