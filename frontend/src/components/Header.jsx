import React from 'react';
import { Calendar, Plus, Wifi, WifiOff, Smartphone, Laptop, QrCode, Menu } from 'lucide-react';
import { getDeviceId } from '../services/socket';

export default function Header({ 
  isConnected, 
  connectedCount, 
  onOpenCreateModal, 
  onOpenShareModal,
  onOpenMobileMenu
}) {
  const deviceId = getDeviceId();
  const isMobile = deviceId.startsWith('phone');

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Hamburguesa Móvil + Logo y Nombre */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 md:hidden"
            aria-label="Abrir Menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Agenda <span className="text-blue-400">MQL</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Tiempo Real
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Sincronización multi-dispositivo instantánea
            </p>
          </div>
        </div>

        {/* Indicadores de Estado y Acciones */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge de Sincronización en Vivo */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title={isConnected ? 'Conectado al servidor de sincronización' : 'Desconectado, reconectando...'}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">En vivo</span>
                <span className="font-bold">({connectedCount} {connectedCount === 1 ? 'dispositivo' : 'dispositivos'})</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>Reconectando</span>
              </>
            )}
          </div>

          {/* Tipo de Dispositivo Actual */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            {isMobile ? <Smartphone className="w-3.5 h-3.5 text-blue-400" /> : <Laptop className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="font-mono text-[11px] text-slate-400">{deviceId}</span>
          </div>

          {/* Botón Vincular Celular / IP */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-medium transition active:scale-95 shadow-sm"
            title="Abrir en celular o laptop simultáneamente"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Conectar Celular</span>
          </button>

          {/* Botón Agregar Registro */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition active:scale-95 shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
