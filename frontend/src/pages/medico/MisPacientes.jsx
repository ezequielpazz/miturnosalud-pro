import { useState, useEffect } from 'react';
import { getPacientesPorMedico, updatePaciente } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Save, Flag } from 'lucide-react';

export default function MisPacientes() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (user?.id) getPacientesPorMedico(user.id).then(r => setPacientes(r.data));
  }, [user]);

  const seleccionar = (p) => {
    setSelected(p);
    setNotas(p.notas_clinicas || '');
  };

  const guardar = async () => {
    await updatePaciente(selected.id, { notas_clinicas: notas });
    const updated = { ...selected, notas_clinicas: notas };
    setSelected(updated);
    setPacientes(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Mis pacientes</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="card">
          <div className="p-4 border-b border-slate-100">
            <input placeholder="Buscar paciente..." className="input-field" />
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {pacientes.map(p => (
              <button
                key={p.id}
                onClick={() => seleccionar(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors ${selected?.id === p.id ? 'bg-primary-50' : ''}`}
              >
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-bold">
                  {p.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">DNI: {p.dni}</p>
                </div>
                {p.requiere_turno && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
              </button>
            ))}
            {pacientes.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No hay pacientes</p>}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 card p-6">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {selected.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selected.nombre}</h3>
                    <p className="text-xs text-slate-400">DNI: {selected.dni} · Tel: {selected.telefono}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Notas clinicas</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={12}
                  className="input-field resize-none font-mono text-xs"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={guardar} className="btn-primary px-6 py-2.5 text-sm">
                  <Save size={14} className="inline mr-2" />Guardar notas
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Selecciona un paciente para ver sus notas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
