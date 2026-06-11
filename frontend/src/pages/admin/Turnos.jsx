import { useState, useEffect } from 'react';
import { getTurnos, updateTurno, createTurno, descargarComprobante } from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  CalendarDays, Search, Download, Copy, Printer, X, XCircle,
  ChevronLeft, ChevronRight, MoreHorizontal, Eye, Ban
} from 'lucide-react';

const MOTIVOS_CANCELACION = [
  'Paciente solicito cancelacion',
  'Medico no disponible',
  'Reagendado para otra fecha',
  'No se presento el paciente',
  'Emergencia medica',
  'Otro motivo',
];

const statusBadge = {
  programado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completado: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelado: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  ausente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function Turnos() {
  const toast = useToast();
  const [turnos, setTurnos] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', estado: '', buscar: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const [cancelando, setCancelando] = useState(false);

  // Detail modal
  const [detailTurno, setDetailTurno] = useState(null);

  // Action dropdown
  const [openAction, setOpenAction] = useState(null);

  const cargar = (params) => {
    setLoading(true);
    const clean = Object.fromEntries(Object.entries(params || filtros).filter(([_, v]) => v));
    getTurnos(clean)
      .then(r => { setTurnos(r.data); setPage(1); })
      .catch(() => toast.error('Error al cargar turnos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar({}); }, []);

  useEffect(() => {
    const handler = () => setOpenAction(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const hoy = () => {
    const h = new Date().toISOString().split('T')[0];
    const f = { ...filtros, fecha_desde: h, fecha_hasta: h };
    setFiltros(f);
    cargar(f);
  };

  // Cancel with reason
  const abrirCancelModal = (turno) => {
    setCancelModal(turno);
    setMotivoSeleccionado('');
    setMotivoCustom('');
    setOpenAction(null);
  };

  const cerrarCancelModal = () => {
    setCancelModal(null);
    setMotivoSeleccionado('');
    setMotivoCustom('');
  };

  const confirmarCancelacion = async () => {
    const motivo = motivoSeleccionado === 'Otro motivo' ? motivoCustom.trim() : motivoSeleccionado;
    if (!motivo) { toast.error('Selecciona un motivo de cancelacion'); return; }
    setCancelando(true);
    try {
      await updateTurno(cancelModal.id, { estado: 'cancelado', motivo_cancelacion: motivo });
      toast.success('Turno cancelado correctamente');
      cerrarCancelModal();
      cargar();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al cancelar el turno');
    } finally {
      setCancelando(false);
    }
  };

  // Duplicate turno
  const duplicar = async (t) => {
    setOpenAction(null);
    try {
      await createTurno({
        id_paciente: t.id_paciente,
        id_medico: t.id_medico,
        fecha: t.fecha,
        hora: t.hora,
        motivo: t.motivo,
        telefono_paciente: t.telefono_paciente,
        creado_por: 'duplicado',
      });
      toast.success('Turno duplicado correctamente');
      cargar();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'No se pudo duplicar (horario ocupado?)');
    }
  };

  // Print ticket
  const imprimirTicket = (t) => {
    setOpenAction(null);
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
        .cancelado{background:#fee2e2;color:#dc2626}.ausente{background:#fef3c7;color:#d97706}
        @media print{body{padding:10px}}
      </style></head><body>
      <div class="header"><h1>MiTurno Salud</h1><p>Comprobante de turno</p></div>
      <div class="row"><span class="label">Turno #</span><span class="value">${t.id}</span></div>
      <div class="row"><span class="label">Paciente</span><span class="value">${t.paciente_nombre}</span></div>
      <div class="row"><span class="label">DNI</span><span class="value">${t.paciente_dni || '-'}</span></div>
      <div class="row"><span class="label">Medico</span><span class="value">Dr. ${t.medico_nombre}</span></div>
      <div class="row"><span class="label">Especialidad</span><span class="value">${t.medico_especialidad}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${t.fecha}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${t.hora?.slice(0,5)}</span></div>
      <div class="row"><span class="label">Estado</span><span class="value"><span class="badge ${t.estado}">${t.estado.toUpperCase()}</span></span></div>
      ${t.motivo ? `<div class="row"><span class="label">Motivo</span><span class="value">${t.motivo}</span></div>` : ''}
      ${t.precio_base ? `<div class="row"><span class="label">Precio</span><span class="value">$${Number(t.precio_base).toLocaleString('es-AR')}</span></div>` : ''}
      <div class="footer"><p>Generado el ${new Date().toLocaleString('es-AR')}</p><p>MiTurno Salud PRO</p></div>
      <script>window.onload=()=>{window.print()}<\/script></body></html>`);
    w.document.close();
  };

  // Download PDF
  const descargarPdf = (t) => {
    setOpenAction(null);
    descargarComprobante(t.id).catch(() => toast.error('Error al descargar comprobante'));
  };

  const exportCsv = () => {
    const header = 'ID,Fecha,Hora,Paciente,DNI,Medico,Especialidad,Estado,Precio\n';
    const rows = turnos.map(t =>
      `${t.id},${t.fecha},${t.hora?.slice(0,5)},${t.paciente_nombre},${t.paciente_dni || ''},${t.medico_nombre},${t.medico_especialidad},${t.estado},${t.precio_base || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'turnos.csv'; a.click();
  };

  // Pagination
  const totalPages = Math.ceil(turnos.length / perPage);
  const paginated = turnos.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={20} className="text-primary-600" /> Gestion de turnos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{turnos.length} turnos encontrados</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Desde</label>
              <input type="date" value={filtros.fecha_desde} onChange={e => setFiltros({...filtros, fecha_desde: e.target.value})} className="input-field" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Hasta</label>
              <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltros({...filtros, fecha_hasta: e.target.value})} className="input-field" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Estado</label>
              <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})} className="input-field">
                <option value="">Todos</option>
                <option value="programado">Programado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Buscar paciente</label>
              <input placeholder="Nombre o DNI..." value={filtros.buscar} onChange={e => setFiltros({...filtros, buscar: e.target.value})} className="input-field" />
            </div>
            <button onClick={() => cargar()} className="btn-primary px-5 py-2.5 text-sm"><Search size={14} className="inline mr-1" />Filtrar</button>
            <button onClick={hoy} className="btn-secondary px-4 py-2.5 text-sm">Hoy</button>
            <button onClick={exportCsv} className="btn-secondary px-4 py-2.5 text-sm"><Download size={14} className="inline mr-1" />CSV</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-3">Cargando turnos...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-5 py-3 text-left font-semibold">Hora</th>
                  <th className="px-5 py-3 text-left font-semibold">Paciente</th>
                  <th className="px-5 py-3 text-left font-semibold">DNI</th>
                  <th className="px-5 py-3 text-left font-semibold">Medico</th>
                  <th className="px-5 py-3 text-left font-semibold">Especialidad</th>
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Precio</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 dark:text-slate-500 font-medium">{t.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{t.fecha}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white">{t.hora?.slice(0, 5)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white">{t.paciente_nombre}</td>
                    <td className="px-5 py-3 text-slate-400 dark:text-slate-500">{t.paciente_dni}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{t.medico_nombre}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{t.medico_especialidad}</td>
                    <td className="px-5 py-3"><span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{t.precio_base ? `$${Number(t.precio_base).toLocaleString('es-AR')}` : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenAction(openAction === t.id ? null : t.id); }}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openAction === t.id && (
                          <div className="absolute right-0 top-9 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1"
                            onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setDetailTurno(t); setOpenAction(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                              <Eye size={14} /> Ver detalle
                            </button>
                            <button onClick={() => imprimirTicket(t)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                              <Printer size={14} /> Imprimir ticket
                            </button>
                            <button onClick={() => descargarPdf(t)}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                              <Download size={14} /> Descargar PDF
                            </button>
                            {t.estado === 'programado' && (
                              <>
                                <button onClick={() => duplicar(t)}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                  <Copy size={14} /> Duplicar turno
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                                <button onClick={() => abrirCancelModal(t)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                  <Ban size={14} /> Cancelar turno
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {turnos.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                      <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                      No se encontraron turnos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Mostrando {(page-1)*perPage+1}-{Math.min(page*perPage, turnos.length)} de {turnos.length}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button key={i} onClick={() => setPage(i+1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium ${page === i+1 ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  {i+1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarCancelModal} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Cancelar turno</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {cancelModal.paciente_nombre} — {cancelModal.fecha} {cancelModal.hora?.slice(0,5)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Motivo de cancelacion</label>
              <select value={motivoSeleccionado} onChange={e => { setMotivoSeleccionado(e.target.value); setMotivoCustom(''); }} className="input-field w-full">
                <option value="">Seleccionar motivo...</option>
                {MOTIVOS_CANCELACION.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {motivoSeleccionado === 'Otro motivo' && (
                <input type="text" placeholder="Especificar motivo..." value={motivoCustom} onChange={e => setMotivoCustom(e.target.value)} maxLength={200} className="input-field w-full" autoFocus />
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={cerrarCancelModal} className="btn-secondary flex-1 py-2.5" disabled={cancelando}>Volver</button>
              <button onClick={confirmarCancelacion}
                disabled={cancelando || !motivoSeleccionado || (motivoSeleccionado === 'Otro motivo' && !motivoCustom.trim())}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
                {cancelando ? 'Cancelando...' : 'Confirmar cancelacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailTurno(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detalle del turno #{detailTurno.id}</h3>
              <button onClick={() => setDetailTurno(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ['Paciente', detailTurno.paciente_nombre],
                ['DNI', detailTurno.paciente_dni || '-'],
                ['Medico', `Dr. ${detailTurno.medico_nombre}`],
                ['Especialidad', detailTurno.medico_especialidad],
                ['Fecha', detailTurno.fecha],
                ['Hora', detailTurno.hora?.slice(0, 5)],
                ['Motivo', detailTurno.motivo || '-'],
                ['Precio', detailTurno.precio_base ? `$${Number(detailTurno.precio_base).toLocaleString('es-AR')}` : '-'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">{val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Estado</span>
                <span className={`badge ${statusBadge[detailTurno.estado]}`}>{detailTurno.estado}</span>
              </div>
              {detailTurno.nota_medica && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Nota medica:</span> {detailTurno.nota_medica}
                </div>
              )}
              {detailTurno.motivo_cancelacion && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-700 dark:text-red-300">
                  <span className="font-bold">Motivo cancelacion:</span> {detailTurno.motivo_cancelacion}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => imprimirTicket(detailTurno)} className="btn-secondary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                <Printer size={14} /> Imprimir
              </button>
              <button onClick={() => descargarPdf(detailTurno)} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                <Download size={14} /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
