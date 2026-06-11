import { useState, useEffect } from 'react';
import { getTurnosHoy, updateTurno, descargarComprobante } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  CalendarClock, Check, UserX, Pencil, Flag, Pill, Printer,
  Download, Clock, User, Stethoscope
} from 'lucide-react';
import RecetaModal from './RecetaModal';

const statusBadge = {
  programado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  ausente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function TurnosHoy() {
  const toast = useToast();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNota, setEditNota] = useState(null);
  const [nota, setNota] = useState('');
  const [recetaTurno, setRecetaTurno] = useState(null);

  const cargar = () => {
    setLoading(true);
    getTurnosHoy()
      .then(r => setTurnos(r.data))
      .catch(() => toast.error('Error al cargar turnos'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const completar = async (id) => {
    try {
      await updateTurno(id, { estado: 'completado' });
      toast.success('Turno completado');
      cargar();
    } catch { toast.error('Error al completar turno'); }
  };

  const ausente = async (id) => {
    try {
      await updateTurno(id, { estado: 'ausente' });
      toast.warning('Paciente marcado como ausente');
      cargar();
    } catch { toast.error('Error al marcar ausente'); }
  };

  const guardarNota = async (id) => {
    try {
      await updateTurno(id, { nota_medica: nota });
      toast.success('Nota guardada');
      setEditNota(null);
      cargar();
    } catch { toast.error('Error al guardar nota'); }
  };

  const toggleSeguimiento = async (t) => {
    try {
      await updateTurno(t.id, { necesita_seguimiento: !t.necesita_seguimiento });
      toast.info(t.necesita_seguimiento ? 'Seguimiento removido' : 'Marcado para seguimiento');
      cargar();
    } catch { toast.error('Error al actualizar seguimiento'); }
  };

  const imprimirTicket = (t) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`<!DOCTYPE html><html><head><title>Ticket #${t.id}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:20px;max-width:350px;margin:0 auto}
        .header{text-align:center;border-bottom:2px dashed #ccc;padding-bottom:15px;margin-bottom:15px}
        .header h1{font-size:18px;color:#1a2542;margin:0}
        .header p{font-size:11px;color:#888;margin:4px 0 0}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #eee;font-size:13px}
        .label{color:#666}.value{font-weight:600;color:#1a2542}
        .footer{text-align:center;margin-top:20px;padding-top:15px;border-top:2px dashed #ccc;font-size:10px;color:#aaa}
        .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
        .programado{background:#dbeafe;color:#1d4ed8}.completado{background:#dcfce7;color:#16a34a}
        @media print{body{padding:10px}}
      </style></head><body>
      <div class="header"><h1>MiTurno Salud</h1><p>Comprobante de turno</p></div>
      <div class="row"><span class="label">Turno #</span><span class="value">${t.id}</span></div>
      <div class="row"><span class="label">Paciente</span><span class="value">${t.paciente_nombre}</span></div>
      <div class="row"><span class="label">DNI</span><span class="value">${t.paciente_dni || '-'}</span></div>
      <div class="row"><span class="label">Medico</span><span class="value">Dr. ${t.medico_nombre}</span></div>
      <div class="row"><span class="label">Especialidad</span><span class="value">${t.medico_especialidad || ''}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${t.fecha}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${t.hora?.slice(0,5)}</span></div>
      <div class="row"><span class="label">Estado</span><span class="value"><span class="badge ${t.estado}">${t.estado.toUpperCase()}</span></span></div>
      ${t.motivo ? `<div class="row"><span class="label">Motivo</span><span class="value">${t.motivo}</span></div>` : ''}
      <div class="footer"><p>Generado el ${new Date().toLocaleString('es-AR')}</p><p>MiTurno Salud PRO</p></div>
      <script>window.onload=()=>{window.print()}<\/script></body></html>`);
    w.document.close();
  };

  const pendientes = turnos.filter(t => t.estado === 'programado').length;
  const completados = turnos.filter(t => t.estado === 'completado').length;
  const ausentes = turnos.filter(t => t.estado === 'ausente').length;

  const now = new Date();
  const horaActual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock size={20} className="text-primary-600" /> Turnos de hoy
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} — {horaActual}hs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{pendientes} pendientes</span>
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{completados} completados</span>
          {ausentes > 0 && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{ausentes} ausentes</span>}
        </div>
      </div>

      {/* Progress bar */}
      {turnos.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Progreso del dia</span>
            <span className="font-semibold">{completados + ausentes}/{turnos.length}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${((completados + ausentes) / turnos.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {turnos.map(t => (
            <div key={t.id} className={`card p-5 transition-all ${
              t.estado === 'programado'
                ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50'
                : t.estado === 'completado'
                ? 'border-green-100 dark:border-green-900/50 opacity-80'
                : 'opacity-60'
            }`}>
              <div className="flex items-start gap-4">
                {/* Time column */}
                <div className="text-center pt-1 min-w-[60px]">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{t.hora?.slice(0, 5)}</span>
                  <div className={`w-2.5 h-2.5 rounded-full mx-auto mt-2 ${
                    t.estado === 'completado' ? 'bg-green-400' :
                    t.estado === 'ausente' ? 'bg-amber-400' :
                    'bg-blue-400 animate-pulse'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-bold text-slate-900 dark:text-white">{t.paciente_nombre}</h4>
                    {t.paciente_dni && <span className="text-xs text-slate-400 dark:text-slate-500">DNI: {t.paciente_dni}</span>}
                    {t.necesita_seguimiento && (
                      <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Flag size={10} className="inline mr-1" />Seguimiento
                      </span>
                    )}
                    <span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    {t.motivo || 'Sin motivo registrado'}
                    {t.medico_especialidad && <span className="ml-2 text-xs text-slate-400">· {t.medico_especialidad}</span>}
                  </p>

                  {/* Nota medica */}
                  {t.nota_medica && editNota !== t.id && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
                      <Pencil size={10} className="inline mr-1" />{t.nota_medica}
                    </div>
                  )}

                  {/* Edit nota */}
                  {editNota === t.id && (
                    <div className="mt-2 flex gap-2">
                      <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2}
                        className="input-field flex-1 resize-none text-xs" maxLength={500} placeholder="Nota medica..." autoFocus />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => guardarNota(t.id)} className="btn-primary px-3 py-1.5 text-xs">Guardar</button>
                        <button onClick={() => setEditNota(null)} className="btn-secondary px-3 py-1.5 text-xs">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {t.estado === 'programado' && (
                    <>
                      <button onClick={() => setRecetaTurno(t)}
                        className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center justify-center transition-colors" title="Recetar">
                        <Pill size={14} />
                      </button>
                      <button onClick={() => { setEditNota(t.id); setNota(t.nota_medica || ''); }}
                        className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 flex items-center justify-center transition-colors" title="Nota">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleSeguimiento(t)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          t.necesita_seguimiento
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`} title="Seguimiento">
                        <Flag size={14} />
                      </button>
                      <button onClick={() => completar(t.id)}
                        className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center justify-center transition-colors" title="Completar">
                        <Check size={14} />
                      </button>
                      <button onClick={() => ausente(t.id)}
                        className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors" title="Ausente">
                        <UserX size={14} />
                      </button>
                    </>
                  )}
                  {/* Print ticket — always available */}
                  <button onClick={() => imprimirTicket(t)}
                    className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors" title="Imprimir ticket">
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {turnos.length === 0 && (
            <div className="card p-12 text-center">
              <CalendarClock size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No hay turnos para hoy</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Los turnos programados apareceran aqui</p>
            </div>
          )}
        </div>
      )}

      {recetaTurno && (
        <RecetaModal turno={recetaTurno} onClose={() => setRecetaTurno(null)} />
      )}
    </div>
  );
}
