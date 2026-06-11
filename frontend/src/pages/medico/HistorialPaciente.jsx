import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHistorialPaciente } from '../../lib/api';
import {
  ArrowLeft, CalendarDays, FileText, Paperclip, Activity,
  CheckCircle2, XCircle, Clock, Flag, User
} from 'lucide-react';

const estadoConfig = {
  completado: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200', label: 'Completado' },
  programado: { icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Programado' },
  cancelado: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Cancelado' },
  ausente: { icon: XCircle, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Ausente' },
};

export default function HistorialPaciente() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistorialPaciente(id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Cargando historial...</div>;
  if (!data) return <div className="text-center text-slate-400 py-12">No se pudo cargar el historial</div>;

  const { paciente, timeline, estadisticas } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/medico/pacientes" className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial Clinico</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{paciente.nombre}</p>
        </div>
      </div>

      {/* Patient info card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
            {paciente.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">DNI</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{paciente.dni || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Email</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{paciente.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Telefono</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{paciente.telefono || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Obra Social</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{paciente.obra_social || 'Particular'}</p>
            </div>
          </div>
        </div>
        {paciente.notas_clinicas && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Notas clinicas</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{paciente.notas_clinicas}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{estadisticas.total_turnos}</p>
          <p className="text-xs text-slate-400">Total consultas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">{estadisticas.completados}</p>
          <p className="text-xs text-slate-400">Completados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-600">{estadisticas.ausencias}</p>
          <p className="text-xs text-slate-400">Ausencias</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-600">{estadisticas.archivos}</p>
          <p className="text-xs text-slate-400">Archivos</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={16} /> Linea de tiempo
          </h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {timeline.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-400">Sin registros</p>
          )}
          {timeline.map((item, idx) => (
            <div key={`${item.tipo}-${item.id}`} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.tipo === 'turno'
                    ? (estadoConfig[item.estado]?.color || 'text-slate-500 bg-slate-50 border-slate-200')
                    : 'text-purple-600 bg-purple-50 border-purple-200'
                } border`}>
                  {item.tipo === 'turno' ? <CalendarDays size={14} /> : <Paperclip size={14} />}
                </div>
                {idx < timeline.length - 1 && (
                  <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {item.hora && ` · ${item.hora}`}
                  </span>
                  {item.tipo === 'turno' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.estado === 'completado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      item.estado === 'ausente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      item.estado === 'cancelado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {item.estado}
                    </span>
                  )}
                  {item.necesita_seguimiento && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Flag size={10} /> Seguimiento
                    </span>
                  )}
                </div>

                {item.tipo === 'turno' ? (
                  <>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {item.especialidad} — Dr. {item.medico_nombre}
                    </p>
                    {item.motivo && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.motivo}</p>}
                    {item.nota_medica && (
                      <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Nota medica:</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{item.nota_medica}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <FileText size={14} /> {item.nombre}
                    </p>
                    {item.descripcion && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.descripcion}</p>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
