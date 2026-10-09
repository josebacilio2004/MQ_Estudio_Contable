import React from 'react';
import { 
  Calendar, 
  Kanban, 
  Link2, 
  Smartphone, 
  Menu, 
  X, 
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  BellRing
} from 'lucide-react';

export default function SidebarMenu({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onOpenShareModal,
  connectedCount,
  itemsCount = { total: 0, pending: 0, completed: 0, links: 0 },
  clientsCount = { total: 0, alerts: 0 }
}) {
  const menuItems = [
    {
      id: 'agenda',
      label: 'Vista Agenda',
      icon: Calendar,
      badge: itemsCount.total,
      description: 'Cronología por fechas'
    },
    {
      id: 'kanban',
      label: 'Tablero Kanban',
      icon: Kanban,
      badge: itemsCount.pending,
      description: 'Arrastrar y soltar columnas'
    },
    {
      id: 'clients',
      label: 'Gestión Clientes RUC',
      icon: Building2,
      badge: clientsCount.total,
      alerts: clientsCount.alerts,
      description: 'Clave SOL, Buzón SUNAT y SUNAFIL'
    },
    {
      id: 'links',
      label: 'Directorio Enlaces',
      icon: Link2,
      badge: itemsCount.links,
      description: 'Accesos directos web'
    }
  ];

  return (
    <>
      {/* Drawer Overlay para Móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Menú Lateral (Desktop & Drawer Móvil) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Cabecera del Menú */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  Agenda <span className="text-blue-400">MQL</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {connectedCount} disp. en vivo
                  </span>
                </div>
              </div>
            </div>

            {/* Cerrar en móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navegación Principal */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Vistas del Sistema
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-900/90 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                    <div className="text-left">
                      <p className="leading-none">{item.label}</p>
                      <p className={`text-[10px] mt-1 font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Acceso Rápido de Sincronización Móvil */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Multi-Dispositivo
            </p>
            <button
              onClick={() => {
                onOpenShareModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold transition hover:border-slate-700"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <p>Vincular Celular / Red</p>
                <p className="text-[10px] text-slate-400 font-normal">Abrir vía Wi-Fi local</p>
              </div>
            </button>
          </div>
        </div>

        {/* Resumen Rápido en Footer del Menú */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sincronización</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Activa</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950/70">
              <p className="text-slate-400">Pendientes</p>
              <p className="text-sm font-bold text-amber-400">{itemsCount.pending}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70">
              <p className="text-slate-400">Listas</p>
              <p className="text-sm font-bold text-emerald-400">{itemsCount.completed}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Barra de Navegación Inferior (Mobile Bottom Navigation Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => setCurrentView('agenda')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            currentView === 'agenda' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          onClick={() => setCurrentView('kanban')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            currentView === 'kanban' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span className="text-[10px]">Kanban</span>
        </button>

        <button
          onClick={() => setCurrentView('clients')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition relative ${
            currentView === 'clients' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Building2 className="w-4 h-4" />
            {clientsCount.alerts > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
            )}
          </div>
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setCurrentView('links')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition ${
            currentView === 'links' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span className="text-[10px]">Enlaces</span>
        </button>

        <button
          onClick={onOpenShareModal}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px]">Celular</span>
        </button>
      </nav>
    </>
  );
}
