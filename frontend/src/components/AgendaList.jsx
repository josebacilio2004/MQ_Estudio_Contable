import React, { useState } from 'react';
import AgendaCard from './AgendaCard';
import { CalendarX2, Plus, List, LayoutGrid, Clock } from 'lucide-react';

export default function AgendaList({
  items,
  recentlyUpdatedId,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenCreateModal
}) {
  // Por defecto en Lista ('list'), con posibilidad de alternar a Cuadrícula ('grid')
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('mql_agenda_view_mode') || 'list';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('mql_agenda_view_mode', mode);
    } catch {}
  };

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

  // Agrupamiento organizado por fecha (Día) y ordenado cronológicamente
  const groupedByDate = items.reduce((acc, item) => {
    const date = item.event_date || 'Sin Fecha';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Ordenar días (fechas) y ordenar eventos por hora dentro de cada día
  const sortedDates = Object.keys(groupedByDate).sort();

  sortedDates.forEach((date) => {
    groupedByDate[date].sort((a, b) => {
      const timeA = a.event_time || '00:00';
      const timeB = b.event_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  });

  const formatDateHeader = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (dateStr === today) return '📅 Hoy';
    if (dateStr === tomorrow) return '📅 Mañana';

    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, month - 1, day);
      const dayName = d.toLocaleDateString('es-PE', { weekday: 'long' });
      return `📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day}/${month}/${year}`;
    } catch {
      return `📅 ${dateStr}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles de Vista: Lista vs Cuadrícula */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="font-semibold text-slate-200">{items.length}</span> eventos organizados por día
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
          <button
            onClick={() => handleSetViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ver en formato Lista compacta"
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => handleSetViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ver en formato Cuadrícula de tarjetas"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cuadrícula</span>
          </button>
        </div>
      </div>

      {/* Secciones agrupadas por día */}
      {sortedDates.map((date) => {
        const dateItems = groupedByDate[date];

        return (
          <section key={date} className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/50">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-300 uppercase flex items-center gap-2">
                <span>{formatDateHeader(date)}</span>
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {dateItems.length} {dateItems.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            {viewMode === 'list' ? (
              /* Vista 1: Lista Horizontal Compacta (Por defecto) */
              <div className="flex flex-col space-y-2">
                {dateItems.map((item) => (
                  <AgendaCard
                    key={item.id}
                    item={item}
                    viewMode="list"
                    isRecentlyUpdated={item.id === recentlyUpdatedId}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ) : (
              /* Vista 2: Cuadrícula (Grid) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {dateItems.map((item) => (
                  <AgendaCard
                    key={item.id}
                    item={item}
                    viewMode="grid"
                    isRecentlyUpdated={item.id === recentlyUpdatedId}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
