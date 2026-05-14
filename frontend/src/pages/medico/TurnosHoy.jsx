import { useState, useEffect } from 'react';
import { getTurnosHoy, updateTurno } from '../../lib/api';
import { CalendarClock, Check, UserX, Pencil, Flag, Download } from 'lucide-react';

const statusBadge = {
  programado: 'bg-slate-100 text-slate-600',
  completado: 'bg-green-100 text-green-700',
  ausente: 'bg-amber-100 text-amber-700',
};

export default function TurnosHoy() {
  const [turnos, setTurnos] = useState([]);
  const [editNota, setEditNota] = useState(null);
  const [nota, setNota] = useState('');

  const cargar = () => getTurnosHoy().then(r => setTurnos(r.data));
  useEffect(() => { cargar(); }, []);

  const completar = async (id) => {
    await updateTurno(id, { estado: 'completado' });
    cargar();
  };

  const ausente = async (id) => {
    await updateTurno(id, { estado: 'ausente' });
    cargar();
  };

  const guardarNota = async (id) => {
    await updateTurno(id, { nota_medica: nota });
    setEditNota(null);
    cargar();
  };

  const toggleSeguimiento = async (t) => {
    await updateTurno(t.id, { necesita_seguimiento: !t.necesita_seguimiento });
    cargar();
  };

  const pendientes = turnos.filter(t => t.estado === 'programado').length;
  const completados = turnos.filter(t => t.estado === 'completado').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Turnos de hoy</h2>
        <div className="flex gap-2">
          <span className="badge bg-green-100 text-green-700">{completados} completados</span>
          <span className="badge bg-slate-100 text-slate-600">{pendientes} pendientes</span>
        </div>
      </div>

      <div className="space-y-3">
        {turnos.map(t => (
          <div key={t.id} className={`card p-5 ${t.estado === 'programado' ? 'border-blue-200 ring-1 ring-blue-100' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="text-center pt-1">
                <span className="text-lg font-extrabold text-slate-900">{t.hora?.slice(0, 5)}</span>
                <div className={`w-2.5 h-2.5 rounded-full mx-auto mt-2 ${t.estado === 'completado' ? 'bg-green-400' : t.estado === 'ausente' ? 'bg-amber-400' : 'bg-blue-400 animate-pulse'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-900">{t.paciente_nombre}</h4>
                  {t.necesita_seguimiento && <span className="badge bg-amber-100 text-amber-700"><Flag size={10} className="inline mr-1" />Seguimiento</span>}
                  <span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{t.motivo || 'Sin motivo registrado'}</p>
                {t.nota_medica && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                    <Pencil size={10} className="inline mr-1" />{t.nota_medica}
                  </div>
                )}
                {editNota === t.id && (
                  <div className="mt-2 flex gap-2">
                    <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2} className="input-field flex-1 resize-none text-xs" maxLength={500} placeholder="Nota medica..." />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => guardarNota(t.id)} className="btn-primary px-3 py-1.5 text-xs">Guardar</button>
                      <button onClick={() => setEditNota(null)} className="btn-secondary px-3 py-1.5 text-xs">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {t.estado === 'programado' && (
                  <>
                    <button onClick={() => { setEditNota(t.id); setNota(t.nota_medica || ''); }} className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center" title="Nota">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleSeguimiento(t)} className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.necesita_seguimiento ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} title="Seguimiento">
                      <Flag size={14} />
                    </button>
                    <button onClick={() => completar(t.id)} className="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center" title="Completar">
                      <Check size={14} />
                    </button>
                    <button onClick={() => ausente(t.id)} className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center" title="Ausente">
                      <UserX size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {turnos.length === 0 && <div className="card p-12 text-center text-slate-400">No hay turnos programados para hoy</div>}
      </div>
    </div>
  );
}
