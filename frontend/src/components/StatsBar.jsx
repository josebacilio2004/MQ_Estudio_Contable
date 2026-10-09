import React from 'react';
import { CheckCircle2, Clock, Link2, ListTodo, Search } from 'lucide-react';

export default function StatsBar({
  items,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) {
  const total = items.length;
  const completed = items.filter(i => i.is_completed).length;
  const pending = total - completed;
  const withLinks = items.filter(i => !!i.external_url).length;

  const categories = ['Todas', ...new Set(items.map(i => i.category || 'General'))];

  return (
    <div className="space-y-4 mb-6">
      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-slate-900/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-white tracking-tight">{total}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Pendientes</p>
            <p className="text-xl font-bold text-amber-400 tracking-tight">{pending}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completadas</p>
            <p className="text-xl font-bold text-emerald-400 tracking-tight">{completed}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Con Enlaces</p>
            <p className="text-xl font-bold text-indigo-400 tracking-tight">{withLinks}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, nota o enlace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Pendientes ({pending})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Completadas ({completed})
          </button>
        </div>
      </div>
    </div>
  );
}
