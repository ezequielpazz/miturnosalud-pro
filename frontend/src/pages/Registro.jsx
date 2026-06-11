import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registroPaciente } from '../lib/api';
import { User, Mail, Lock, CreditCard, Phone, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await registroPaciente({
        nombre: form.nombre,
        email: form.email,
        dni: form.dni,
        telefono: form.telefono,
        password: form.password,
      });
      setSuccess(res.data.message || 'Cuenta creada exitosamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 409) {
        setError(detail || 'Ya existe una cuenta con esos datos');
      } else {
        setError(detail || 'Error al crear la cuenta');
      }
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
          <p className="text-xl font-light text-white/80 mb-8">Sistema integral de gestion clinica</p>
          <div className="grid grid-cols-2 gap-4 text-left text-sm">
            <div className="bg-white/10 rounded-xl p-4">Solicita turnos online</div>
            <div className="bg-white/10 rounded-xl p-4">Consulta tu historial</div>
            <div className="bg-white/10 rounded-xl p-4">Acceso desde cualquier dispositivo</div>
            <div className="bg-white/10 rounded-xl p-4">Notificaciones y recordatorios</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <Logo size={64} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">MiTurno Salud</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Crear cuenta</h2>
          <p className="text-slate-400 mb-8">Registrate para solicitar turnos online</p>

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm p-4 rounded-xl border border-green-200 dark:border-green-800 mb-5 flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Nombre completo *</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Juan Perez"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">DNI *</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="12345678"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Telefono</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="11-1234-5678"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Contrasena *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimo 6 caracteres"
                  className="input-field pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Confirmar contrasena *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeti tu contrasena"
                  className="input-field pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm p-3 rounded-xl border border-red-100 dark:border-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ya tenes cuenta? Iniciar sesion
            </Link>
          </div>

          <p className="text-center text-slate-400 text-xs mt-8">
            &copy; 2026 MiTurno Salud PRO
          </p>
        </div>
      </div>
    </div>
  );
}
