import React, { useState } from 'react';
import { ExternalLink, Link2, Search, Calendar, Clock, Globe } from 'lucide-react';
import LinkPreviewCard from './LinkPreviewCard';

export default function LinksDirectory({ items, onEdit }) {
  const [search, setSearch] = useState('');

  const linkItems = items.filter((item) => !!item.external_url);

  const filtered = linkItems.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.external_url?.toLowerCase().includes(q) ||
      item.url_label?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            <span>Directorio de Enlaces Rápidos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Todos los accesos directos, salas de videollamada y plataformas vinculadas a tu agenda con previsualización enriquecida.
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar enlaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No hay enlaces registrados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Al crear o editar eventos en tu agenda, ingresa una URL en el campo "Enlace para Redirigir".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-3xl flex flex-col justify-between group transition-all shadow-sm hover:shadow-indigo-500/10"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: `${item.color_tag || '#3B82F6'}22`, color: item.color_tag || '#60A5FA' }}
                  >
                    {item.category || 'General'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.is_completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {item.is_completed ? 'Completada' : 'Pendiente'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {item.event_date}
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {item.event_time}
                  </span>
                </div>
              </div>

              {/* Tarjeta Enriquecida OpenGraph */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <LinkPreviewCard url={item.external_url} label={item.url_label} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
