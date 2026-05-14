import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Shield, Stethoscope, User, Mail, Lock } from 'lucide-react';

const roles = [
  { id: 'admin', label: 'Admin', icon: Shield },
  { id: 'medico', label: 'Medico', icon: Stethoscope },
  { id: 'paciente', label: 'Paciente', icon: User },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [rol, setRol] = useState('admin');
  const [email, setEmail] = useState('admin@miturnosalud.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, rol);
      navigate(`/${user.rol}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesion');
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
            <Heart size={48} />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">MiTurno Salud</h1>
          <p className="text-xl font-light text-white/80 mb-8">Sistema integral de gestion clinica</p>
          <div className="grid grid-cols-2 gap-4 text-left text-sm">
            <div className="bg-white/10 rounded-xl p-4">Gestion de turnos</div>
            <div className="bg-white/10 rounded-xl p-4">Portal medico</div>
            <div className="bg-white/10 rounded-xl p-4">Reportes en tiempo real</div>
            <div className="bg-white/10 rounded-xl p-4">Acceso multidispositivo</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">MiTurno Salud</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Bienvenido</h2>
          <p className="text-slate-400 mb-8">Ingresa tus credenciales para acceder</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Tipo de usuario</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRol(r.id)}
                    className={`border-2 rounded-xl p-3 text-center text-sm transition-all ${
                      rol === r.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <r.icon size={20} className="mx-auto mb-1" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
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
              {loading ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">
            &copy; 2026 MiTurno Salud PRO
          </p>
        </div>
      </div>
    </div>
  );
}
