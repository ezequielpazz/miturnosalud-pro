import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cambiarPassword } from '../lib/api';
import { User, Lock, Save } from 'lucide-react';

export default function Perfil() {
  const { user } = useAuth();
  const [form, setForm] = useState({ password_actual: '', password_nueva: '' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cambiarPassword(form);
      setMsg('Contrasena actualizada correctamente');
      setForm({ password_actual: '', password_nueva: '' });
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Mi perfil</h2>

      <div className="max-w-lg">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={28} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{user?.nombre}</h3>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="badge bg-primary-100 text-primary-700 mt-1 inline-block">{user?.rol}</span>
            </div>
          </div>

          {user?.telefono && <p className="text-sm text-slate-600 mb-2">Telefono: {user.telefono}</p>}
          {user?.especialidad && <p className="text-sm text-slate-600 mb-2">Especialidad: {user.especialidad}</p>}
          {user?.dni && <p className="text-sm text-slate-600 mb-2">DNI: {user.dni}</p>}
          {user?.direccion && <p className="text-sm text-slate-600 mb-4">Direccion: {user.direccion}</p>}

          <h4 className="font-bold text-slate-900 mt-6 mb-4 flex items-center gap-2"><Lock size={16} />Cambiar contrasena</h4>
          {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msg.includes('Error') || msg.includes('incorrecta') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">Contrasena actual</label><input type="password" value={form.password_actual} onChange={e => setForm({...form, password_actual: e.target.value})} className="input-field" required /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nueva contrasena</label><input type="password" value={form.password_nueva} onChange={e => setForm({...form, password_nueva: e.target.value})} className="input-field" required /></div>
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm"><Save size={14} className="inline mr-2" />Guardar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
