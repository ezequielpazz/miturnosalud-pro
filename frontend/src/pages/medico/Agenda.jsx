import { useState, useEffect } from 'react';
import { getTurnos } from '../../lib/api';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Agenda() {
  const [turnos, setTurnos] = useState([]);
  const [semanaOffset, setSemanaOffset] = useState(0);

  const getWeekDates = (offset) => {
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const days = getWeekDates(semanaOffset);
  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
  const hours = Array.from({ length: 24 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`).filter((_, i) => i < 24);

  useEffect(() => {
    const desde = days[0].toISOString().split('T')[0];
    const hasta = days[4].toISOString().split('T')[0];
    getTurnos({ fecha_desde: desde, fecha_hasta: hasta, estado: 'programado' }).then(r => setTurnos(r.data));
  }, [semanaOffset]);

  const getTurnoAt = (dayIdx, hora) => {
    const fecha = days[dayIdx].toISOString().split('T')[0];
    return turnos.find(t => t.fecha === fecha && t.hora?.slice(0, 5) === hora);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Mi agenda</h2>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={() => setSemanaOffset(s => s - 1)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center">
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-900">
              {days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — {days[4].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => setSemanaOffset(s => s + 1)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setSemanaOffset(0)} className="btn-secondary px-3 py-1.5 text-xs">Hoy</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 w-20">Hora</th>
                {days.map((d, i) => {
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <th key={i} className={`px-2 py-3 text-center text-xs font-semibold ${isToday ? 'text-primary-700 bg-primary-50' : 'text-slate-500'}`}>
                      {dayNames[i]} {d.getDate()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {hours.map(h => (
                <tr key={h} className="border-b border-slate-50">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-400">{h}</td>
                  {days.map((_, di) => {
                    const turno = getTurnoAt(di, h);
                    return (
                      <td key={di} className="px-1 py-1">
                        {turno ? (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg px-2 py-2 text-xs text-primary-700 font-medium truncate">
                            {turno.paciente_nombre}
                          </div>
                        ) : <div className="h-8" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
