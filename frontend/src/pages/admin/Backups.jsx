import { useState, useEffect } from 'react';
import { getBackups, createBackup, restaurarBackup } from '../../lib/api';
import { Database, Plus, RotateCcw } from 'lucide-react';

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [msg, setMsg] = useState('');

  const cargar = () => getBackups().then(r => setBackups(r.data));
  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    const res = await createBackup();
    setMsg(res.data.message);
    cargar();
    setTimeout(() => setMsg(''), 3000);
  };

  const restaurar = async (nombre) => {
    if (!confirm(`¿Restaurar desde ${nombre}? Se creara un backup del estado actual.`)) return;
    const res = await restaurarBackup(nombre);
    setMsg(res.data.message);
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Backups</h2>
        <button onClick={crear} className="btn-primary px-5 py-2.5 text-sm"><Plus size={16} className="inline mr-2" />Crear backup</button>
      </div>

      {msg && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl border border-green-100">{msg}</div>}

      <div className="max-w-2xl card">
        <div className="divide-y divide-slate-50">
          {backups.map(b => (
            <div key={b.nombre} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                  <Database size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{b.nombre}</p>
                  <p className="text-xs text-slate-400">{b.tamaño_kb} KB · {new Date(b.fecha).toLocaleString('es-AR')}</p>
                </div>
              </div>
              <button onClick={() => restaurar(b.nombre)} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <RotateCcw size={12} /> Restaurar
              </button>
            </div>
          ))}
          {backups.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No hay backups</p>}
        </div>
      </div>
    </div>
  );
}
