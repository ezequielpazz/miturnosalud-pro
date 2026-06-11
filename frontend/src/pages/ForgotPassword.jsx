import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../lib/api';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-indigo-500 to-violet-500 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%"><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern><rect width="100%" height="100%" fill="url(#g)"/></svg>
        </div>
        <div className="relative z-10 text-center text-white p-12 max-w-lg">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Logo size={64} />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">MiTurno Salud</h1>
          <p className="text-xl font-light text-white/80">Sistema integral de gestion clinica</p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Logo size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">MiTurno Salud</h1>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Email enviado</h2>
              <p className="text-slate-500 mb-8">
                Si el email esta registrado, recibiras un enlace para restablecer tu contrasena. Revisa tu bandeja de entrada y spam.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
              >
                <ArrowLeft size={16} />
                Volver al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Recuperar contrasena</h2>
              <p className="text-slate-400 mb-8">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="input-field pl-11"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  Volver al login
                </Link>
              </div>
            </>
          )}

          <p className="text-center text-slate-400 text-xs mt-8">
            &copy; 2026 MiTurno Salud PRO
          </p>
        </div>
      </div>
    </div>
  );
}
