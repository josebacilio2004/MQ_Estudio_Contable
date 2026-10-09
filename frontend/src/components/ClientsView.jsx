import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  ExternalLink, 
  MessageCircle, 
  Pencil, 
  Trash2, 
  BellRing, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  AlertTriangle,
  Send,
  Phone,
  Bot,
  RefreshCw,
  Loader2
} from 'lucide-react';
import SunatLoginModal from './SunatLoginModal';
import { api } from '../services/api';

export default function ClientsView({
  clients,
  onOpenCreateClient,
  onEditClient,
  onDeleteClient,
  onClearNotification
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'alerts' | 'active'
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedSunatClient, setSelectedSunatClient] = useState(null);
  const [scanningClientId, setScanningClientId] = useState(null);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState(null);

  const handleScanSingleClient = async (client) => {
    if (scanningClientId) return;
    setScanningClientId(client.id);
    setScanStatusMessage(`🤖 Robot del servidor ingresando a SUNAT para ${client.razon_social}...`);
    try {
      const res = await api.scanClient(client.id);
      if (res.success) {
        setScanStatusMessage(`✅ ${client.razon_social}: Se detectaron ${res.data.notificaciones_pendientes} notificaciones.`);
      } else {
        setScanStatusMessage(`⚠️ ${client.razon_social}: ${res.error || 'Revisión finalizada'}`);
      }
    } catch (err) {
      console.error(err);
      setScanStatusMessage(`❌ Error al conectar robot con SUNAT: ${err.message}`);
    } finally {
      setScanningClientId(null);
      setTimeout(() => setScanStatusMessage(null), 6000);
    }
  };

  const handleScanAll = async () => {
    if (isScanningAll) return;
    if (!window.confirm(`¿Deseas iniciar el robot escáner para todos los ${clients.length} clientes? Se procesarán en el servidor.`)) return;
    setIsScanningAll(true);
    setScanStatusMessage('🤖 Robot escaneando buzones SOL en el servidor...');
    try {
      await api.scanAllClients();
      setScanStatusMessage('✅ Escaneo masivo iniciado. Los clientes se actualizarán automáticamente en tiempo real.');
    } catch (err) {
      console.error(err);
      setScanStatusMessage(`❌ Error al iniciar escaneo: ${err.message}`);
    } finally {
      setIsScanningAll(false);
      setTimeout(() => setScanStatusMessage(null), 6000);
    }
  };

  // Alternar visualización de contraseña de un cliente
  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Abrir WhatsApp con mensaje pre-elaborado
  const handleOpenWhatsApp = (client) => {
    if (!client.telefono) {
      alert('Este cliente no tiene un número de teléfono/celular registrado.');
      return;
    }
    const cleanPhone = client.telefono.replace(/\D/g, '');
    let msg = `Hola, nos comunicamos de su estudio contable respecto a su empresa ${client.razon_social} (RUC: ${client.ruc}).`;
    if (client.notificaciones_pendientes > 0) {
      msg += ` Le informamos que tiene ${client.notificaciones_pendientes} notificación(es) pendiente(s) en su buzón de ${client.origen_notificacion || 'SUNAT'}. Por favor comunicarse para coordinar.`;
    }
    const url = `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtrado de clientes
  const filteredClients = clients.filter((c) => {
    if (filterType === 'alerts' && (!c.notificaciones_pendientes || c.notificaciones_pendientes === 0)) return false;
    if (filterType === 'active' && c.estado_contribuyente !== 'ACTIVO') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.ruc?.includes(q) ||
      c.razon_social?.toLowerCase().includes(q) ||
      c.nombre_comercial?.toLowerCase().includes(q) ||
      c.sunat_usuario?.toLowerCase().includes(q)
    );
  });

  const totalClients = clients.length;
  const clientsWithAlerts = clients.filter((c) => (c.notificaciones_pendientes || 0) > 0);
  const activeClients = clients.filter((c) => c.estado_contribuyente === 'ACTIVO').length;

  return (
    <div className="space-y-6">
      {/* 1. Métricas Rápidas de Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Clientes RUC</p>
            <p className="text-xl font-bold text-white tracking-tight">{totalClients}</p>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-sm transition ${
          clientsWithAlerts.length > 0
            ? 'bg-amber-950/20 border-amber-500/40'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className={`p-2.5 rounded-xl ${
            clientsWithAlerts.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Bandejas con Alertas</p>
            <p className={`text-xl font-bold tracking-tight ${
              clientsWithAlerts.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'
            }`}>
              {clientsWithAlerts.length} {clientsWithAlerts.length === 1 ? 'cliente' : 'clientes'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contribuyentes Activos</p>
            <p className="text-xl font-bold text-emerald-400 tracking-tight">{activeClients}</p>
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Nuevo Cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por RUC (11 dígitos), Razón Social o Usuario SOL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Todos ({totalClients})
            </button>
            <button
              onClick={() => setFilterType('alerts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterType === 'alerts'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-900 text-amber-400 border border-slate-800 hover:bg-amber-500/10'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Con Alertas ({clientsWithAlerts.length})</span>
            </button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2">
          {/* Botón Escaneo Masivo Robot */}
          <button
            onClick={handleScanAll}
            disabled={isScanningAll || clients.length === 0}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
            title="Escanear buzones SOL de todos los clientes en el servidor con el robot"
          >
            {isScanningAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span className="hidden sm:inline">Escanear Buzones (Robot)</span>
          </button>

          {/* Botón Registrar Cliente */}
          <button
            onClick={onOpenCreateClient}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Cliente RUC</span>
          </button>
        </div>
      </div>

      {/* Banner de Estado del Robot */}
      {scanStatusMessage && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/40 text-xs text-purple-200 flex items-center justify-between shadow-lg shadow-purple-950/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400 shrink-0 animate-bounce" />
            <span>{scanStatusMessage}</span>
          </div>
          <button
            onClick={() => setScanStatusMessage(null)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 3. Grid de Tarjetas de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No se encontraron clientes</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            No hay clientes registrados con los filtros aplicados.
          </p>
          <button
            onClick={onOpenCreateClient}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primer Cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const hasAlerts = (client.notificaciones_pendientes || 0) > 0;
            const isPasswordVisible = !!visiblePasswords[client.id];

            return (
              <div
                key={client.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                  hasAlerts 
                    ? 'border-amber-500/50 hover:border-amber-400/80 bg-gradient-to-b from-amber-950/10 to-slate-900/90' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Encabezado: RUC y Estado */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-xl">
                      <span className="text-[10px] text-blue-400 font-bold uppercase">RUC</span>
                      <span className="font-mono text-xs font-extrabold text-blue-300 tracking-wider">
                        {client.ruc}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {client.estado_contribuyente || 'ACTIVO'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {client.condicion_domicilio || 'HABIDO'}
                      </span>
                    </div>
                  </div>

                  {/* Razón Social y Nombre Comercial */}
                  <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">
                    {client.razon_social}
                  </h3>
                  {client.nombre_comercial && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {client.nombre_comercial}
                    </p>
                  )}

                  {/* BLOQUE DE ALERTA: BANDEJA SUNAT / SUNAFIL */}
                  {hasAlerts ? (
                    <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>{client.notificaciones_pendientes} Alerta(s) en {client.origen_notificacion || 'Buzón'}</span>
                        </span>
                        <button
                          onClick={() => onClearNotification(client.id)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition"
                          title="Marcar como revisada"
                        >
                          Resolver
                        </button>
                      </div>
                      {client.detalle_notificacion && (
                        <p className="text-[11px] text-amber-200/90 leading-tight">
                          {client.detalle_notificacion}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3.5 py-1.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Buzón al día (Sin alertas pendientes)</span>
                    </div>
                  )}

                  {/* SECCIÓN CREDENCIALES CLAVE SOL */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wide">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Clave SOL</span>
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(client.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isPasswordVisible ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {/* Usuario */}
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="truncate pr-1">
                          <p className="text-[9px] font-sans text-slate-500 uppercase">Usuario</p>
                          <p className="font-bold text-slate-200 truncate">{client.sunat_usuario}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(client.sunat_usuario, `usr-${client.id}`)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Copiar usuario"
                        >
                          {copiedKey === `usr-${client.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Contraseña */}
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="truncate pr-1">
                          <p className="text-[9px] font-sans text-slate-500 uppercase">Clave</p>
                          <p className="font-bold text-slate-200 truncate">
                            {isPasswordVisible ? client.sunat_clave : '••••••••'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(client.sunat_clave, `pwd-${client.id}`)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Copiar clave"
                        >
                          {copiedKey === `pwd-${client.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notas o Teléfono */}
                  {client.telefono && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.telefono}</span>
                      {client.email && <span className="text-slate-600">• {client.email}</span>}
                    </div>
                  )}
                </div>

                {/* 4. ACCIONES RÁPIDAS DEL CLIENTE */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    {/* Botón Escáner Robot SUNAT en Servidor */}
                    <button
                      onClick={() => handleScanSingleClient(client)}
                      disabled={scanningClientId === client.id}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition active:scale-95 shadow-sm ${
                        scanningClientId === client.id
                          ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                          : 'bg-purple-600/15 hover:bg-purple-600/25 border-purple-500/30 text-purple-300 hover:text-white'
                      }`}
                      title="Robot en Servidor: ingresa a SUNAT e inspecciona el Buzón SOL de forma 100% desatendida"
                    >
                      {scanningClientId === client.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          <span className="text-[11px]">Revisando...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[11px]">Escanear</span>
                        </>
                      )}
                    </button>

                    {/* Botón Ingresar a SUNAT Clave SOL Manual / Extensión */}
                    <button
                      onClick={() => setSelectedSunatClient(client)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600/25 to-indigo-600/25 hover:from-blue-600/40 hover:to-indigo-600/40 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition active:scale-95 shadow-sm"
                      title="Ingresar al portal de SUNAT Clave SOL"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[11px]">Portal SUNAT</span>
                    </button>

                    {/* Botón Notificar por WhatsApp */}
                    <button
                      onClick={() => handleOpenWhatsApp(client)}
                      className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition active:scale-95"
                      title="Enviar mensaje rápido por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acciones Editar y Eliminar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClient(client)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Editar cliente"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Acceso SUNAT Clave SOL con AutoLogin */}
      <SunatLoginModal
        isOpen={!!selectedSunatClient}
        onClose={() => setSelectedSunatClient(null)}
        client={selectedSunatClient}
      />
    </div>
  );
}
