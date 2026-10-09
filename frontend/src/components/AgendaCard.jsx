import React from 'react';
import { 
  Check, 
  ExternalLink, 
  Clock, 
  Calendar as CalendarIcon, 
  Trash2, 
  Pencil, 
  Radio
} from 'lucide-react';
import LinkPreviewCard from './LinkPreviewCard';
import { triggerHaptic } from '../utils/haptics';

export default function AgendaCard({ 
  item, 
  isRecentlyUpdated, 
  viewMode = 'list',
  onToggleStatus, 
  onEdit, 
  onDelete 
}) {
  const isCompleted = item.is_completed;

  const handleToggle = () => {
    triggerHaptic(20);
    onToggleStatus(item.id, !isCompleted);
  };

  // Extraer dominio limpio para previsualización si no hay etiqueta personalizada
  const getDomainFromUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return 'Abrir Enlace';
    }
  };

  // 1. Renderizado en Vista de Lista (Horizontal y Compacta)
  if (viewMode === 'list') {
    return (
      <div
        className={`group relative rounded-2xl border transition-all duration-200 p-3 sm:p-3.5 flex flex-col gap-2 ${
          isRecentlyUpdated
            ? 'ring-2 ring-blue-500 bg-blue-950/40 border-blue-500/80 shadow-md scale-[1.005]'
            : isCompleted
            ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Izquierda: Checkbox + Hora + Título + Categoría */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={handleToggle}
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 border ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-transparent hover:border-slate-500'
              }`}
              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
            >
              <Check className={`w-4 h-4 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-50'}`} />
            </button>

            {/* Hora en chip */}
            <div className="flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{item.event_time}</span>
            </div>

            {/* Título y Categoría */}
            <div className="flex-1 min-w-0 truncate">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border border-white/10"
                  style={{ backgroundColor: `${item.color_tag || '#3B82F6'}33`, color: item.color_tag || '#60A5FA' }}
                >
                  {item.category || 'General'}
                </span>
                <h3
                  className={`text-sm font-semibold truncate transition-colors ${
                    isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                  }`}
                  title={item.title}
                >
                  {item.title}
                </h3>
              </div>
              {item.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Derecha: Botón Enlace + Acciones */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {item.external_url && (
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold transition active:scale-95"
              >
                <span className="max-w-[130px] truncate">{item.url_label || getDomainFromUrl(item.external_url)}</span>
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </a>
            )}

            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Editar registro"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Eliminar registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Previsualización Enriquecida OpenGraph si tiene URL y no está completado */}
        {item.external_url && !isCompleted && (
          <div className="pt-1">
            <LinkPreviewCard url={item.external_url} label={item.url_label} />
          </div>
        )}
      </div>
    );
  }

  // 2. Renderizado en Vista de Cuadrícula (Cards)
  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between ${
        isRecentlyUpdated
          ? 'ring-2 ring-blue-500 bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/20 scale-[1.01]'
          : isCompleted
          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Indicador de Actualización Remota Flash */}
      {isRecentlyUpdated && (
        <div className="absolute -top-2.5 right-4 z-10 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md animate-bounce">
          <Radio className="w-3 h-3 animate-spin" />
          <span>¡Actualizado en otro dispositivo!</span>
        </div>
      )}

      <div>
        {/* Cabecera de la Tarjeta: Checkbox, Categoría y Acciones */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Checkbox Táctil Ergonómico */}
            <button
              type="button"
              onClick={handleToggle}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-transparent hover:border-slate-500'
              }`}
              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
            >
              <Check className={`w-4 h-4 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-50'}`} />
            </button>

            {/* Categoría / Etiqueta de Color */}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white/90 border border-white/10"
              style={{ backgroundColor: `${item.color_tag || '#3B82F6'}33`, color: item.color_tag || '#60A5FA' }}
            >
              {item.category || 'General'}
            </span>
          </div>

          {/* Botones de Edición / Eliminación */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Editar registro"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Eliminar registro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Título y Descripción */}
        <div className="mt-3">
          <h3
            className={`text-base font-semibold leading-snug transition-colors ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
            }`}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className={`mt-1 text-xs sm:text-sm line-clamp-2 leading-relaxed ${
              isCompleted ? 'text-slate-500' : 'text-slate-300'
            }`}>
              {item.description}
            </p>
          )}

          {/* Tarjeta Enriquecida OpenGraph (Notion / Slack) */}
          {item.external_url && !isCompleted && (
            <LinkPreviewCard url={item.external_url} label={item.url_label} />
          )}
        </div>
      </div>

      {/* Pie de la Tarjeta: Fecha, Hora y Enlace Externo */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        {/* Metadatos Horarios */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{item.event_date}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{item.event_time}</span>
          </div>
        </div>

        {/* Botón de Enlace para Redirigir a Páginas */}
        {item.external_url ? (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 hover:border-blue-400 text-blue-300 hover:text-white text-xs font-semibold transition active:scale-95 shadow-sm group/link"
          >
            <span>{item.url_label || getDomainFromUrl(item.external_url)}</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        ) : (
          <span className="text-[11px] text-slate-500 italic">Sin enlace asignado</span>
        )}
      </div>
    </div>
  );
}
