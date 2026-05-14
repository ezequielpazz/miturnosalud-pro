import { useState, useEffect } from 'react';
import { getPacientes, createPaciente, togglePaciente } from '../../lib/api';
import { Users, Plus, Search, Download, X } from 'lucide-react';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', dni: '', email: '', telefono: '', fecha_nacimiento: '', direccion: '', password: 'paciente123' });
  const [msg, setMsg] = useState('');

  const cargar = (search) => getPacientes(search ? { buscar: search } : {}).then(r => setPacientes(r.data));

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await createPaciente(form);
      setShowForm(false);
      setForm({ nombre: '', dni: '', email: '', telefono: '', fecha_nacimiento: '', direccion: '', password: 'paciente123' });
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error');
    }
  };

  const exportCsv = () => {
    const header = 'ID,Nombre,DNI,Email,Telefono,Direccion,Activo\n';
    const rows = pacientes.map(p => `${p.id},${p.nombre},${p.dni},${p.email},${p.telefono},${p.direccion || ''},${p.activo}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pacientes.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Pacientes</h2>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn-secondary px-4 py-2.5 text-sm"><Download size={14} className="inline mr-1" />Exportar</button>
          <button onClick={() => setShowForm(true)} className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} className="inline mr-2" />Agregar paciente</button>
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-100">
          <div className="flex gap-3">
            <input placeholder="Buscar por nombre o DNI..." value={buscar} onChange={e => setBuscar(e.target.value)} className="input-field max-w-sm" />
            <button onClick={() => cargar(buscar)} className="btn-primary px-5 py-2.5 text-sm"><Search size={14} className="inline mr-1" />Buscar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="px-5 py-3 text-left font-semibold">Paciente</th>
              <th className="px-5 py-3 text-left font-semibold">DNI</th>
              <th className="px-5 py-3 text-left font-semibold">Telefono</th>
              <th className="px-5 py-3 text-left font-semibold">Email</th>
              <th className="px-5 py-3 text-left font-semibold">Estado</th>
              <th className="px-5 py-3 text-right font-semibold">Acciones</th>
            </tr></thead>
            <tbody>
              {pacientes.map(p => (
                <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">
                        {p.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{p.dni}</td>
                  <td className="px-5 py-3 text-slate-500">{p.telefono}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{p.email}</td>
                  <td className="px-5 py-3"><span className={`badge ${p.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{p.activo ? 'activo' : 'inactivo'}</span></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => togglePaciente(p.id).then(() => cargar())} className={`text-xs font-semibold ${p.activo ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                      {p.activo ? 'Dar de baja' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">Agregar paciente</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            {msg && <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600">{msg}</div>}
            <form onSubmit={guardar} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">DNI</label><input value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Telefono</label><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="input-field" /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nacimiento</label><input type="date" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Direccion</label><input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} className="input-field" /></div>
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
