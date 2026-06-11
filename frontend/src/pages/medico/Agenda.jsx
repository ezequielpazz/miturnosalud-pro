import { useState, useEffect, useRef } from 'react';
import { getTurnos, updateTurno } from '../../lib/api';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, GripVertical } from 'lucide-react';

const VIEWS = ['Semanal', 'Dia'];
const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const estadoColors = {
  programado: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300',
  completado: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300',
  cancelado: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300',
  ausente: 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-300',
};

function getWeekDates(offset) {
  const now = new Date();
  now.setDate(now.getDate() + offset * 7);
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

const HOURS = [];
for (let h = 8; h <= 19; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
  HOURS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function Agenda() {
  const [turnos, setTurnos] = useState([]);
  const [view, setView] = useState('Semanal');
  const [offset, setOffset] = useState(0);
  const [dragTurno, setDragTurno] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dates for current view
  const days = view === 'Semanal' ? getWeekDates(offset) : [(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d; })()];

  const dateRange = {
    desde: formatDate(days[0]),
    hasta: formatDate(days[days.length - 1]),
  };

  useEffect(() => {
    setLoading(true);
    getTurnos({ fecha_desde: dateRange.desde, fecha_hasta: dateRange.hasta })
      .then(r => setTurnos(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [offset, view]);

  const getTurnosAt = (dayIdx, hora) => {
    const fecha = formatDate(days[dayIdx]);
    return turnos.filter(t => t.fecha === fecha && t.hora?.slice(0, 5) === hora);
  };

  // Drag and drop handlers
  const handleDragStart = (e, turno) => {
    if (turno.estado !== 'programado') return;
    setDragTurno(turno);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', turno.id);
  };

  const handleDragOver = (e, dayIdx, hora) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ dayIdx, hora });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, dayIdx, hora) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragTurno) return;

    const newFecha = formatDate(days[dayIdx]);
    const newHora = hora + ':00';

    if (newFecha === dragTurno.fecha && hora === dragTurno.hora?.slice(0, 5)) {
      setDragTurno(null);
      return;
    }

    try {
      await updateTurno(dragTurno.id, { fecha: newFecha, hora: newHora });
      // Refresh
      const r = await getTurnos({ fecha_desde: dateRange.desde, fecha_hasta: dateRange.hasta });
      setTurnos(r.data || []);
    } catch {
      // silently fail
    }
    setDragTurno(null);
  };

  const handleDragEnd = () => {
    setDragTurno(null);
    setDropTarget(null);
  };

  // Navigation
  const goBack = () => setOffset(o => o - 1);
  const goForward = () => setOffset(o => o + 1);
  const goToday = () => setOffset(0);

  const headerLabel = view === 'Semanal'
    ? `${days[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${days[days.length - 1].toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : days[0].toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const todayStr = formatDate(new Date());

  // Stats
  const turnosSemana = turnos.length;
  const programados = turnos.filter(t => t.estado === 'programado').length;
  const completados = turnos.filter(t => t.estado === 'completado').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-primary-600" /> Mi agenda
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {turnosSemana} turnos · <span className="text-blue-600">{programados} programados</span> · <span className="text-green-600">{completados} completados</span>
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          {VIEWS.map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setOffset(0); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                view === v
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar card */}
      <div className="card overflow-hidden">
        {/* Nav bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base capitalize">{headerLabel}</h3>
            <button onClick={goForward} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="btn-secondary px-3 py-1.5 text-xs">Hoy</button>
            <div className="hidden sm:flex items-center gap-2 ml-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-400" /> Programado</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-400" /> Completado</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400" /> Ausente</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 w-16 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                  <Clock size={14} className="inline" />
                </th>
                {days.map((d, i) => {
                  const isToday = formatDate(d) === todayStr;
                  return (
                    <th key={i} className={`px-2 py-3 text-center min-w-[140px] ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                      <span className={`text-xs font-semibold ${isToday ? 'text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {DAY_NAMES[i] || d.toLocaleDateString('es-AR', { weekday: 'short' })}
                      </span>
                      <br />
                      <span className={`text-lg font-bold ${isToday ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-white'}`}>
                        {d.getDate()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(h => (
                <tr key={h} className="border-b border-slate-50 dark:border-slate-800/50">
                  <td className="px-3 py-1 text-xs font-mono text-slate-400 dark:text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    {h}
                  </td>
                  {days.map((d, di) => {
                    const cellTurnos = getTurnosAt(di, h);
                    const isToday = formatDate(d) === todayStr;
                    const isTarget = dropTarget?.dayIdx === di && dropTarget?.hora === h;

                    return (
                      <td
                        key={di}
                        className={`px-1 py-0.5 transition-colors ${isToday ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''} ${isTarget ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-400 ring-inset' : ''}`}
                        onDragOver={(e) => handleDragOver(e, di, h)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, di, h)}
                      >
                        {cellTurnos.length > 0 ? cellTurnos.map(turno => (
                          <div
                            key={turno.id}
                            draggable={turno.estado === 'programado'}
                            onDragStart={(e) => handleDragStart(e, turno)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTurno(selectedTurno?.id === turno.id ? null : turno)}
                            className={`rounded-lg border px-2 py-1.5 mb-0.5 cursor-pointer transition-all hover:shadow-md ${estadoColors[turno.estado] || estadoColors.programado} ${
                              dragTurno?.id === turno.id ? 'opacity-40 scale-95' : ''
                            } ${selectedTurno?.id === turno.id ? 'ring-2 ring-primary-500 shadow-lg' : ''} ${
                              turno.estado === 'programado' ? 'cursor-grab active:cursor-grabbing' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {turno.estado === 'programado' && <GripVertical size={10} className="opacity-40 shrink-0" />}
                              <span className="text-[11px] font-bold truncate">{turno.paciente_nombre}</span>
                            </div>
                            {view === 'Dia' && turno.motivo && (
                              <p className="text-[10px] opacity-70 truncate mt-0.5">{turno.motivo}</p>
                            )}
                          </div>
                        )) : (
                          <div className="h-7" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected turno detail */}
      {selectedTurno && (
        <div className="card p-5 border-l-4 border-primary-500">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-primary-600" />
                {selectedTurno.paciente_nombre}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {selectedTurno.fecha} a las {selectedTurno.hora?.slice(0, 5)} ·
                Dr. {selectedTurno.medico_nombre} ·
                {selectedTurno.especialidad}
              </p>
              {selectedTurno.motivo && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  <span className="font-medium">Motivo:</span> {selectedTurno.motivo}
                </p>
              )}
              {selectedTurno.nota_medica && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Nota:</span> {selectedTurno.nota_medica}
                </div>
              )}
              {selectedTurno.estado === 'cancelado' && selectedTurno.motivo_cancelacion && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  <span className="font-bold">Motivo de cancelacion:</span> {selectedTurno.motivo_cancelacion}
                </div>
              )}
            </div>
            <span className={`badge ${
              selectedTurno.estado === 'completado' ? 'bg-green-100 text-green-700' :
              selectedTurno.estado === 'ausente' ? 'bg-amber-100 text-amber-700' :
              selectedTurno.estado === 'cancelado' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {selectedTurno.estado}
            </span>
          </div>
          {selectedTurno.estado === 'programado' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1">
              <GripVertical size={12} /> Arrastra este turno a otra celda para reprogramarlo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
