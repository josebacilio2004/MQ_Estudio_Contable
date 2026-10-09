import React from 'react';
import AgendaCard from './AgendaCard';
import { CalendarX2, Plus } from 'lucide-react';

export default function AgendaList({
  items,
  recentlyUpdatedId,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenCreateModal
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center mb-4">
          <CalendarX2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No hay registros para mostrar</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
          No se encontraron eventos en la agenda con los filtros actuales o la lista está vacía.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Primer Registro</span>
        </button>
      </div>
    );
  }

  // Agrupamiento por fecha
  const groupedByDate = items.reduce((acc, item) => {
    const date = item.event_date || 'Sin Fecha';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const formatDateHeader = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (dateStr === today) return '📅 Hoy';
    if (dateStr === tomorrow) return '📅 Mañana';
    return `📅 ${dateStr}`;
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedByDate).map(([date, dateItems]) => (
        <section key={date} className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-800/60">
            <h2 className="text-sm font-bold tracking-tight text-slate-300 uppercase">
              {formatDateHeader(date)}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {dateItems.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dateItems.map((item) => (
              <AgendaCard
                key={item.id}
                item={item}
                isRecentlyUpdated={item.id === recentlyUpdatedId}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
