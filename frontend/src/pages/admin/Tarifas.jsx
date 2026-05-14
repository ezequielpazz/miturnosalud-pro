import { useState, useEffect } from 'react';
import { getTarifas, updateTarifa } from '../../lib/api';
import { DollarSign, Save, Heart, Baby, Bone, Brain, Eye } from 'lucide-react';

const specIcons = {
  'Cardiologia': { color: 'bg-red-100 text-red-600' },
  'Pediatria': { color: 'bg-blue-100 text-blue-600' },
  'Traumatologia': { color: 'bg-amber-100 text-amber-600' },
  'Dermatologia': { color: 'bg-green-100 text-green-600' },
  'Clinica Medica': { color: 'bg-violet-100 text-violet-600' },
  'Ginecologia': { color: 'bg-pink-100 text-pink-600' },
  'Neurologia': { color: 'bg-indigo-100 text-indigo-600' },
  'Oftalmologia': { color: 'bg-teal-100 text-teal-600' },
};

export default function Tarifas() {
  const [tarifas, setTarifas] = useState([]);
  const [editando, setEditando] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => { getTarifas().then(r => setTarifas(r.data)); }, []);

  const guardar = async (esp) => {
    const precio = editando[esp];
    if (!precio) return;
    await updateTarifa(esp, { precio_base: parseFloat(precio) });
    setMsg(`Tarifa de ${esp} actualizada`);
    getTarifas().then(r => setTarifas(r.data));
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Tarifas</h2>
      {msg && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl border border-green-100">{msg}</div>}

      <div className="max-w-2xl card">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Precios base por especialidad</h3>
          <p className="text-xs text-slate-400 mt-1">Usados para la estimacion de ingresos</p>
        </div>
        <div className="divide-y divide-slate-50">
          {tarifas.map(t => (
            <div key={t.especialidad} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${specIcons[t.especialidad]?.color || 'bg-slate-100 text-slate-600'}`}>
                  <DollarSign size={18} />
                </div>
                <span className="font-semibold text-slate-800">{t.especialidad}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  defaultValue={Number(t.precio_base)}
                  onChange={e => setEditando({...editando, [t.especialidad]: e.target.value})}
                  className="w-28 text-right px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-primary-500"
                />
                <button onClick={() => guardar(t.especialidad)} className="text-primary-600 hover:text-primary-700 ml-2">
                  <Save size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
