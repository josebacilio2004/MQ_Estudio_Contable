import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  KeyRound, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  BellRing,
  HelpCircle
} from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, editingClient }) {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sunatUsuario, setSunatUsuario] = useState('');
  const [sunatClave, setSunatClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [estadoContribuyente, setEstadoContribuyente] = useState('ACTIVO');
  const [condicionDomicilio, setCondicionDomicilio] = useState('HABIDO');
  const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);
  const [origenNotificacion, setOrigenNotificacion] = useState('');
  const [detalleNotificacion, setDetalleNotificacion] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingClient) {
      setRuc(editingClient.ruc || '');
      setRazonSocial(editingClient.razon_social || '');
      setNombreComercial(editingClient.nombre_comercial || '');
      setTelefono(editingClient.telefono || '');
      setEmail(editingClient.email || '');
      setSunatUsuario(editingClient.sunat_usuario || '');
      setSunatClave(editingClient.sunat_clave || '');
      setEstadoContribuyente(editingClient.estado_contribuyente || 'ACTIVO');
      setCondicionDomicilio(editingClient.condicion_domicilio || 'HABIDO');
      setNotificacionesPendientes(editingClient.notificaciones_pendientes || 0);
      setOrigenNotificacion(editingClient.origen_notificacion || '');
      setDetalleNotificacion(editingClient.detalle_notificacion || '');
      setNotas(editingClient.notas || '');
    } else {
      setRuc('');
      setRazonSocial('');
      setNombreComercial('');
      setTelefono('');
      setEmail('');
      setSunatUsuario('');
      setSunatClave('');
      setEstadoContribuyente('ACTIVO');
      setCondicionDomicilio('HABIDO');
      setNotificacionesPendientes(0);
      setOrigenNotificacion('');
      setDetalleNotificacion('');
      setNotas('');
    }
    setError('');
    setShowPassword(false);
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanRuc = ruc.trim();
    if (!/^\d{11}$/.test(cleanRuc)) {
      setError('El RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }

    if (!razonSocial.trim()) {
      setError('La Razón Social es obligatoria.');
      return;
    }

    if (!sunatUsuario.trim() || !sunatClave.trim()) {
      setError('El Usuario y la Clave SOL de SUNAT son obligatorios.');
      return;
    }

    onSave({
      ruc: cleanRuc,
      razon_social: razonSocial.trim(),
      nombre_comercial: nombreComercial.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      sunat_usuario: sunatUsuario.trim(),
      sunat_clave: sunatClave.trim(),
      estado_contribuyente: estadoContribuyente,
      condicion_domicilio: condicionDomicilio,
      notificaciones_pendientes: parseInt(notificacionesPendientes || 0, 10),
      origen_notificacion: origenNotificacion || null,
      detalle_notificacion: detalleNotificacion.trim() || null,
      notas: notas.trim() || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>{editingClient ? 'Editar Cliente RUC' : 'Registrar Nuevo Cliente'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Fila 1: RUC y Razón Social */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>RUC (11 dígitos) *</span>
              </label>
              <input
                type="text"
                maxLength={11}
                required
                placeholder="20601234567"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                className="w-full font-mono bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Razón Social *
              </label>
              <input
                type="text"
                required
                placeholder="EMPRESA COMERCIAL S.A.C."
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Fila 2: Nombre comercial, Teléfono y Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Comercial
              </label>
              <input
                type="text"
                placeholder="Nombre de fantasía"
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Celular / WhatsApp</span>
              </label>
              <input
                type="text"
                placeholder="987654321"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Correo Electrónico</span>
              </label>
              <input
                type="email"
                placeholder="cliente@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* SECCIÓN DESTACADA: CREDENCIALES PORTAL SUNAT CLAVE SOL */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Credenciales del Portal SUNAT (Clave SOL)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Usuario SOL *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="MODDATOS / USUARIO2"
                  value={sunatUsuario}
                  onChange={(e) => setSunatUsuario(e.target.value.toUpperCase())}
                  className="w-full font-mono bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Contraseña Clave SOL *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={sunatClave}
                    onChange={(e) => setSunatClave(e.target.value)}
                    className="w-full font-mono bg-slate-900 border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Estas credenciales se utilizarán para la apertura instantánea y autocompletado en el portal oficial de SUNAT.
            </p>
          </div>

          {/* SECCIÓN NOTIFICACIONES DE BANDEJA (SUNAT / SUNAFIL) */}
          <div className="p-4 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Alertas de Bandejas (SUNAT / SUNAFIL / Otros)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notificaciones Pendientes en Buzón
                </label>
                <select
                  value={notificacionesPendientes}
                  onChange={(e) => setNotificacionesPendientes(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value={0}>0 (Sin notificaciones pendientes)</option>
                  <option value={1}>1 Notificación por revisar</option>
                  <option value={2}>2 Notificaciones por revisar</option>
                  <option value={3}>3 o más Notificaciones pendientes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Entidad Emisora
                </label>
                <select
                  value={origenNotificacion}
                  onChange={(e) => setOrigenNotificacion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Seleccionar entidad...</option>
                  <option value="SUNAT">SUNAT (Buzón Electrónico SOL)</option>
                  <option value="SUNAFIL">SUNAFIL (Casilla Electrónica)</option>
                  <option value="MUNICIPALIDAD">Municipalidad (SAT / Fiscalización)</option>
                  <option value="OTRO">Otra Entidad Fiscalizadora</option>
                </select>
              </div>
            </div>

            {notificacionesPendientes > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Asunto / Detalle de la Notificación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Requerimiento de información sobre registro de compras / Resolución..."
                  value={detalleNotificacion}
                  onChange={(e) => setDetalleNotificacion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Notas y Régimen Tributario</span>
            </label>
            <textarea
              rows={2}
              placeholder="Régimen Mype Tributario, vencimiento PDT día 14, observaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Botones de Acción */}
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
              {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
