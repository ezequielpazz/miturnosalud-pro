import { useState, useEffect } from 'react';
import { getMedicos, createMedico, toggleMedico, getEspecialidades } from '../../lib/api';
import { Stethoscope, Plus, Mail, Phone, CalendarCheck, X } from 'lucide-react';

const specColors = {
  'Cardiologia': 'bg-red-100 text-red-700', 'Pediatria': 'bg-blue-100 text-blue-700',
  'Traumatologia': 'bg-amber-100 text-amber-700', 'Dermatologia': 'bg-green-100 text-green-700',
  'Clinica Medica': 'bg-violet-100 text-violet-700', 'Neurologia': 'bg-pink-100 text-pink-700',
  'Ginecologia': 'bg-rose-100 text-rose-700', 'Oftalmologia': 'bg-teal-100 text-teal-700',
};

export default function Medicos() {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', especialidad: '', password: 'medico123' });
  const [msg, setMsg] = useState('');

  const cargar = () => getMedicos().then(r => setMedicos(r.data));

  useEffect(() => {
    cargar();
    getEspecialidades().then(r => setEspecialidades(r.data));
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await createMedico(form);
      setShowForm(false);
      setForm({ nombre: '', email: '', telefono: '', especialidad: '', password: 'medico123' });
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error');
    }
  };

  const toggle = async (id) => {
    await toggleMedico(id);
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Medicos</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5 py-2.5 text-sm">
          <Plus size={16} className="inline mr-2" />Agregar medico
        </button>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {medicos.map(m => (
          <div key={m.id} className={`card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${!m.activo ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Stethoscope size={20} className="text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{m.nombre}</h4>
                  <span className={`badge ${specColors[m.especialidad] || 'bg-slate-100 text-slate-600'}`}>{m.especialidad}</span>
                </div>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full mt-1 ${m.activo ? 'bg-green-400' : 'bg-slate-300'}`} />
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p><Mail size={12} className="inline mr-2 text-slate-300" />{m.email}</p>
              <p><Phone size={12} className="inline mr-2 text-slate-300" />{m.telefono || '—'}</p>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
              <button onClick={() => toggle(m.id)} className={`flex-1 text-xs font-semibold py-2 rounded-lg ${m.activo ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                {m.activo ? 'Dar de baja' : 'Reactivar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Agregar medico</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            {msg && <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600">{msg}</div>}
            <form onSubmit={guardar} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-field" required /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Telefono</label><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="input-field" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Especialidad</label>
                  <select value={form.especialidad} onChange={e => setForm({...form, especialidad: e.target.value})} className="input-field" required>
                    <option value="">Seleccionar...</option>
                    {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Contrasena temporal</label><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field bg-slate-50" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary py-2.5 text-sm">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
