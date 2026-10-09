import React, { useState } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Clock, 
  Calendar as CalendarIcon, 
  Radio, 
  Pencil, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  GripVertical
} from 'lucide-react';

const COLUMNS = [
  {
    id: 'todo',
    title: 'Por Hacer',
    color: 'border-slate-700 bg-slate-900/60',
    badgeColor: 'bg-slate-800 text-slate-300',
    accent: 'bg-blue-500'
  },
  {
    id: 'in_progress',
    title: 'En Progreso',
    color: 'border-amber-500/30 bg-amber-950/10',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    accent: 'bg-amber-500'
  },
  {
    id: 'done',
    title: 'Completado',
    color: 'border-emerald-500/30 bg-emerald-950/10',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    accent: 'bg-emerald-500'
  }
];

export default function KanbanBoard({
  items,
  recentlyUpdatedId,
  onMoveKanban,
  onEdit,
  onDelete,
  onOpenCreateModal
}) {
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Drag and Drop Handlers
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (columnId) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (itemId) {
      onMoveKanban(itemId, columnId);
    }
    setDraggedItemId(null);
  };

  const getDomainFromUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return 'Abrir';
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera del Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Tablero Kanban</h2>
          <p className="text-xs text-slate-400">
            Arrastra los recuadros entre columnas o usa los botones rápidos para cambiar de estado al instante.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Tarjeta</span>
        </button>
      </div>

      {/* Grid de Columnas Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-start">
        {COLUMNS.map((column) => {
          // Filtrar items según columna (tomando fallback de is_completed si no tiene kanban_status)
          const columnItems = items.filter((item) => {
            const status = item.kanban_status || (item.is_completed ? 'done' : 'todo');
            return status === column.id;
          });

          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => handleDragLeave(column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`rounded-3xl border transition-all duration-200 p-4 min-h-[500px] flex flex-col ${column.color} ${
                isOver ? 'ring-2 ring-blue-500 bg-blue-950/30 scale-[1.01]' : ''
              }`}
            >
              {/* Cabecera de Columna */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${column.accent}`}></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {column.title}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${column.badgeColor}`}>
                  {columnItems.length}
                </span>
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="space-y-3 flex-1">
                {columnItems.map((item) => {
                  const isRecentlyUpdated = item.id === recentlyUpdatedId;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className={`group relative rounded-2xl border p-3.5 bg-slate-900 border-slate-800/90 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-700 transition-all ${
                        isRecentlyUpdated
                          ? 'ring-2 ring-blue-500 bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/20'
                          : ''
                      }`}
                    >
                      {/* Badge remoto si se actualizó en otro dispositivo */}
                      {isRecentlyUpdated && (
                        <div className="absolute -top-2 right-3 z-10 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
                          <Radio className="w-2.5 h-2.5 animate-spin" />
                          <span>¡Movido en otro dispositivo!</span>
                        </div>
                      )}

                      {/* Header de tarjeta */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                            style={{ backgroundColor: `${item.color_tag || '#3B82F6'}22`, color: item.color_tag || '#60A5FA' }}
                          >
                            {item.category || 'General'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Título y Descripción */}
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug mb-1">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {item.description}
                        </p>
                      )}

                      {/* Horario y Fecha */}
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mb-3 pt-2 border-t border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-500" />
                          {item.event_date}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {item.event_time}
                        </span>
                      </div>

                      {/* Enlace Externo (Si existe) */}
                      {item.external_url && (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full mb-3 inline-flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition"
                        >
                          <span className="truncate">{item.url_label || getDomainFromUrl(item.external_url)}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-blue-400" />
                        </a>
                      )}

                      {/* Botones de Desplazamiento Rápido (Ideales para Móvil o Touch) */}
                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/60">
                        {column.id === 'todo' && (
                          <button
                            onClick={() => onMoveKanban(item.id, 'in_progress')}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-semibold border border-amber-500/30 transition active:scale-95"
                          >
                            <span>➔ Progreso</span>
                          </button>
                        )}

                        {column.id === 'in_progress' && (
                          <>
                            <button
                              onClick={() => onMoveKanban(item.id, 'todo')}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition active:scale-95"
                            >
                              Por Hacer
                            </button>
                            <button
                              onClick={() => onMoveKanban(item.id, 'done')}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 transition active:scale-95"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Listo</span>
                            </button>
                          </>
                        )}

                        {column.id === 'done' && (
                          <button
                            onClick={() => onMoveKanban(item.id, 'todo')}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition active:scale-95"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reabrir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {columnItems.length === 0 && (
                  <div className="h-32 border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-xs text-slate-500">
                    <p>Arrastra aquí una tarjeta</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
