import { useState, useEffect } from 'react';
import { getTurnos, updateTurno } from '../../lib/api';
import { CalendarDays, X } from 'lucide-react';

const statusBadge = {
  programado: 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
  ausente: 'bg-amber-100 text-amber-700',
};

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);

  const cargar = () => {
    const hoy = new Date().toISOString().split('T')[0];
    getTurnos({ fecha_desde: hoy }).then(r => setTurnos(r.data));
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar este turno?')) return;
    await updateTurno(id, { estado: 'cancelado' });
    cargar();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Mis turnos</h2>

      <div className="space-y-4">
        {turnos.map(t => {
          const [year, month, day] = (t.fecha || '').split('-');
          const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          return (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="text-center bg-primary-50 rounded-xl p-3 min-w-[70px]">
                    <span className="text-xs text-primary-600 font-semibold block">{months[parseInt(month) - 1]}</span>
                    <span className="text-2xl font-extrabold text-primary-700 block">{day}</span>
                    <span className="text-xs text-primary-500">{t.hora?.slice(0, 5)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t.medico_nombre}</h4>
                    <span className="badge bg-primary-100 text-primary-700 mt-1 inline-block">{t.medico_especialidad}</span>
                    <p className="text-sm text-slate-500 mt-2">{t.motivo || 'Sin motivo'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span>
                  {t.estado === 'programado' && (
                    <button onClick={() => cancelar(t.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold">
                      <X size={12} className="inline mr-1" />Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {turnos.length === 0 && <div className="card p-12 text-center text-slate-400">No tenes turnos programados</div>}
      </div>
    </div>
  );
}
