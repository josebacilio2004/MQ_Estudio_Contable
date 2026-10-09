import React, { useState, useEffect } from 'react';
import { X, Link2, Calendar, Clock, Tag, Type, AlignLeft } from 'lucide-react';

const CATEGORIES = [
  { name: 'Reunión', color: '#8B5CF6' },
  { name: 'Trabajo', color: '#3B82F6' },
  { name: 'Personal', color: '#EC4899' },
  { name: 'Urgente', color: '#EF4444' },
  { name: 'Documentación', color: '#10B981' },
];

export default function AgendaModal({ isOpen, onClose, onSave, editingItem }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [category, setCategory] = useState('Reunión');
  const [colorTag, setColorTag] = useState('#8B5CF6');
  const [externalUrl, setExternalUrl] = useState('');
  const [urlLabel, setUrlLabel] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setDescription(editingItem.description || '');
      setEventDate(editingItem.event_date || '');
      setEventTime(editingItem.event_time || '');
      setCategory(editingItem.category || 'Reunión');
      setColorTag(editingItem.color_tag || '#8B5CF6');
      setExternalUrl(editingItem.external_url || '');
      setUrlLabel(editingItem.url_label || '');
    } else {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      setTitle('');
      setDescription('');
      setEventDate(dateStr);
      setEventTime(`${hours}:${minutes}`);
      setCategory('Reunión');
      setColorTag('#8B5CF6');
      setExternalUrl('');
      setUrlLabel('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate || !eventTime) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      event_date: eventDate,
      event_time: eventTime,
      category,
      color_tag: colorTag,
      external_url: externalUrl.trim() || null,
      url_label: urlLabel.trim() || null,
    });
  };

  const handleCategoryChange = (catName) => {
    const found = CATEGORIES.find(c => c.name === catName);
    setCategory(catName);
    if (found) setColorTag(found.color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>{editingItem ? 'Editar Registro de Agenda' : 'Nuevo Registro de Agenda'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <span>Título del Evento *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Reunión con cliente, Revisión de métricas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Fecha y Hora en Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Fecha *</span>
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Hora *</span>
              </label>
              <input
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Categoría</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    category === cat.name
                      ? 'border-transparent text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    backgroundColor: category === cat.name ? cat.color : undefined,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sección de Enlace Externo */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Enlace para Redirigir a Páginas
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">URL de destino (Web / Meet / Dashboard)</label>
              <input
                type="url"
                placeholder="https://meet.google.com/xyz o https://midominio.com"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Texto o etiqueta del enlace (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Sala de Google Meet, Ver Cotización en Web..."
                value={urlLabel}
                onChange={(e) => setUrlLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Descripción / Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Notas o Descripción</span>
            </label>
            <textarea
              rows={3}
              placeholder="Detalles adicionales, puntos a tratar o instrucciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              {editingItem ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
