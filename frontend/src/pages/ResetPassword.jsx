import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../lib/api';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al restablecer la contrasena');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Enlace invalido</h2>
          <p className="text-slate-500 mb-8">
            El enlace de restablecimiento no es valido. Solicita uno nuevo.
          </p>
          <Link
            to="/forgot-password"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

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

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Contrasena restablecida</h2>
              <p className="text-slate-500 mb-8">
                Tu contrasena fue actualizada exitosamente. Ya podes iniciar sesion.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
              >
                <ArrowLeft size={16} />
                Ir al login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Nueva contrasena</h2>
              <p className="text-slate-400 mb-8">
                Ingresa tu nueva contrasena. Debe tener al menos 8 caracteres, una mayuscula y un numero.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Nueva contrasena</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="input-field pl-11"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Confirmar contrasena</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="input-field pl-11"
                      required
                      minLength={8}
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
                  {loading ? 'Restableciendo...' : 'Restablecer contrasena'}
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
