import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  EyeOff,
  Building,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import logoImg from '../assets/icon_sin_fondo.png';

export default function LoginView({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Por favor complete los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        await onLoginSuccess({
          isRegister: true,
          userData: {
            username: username.trim(),
            password,
            full_name: fullName.trim() || username.trim(),
            email: email.trim() || null
          }
        });
      } else {
        await onLoginSuccess({
          isRegister: false,
          credentials: {
            username: username.trim(),
            password
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await onLoginSuccess({
        isRegister: false,
        credentials: {
          username: 'mqcontable',
          password: 'Admin2026*'
        }
      });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-slate-700 selection:text-white">
      {/* Luces y degradados decorativos con tonos platino y azul contable */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Tarjeta Principal de Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo y Encabezado de Marca */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner">
              <img
                src={logoImg}
                alt="M|Q Estudio Contable Logo"
                className="w-24 h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] transition hover:scale-105"
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase flex items-center justify-center gap-2">
                <span>M|Q Estudio Contable</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Gestión Tributaria, Clientes RUC y Agenda Multi-dispositivo
              </p>
            </div>

            {/* Selector Pestañas Iniciar Sesión / Registrar */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mt-4">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  !isRegister
                    ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  isRegister
                    ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre Completo / Titular
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. C.P.C. Rocío Baldeón"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Usuario de Acceso
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder={isRegister ? "Tu nombre de usuario único" : "Usuario o correo"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-mono"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="contacto@estudio.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-200 to-slate-100 hover:from-white hover:to-slate-200 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-white/5 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Registrar mi Cuenta' : 'Entrar al Sistema'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Acceso Rápido Cuenta Demo */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition" />
                <span>Ingreso Rápido (Cuenta Oficial MQ Contable)</span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Usuario: <code className="text-slate-400 font-mono">mqcontable</code> • Clave: <code className="text-slate-400 font-mono">Admin2026*</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © {new Date().getFullYear()} M|Q Estudio Contable • Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
