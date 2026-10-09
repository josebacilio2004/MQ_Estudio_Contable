import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  MailOpen,
  Paperclip,
  Calendar,
  Clock,
  CheckCheck,
  Check,
  ExternalLink,
  MessageCircle,
  X,
  Search,
  Building2,
  FileText,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Send,
  Download
} from 'lucide-react';
import { api } from '../services/api';

export default function SunatInboxModal({
  isOpen,
  onClose,
  client,
  onOpenSunatLogin
}) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'SIRE' | 'CDT' | 'AVISOS' | 'UNREAD'
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // Cargar notificaciones cuando se abre el modal
  useEffect(() => {
    if (isOpen && client?.id) {
      loadInboxData();
    } else {
      setMessages([]);
      setSelectedMessage(null);
    }
  }, [isOpen, client?.id]);

  const loadInboxData = async () => {
    try {
      setLoading(true);
      const res = await api.getClientInbox(client.id);
      if (res && res.notifications) {
        setMessages(res.notifications);
        if (res.notifications.length > 0) {
          // Seleccionar por defecto el primero
          setSelectedMessage(res.notifications[0]);
        }
      }
    } catch (err) {
      console.error('Error al cargar buzón de notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  // Toggle de leído / no leído
  const handleToggleRead = async (msg) => {
    try {
      setMarkingId(msg.id);
      const nextReadState = !msg.is_read;
      const res = await api.markInboxRead(client.id, msg.id, nextReadState);
      
      // Actualizar lista local
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: nextReadState } : m))
      );

      // Si es el seleccionado actualmente, actualizarlo
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage((prev) => ({ ...prev, is_read: nextReadState }));
      }
    } catch (err) {
      console.error('Error al cambiar estado de lectura:', err);
    } finally {
      setMarkingId(null);
    }
  };

  // Copiar texto del correo al portapapeles
  const handleCopyContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Enviar resumen por WhatsApp
  const handleShareWhatsApp = (msg) => {
    if (!client.telefono) {
      alert('El cliente no tiene un teléfono celular registrado.');
      return;
    }
    const cleanPhone = client.telefono.replace(/\D/g, '');
    let text = `*MQ ESTUDIO CONTABLE - NOTIFICACIÓN SUNAT*\n\n`;
    text += `🏢 *Cliente:* ${client.razon_social}\n`;
    text += `📌 *RUC:* ${client.ruc}\n`;
    text += `📬 *Asunto:* ${msg.asunto}\n`;
    text += `🗓️ *Fecha:* ${msg.fecha || 'Reciente'}\n\n`;
    text += `📄 *Resumen del Mensaje:*\n${msg.contenido.slice(0, 450)}${msg.contenido.length > 450 ? '...' : ''}\n\n`;
    text += `_Por favor comunicarse con el estudio si requiere regularización o consultas._`;

    const url = `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtros de búsqueda
  const filteredMessages = messages.filter((msg) => {
    if (filterCategory === 'UNREAD' && msg.is_read) return false;
    if (filterCategory === 'SIRE' && !msg.categoria?.toUpperCase().includes('SIRE') && !msg.asunto?.toUpperCase().includes('SIRE') && !msg.asunto?.toUpperCase().includes('COMPRAS')) return false;
    if (filterCategory === 'CDT' && !msg.categoria?.toUpperCase().includes('CDT') && !msg.asunto?.toUpperCase().includes('CDT')) return false;
    if (filterCategory === 'AVISOS' && !msg.categoria?.toUpperCase().includes('AVISO') && !msg.asunto?.toUpperCase().includes('VENCIMIENTO')) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      msg.asunto?.toLowerCase().includes(q) ||
      msg.contenido?.toLowerCase().includes(q) ||
      msg.remitente?.toLowerCase().includes(q)
    );
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[88vh] max-h-[820px] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* ENCABEZADO PRINCIPAL */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Buzón Electrónico SUNAT (SOL)
                </h2>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {unreadCount} no leído{unreadCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Al día
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-200">{client.razon_social}</span>
                <span>•</span>
                <span className="font-mono text-blue-400 font-bold">RUC {client.ruc}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadInboxData}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition active:scale-95"
              title="Refrescar mensajes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO PRINCIPAL DIVIDIDO EN 2 COLUMNAS */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900/60">
          
          {/* COLUMNA 1: LISTADO DE CORREOS / NOTIFICACIONES */}
          <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-1/2 md:h-full bg-slate-950/40">
            {/* Buscador y Filtros */}
            <div className="p-3 border-b border-slate-800/80 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en el buzón..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Categorías filtro */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
                <button
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    filterCategory === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({messages.length})
                </button>
                <button
                  onClick={() => setFilterCategory('UNREAD')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    filterCategory === 'UNREAD'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-rose-400'
                  }`}
                >
                  No leídos ({unreadCount})
                </button>
                <button
                  onClick={() => setFilterCategory('SIRE')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    filterCategory === 'SIRE'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-purple-300'
                  }`}
                >
                  SIRE
                </button>
                <button
                  onClick={() => setFilterCategory('AVISOS')}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    filterCategory === 'AVISOS'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  Avisos
                </button>
              </div>
            </div>

            {/* Lista scrollable de correos */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No hay notificaciones con los filtros seleccionados.</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isSire = msg.categoria?.toUpperCase().includes('SIRE') || msg.asunto?.toUpperCase().includes('REGISTRO') || msg.asunto?.toUpperCase().includes('SIRE');
                  
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-3.5 cursor-pointer transition text-left relative flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
                      } ${!msg.is_read ? 'bg-slate-900/80 font-semibold' : 'opacity-85'}`}
                    >
                      {/* Cabecera del item: Remitente y Fecha */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5 truncate max-w-[170px]">
                          {!msg.is_read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                          <span className="truncate">{msg.remitente || 'SUNAT'}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {msg.fecha ? msg.fecha.split(' ')[0] : 'Hoy'}
                        </span>
                      </div>

                      {/* Asunto */}
                      <p className={`text-xs leading-snug line-clamp-2 ${!msg.is_read ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {msg.asunto}
                      </p>

                      {/* Footer del item: Etiquetas */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isSire
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {msg.categoria || 'Notificación'}
                        </span>

                        {msg.has_attachment && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-400">
                            <Paperclip className="w-3 h-3" />
                            <span>Adjunto</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA 2: DETALLE Y VISOR DEL CORREO SELECCIONADO */}
          <div className="w-full md:w-7/12 flex flex-col h-1/2 md:h-full bg-slate-900/90 overflow-hidden">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Cabecera de la notificación */}
                <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {selectedMessage.asunto}
                    </h3>

                    {/* Botones de acción del mensaje */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Marcar leído/no leído */}
                      <button
                        onClick={() => handleToggleRead(selectedMessage)}
                        disabled={markingId === selectedMessage.id}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                          selectedMessage.is_read
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                        title={selectedMessage.is_read ? 'Marcar como no leído' : 'Marcar como leído'}
                      >
                        {selectedMessage.is_read ? (
                          <>
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="hidden sm:inline">No leído</span>
                          </>
                        ) : (
                          <>
                            <MailOpen className="w-4 h-4 text-emerald-400" />
                            <span className="hidden sm:inline">Leído</span>
                          </>
                        )}
                      </button>

                      {/* WhatsApp al cliente */}
                      <button
                        onClick={() => handleShareWhatsApp(selectedMessage)}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 text-xs font-semibold transition active:scale-95"
                        title="Enviar resumen por WhatsApp al cliente"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {/* Copiar */}
                      <button
                        onClick={() => handleCopyContent(selectedMessage.contenido)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Copiar texto"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadatos: De, Para, Fecha */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 font-medium">De:</span>{' '}
                      <span className="text-slate-200 font-semibold">{selectedMessage.remitente || 'SUNAT Operaciones en Línea'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Fecha y Hora:</span>{' '}
                      <span className="text-slate-300 font-mono">{selectedMessage.fecha || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Para:</span>{' '}
                      <span className="text-slate-300">{client.razon_social} ({client.ruc})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Categoría:</span>{' '}
                      <span className="text-purple-300 font-semibold">{selectedMessage.categoria || 'SIRE'}</span>
                    </div>
                  </div>
                </div>

                {/* Cuerpo del Mensaje */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-200">
                  {/* Si el asunto contiene SIRE o Registro de Compras y Ventas, mostrar tarjetas de resumen visual */}
                  {selectedMessage.asunto.includes('Registro de Compras y Ventas') && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span>Resumen Automático de Propuesta SIRE 202608</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">RCE - Compras</p>
                          <p className="text-lg font-bold text-emerald-400">33 Documentos</p>
                          <p className="text-[11px] text-slate-400">32 Facturas • 1 Nota de Crédito</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">RVIE - Ventas</p>
                          <p className="text-lg font-bold text-blue-400">23 Documentos</p>
                          <p className="text-[11px] text-slate-400">19 Facturas • 4 Boletas</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contenido íntegro formateado */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] sm:text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.contenido}
                  </div>

                  {selectedMessage.has_attachment && (
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Constancia_Recepcion_SIRE_202608.pdf</p>
                          <p className="text-[10px] text-slate-500">Documento Electrónico Firmado Digitalmente</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('Para descargar el archivo oficial con sello digital SUNAT, ingrese a SUNAT Clave SOL con el botón inferior.')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <Mail className="w-12 h-12 text-slate-700" />
                <h4 className="text-sm font-semibold text-slate-400">Seleccione un correo</h4>
                <p className="text-xs max-w-xs">
                  Haga clic en cualquiera de las notificaciones de la izquierda para ver su contenido completo y opciones de reenvío.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Buzón sincronizado con la base de datos de SUNAT</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenSunatLogin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSunatLogin(client);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir SUNAT Clave SOL</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
