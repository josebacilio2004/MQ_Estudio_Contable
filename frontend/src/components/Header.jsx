import React from 'react';
import { 
  Calendar, 
  Plus, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Laptop, 
  QrCode, 
  Menu,
  LogOut,
  UserCheck
} from 'lucide-react';
import { getDeviceId } from '../services/socket';
import logoImg from '../assets/icon_sin_fondo.png';

export default function Header({ 
  isConnected, 
  connectedCount, 
  onOpenCreateModal, 
  onOpenShareModal,
  onOpenMobileMenu,
  user,
  onLogout
}) {
  const deviceId = getDeviceId();
  const isMobile = deviceId.startsWith('phone');

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all">
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

          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center p-1 shadow-md shadow-black/40">
            <img 
              src={logoImg} 
              alt="M|Q Estudio Contable" 
              className="w-8 h-8 object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 uppercase font-sans">
                <span className="text-white font-extrabold">M|Q</span> 
                <span className="text-slate-300 font-medium hidden xs:inline">Estudio Contable</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                En Línea
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Gestión Tributaria & Control de Buzones SUNAT
            </p>
          </div>
        </div>

        {/* Indicadores de Estado y Acciones */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
                <span className="font-bold font-mono">({connectedCount})</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>Reconectando</span>
              </>
            )}
          </div>

          {/* Botón Vincular Celular / QR */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-medium transition active:scale-95 shadow-sm"
            title="Abrir en celular o laptop simultáneamente"
          >
            <QrCode className="w-4 h-4 text-slate-300" />
            <span className="hidden md:inline text-[11px]">Conectar Móvil</span>
          </button>

          {/* Botón Agregar Registro */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-slate-200 to-slate-100 hover:from-white hover:to-slate-200 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-white/5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>

          {/* Perfil de Usuario y Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800/80">
              <div className="hidden lg:block text-right text-xs">
                <p className="font-bold text-slate-200 truncate max-w-[130px]">
                  {user.full_name || user.username}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  @{user.username}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/60 transition"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
