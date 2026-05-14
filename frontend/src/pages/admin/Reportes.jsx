import { useState, useEffect } from 'react';
import { getDashboard, getReportePorEspecialidad } from '../../lib/api';
import { FileText, Download, BarChart3 } from 'lucide-react';

export default function Reportes() {
  const [stats, setStats] = useState(null);
  const [reporte, setReporte] = useState([]);
  const [fechas, setFechas] = useState({ fecha_desde: '', fecha_hasta: '' });

  const cargar = (params) => {
    const clean = Object.fromEntries(Object.entries(params || fechas).filter(([_, v]) => v));
    getDashboard(clean).then(r => setStats(r.data));
    getReportePorEspecialidad(clean).then(r => setReporte(r.data));
  };

  useEffect(() => { cargar({}); }, []);

  const exportCsv = () => {
    const header = 'Especialidad,Completados,Ausentes,Cancelados,Precio Base,Ingresos Estimados\n';
    const rows = reporte.map(r => `${r.especialidad},${r.completados},${r.ausentes},${r.cancelados},${r.precio_base},${r.ingresos_estimados}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reporte_mensual.csv'; a.click();
  };

  const totalIngresos = reporte.reduce((s, r) => s + Number(r.ingresos_estimados), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Reportes</h2>

      <div className="flex gap-3 items-end">
        <div><label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label><input type="date" value={fechas.fecha_desde} onChange={e => setFechas({...fechas, fecha_desde: e.target.value})} className="input-field w-44" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label><input type="date" value={fechas.fecha_hasta} onChange={e => setFechas({...fechas, fecha_hasta: e.target.value})} className="input-field w-44" /></div>
        <button onClick={() => cargar()} className="btn-primary px-5 py-2.5 text-sm">Filtrar</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reporte por especialidad */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-600" /> Reporte por especialidad
          </h3>
          <div className="space-y-4">
            {reporte.map(r => (
              <div key={r.especialidad} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.especialidad}</p>
                  <p className="text-xs text-slate-400">{r.completados} completados · {r.ausentes} ausentes · {r.cancelados} cancelados</p>
                </div>
                <span className="font-bold text-green-700 text-sm">${Number(r.ingresos_estimados).toLocaleString('es-AR')}</span>
              </div>
            ))}
            {reporte.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
                <span className="font-bold text-slate-900">TOTAL ESTIMADO</span>
                <span className="text-xl font-extrabold text-green-700">${totalIngresos.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
          <button onClick={exportCsv} className="btn-primary w-full py-3 text-sm mt-5"><Download size={14} className="inline mr-2" />Exportar CSV</button>
        </div>

        {/* Tasa de asistencia */}
        <div className="space-y-6">
          {stats && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-900 mb-4">Tasa de asistencia</h3>
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.8"
                      strokeDasharray={`${stats.tasa_asistencia} ${100 - stats.tasa_asistencia}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900">{stats.tasa_asistencia}%</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-400 rounded-full" />Completados: {stats.completados}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-400 rounded-full" />Ausentes: {stats.ausentes}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-full" />Cancelados: {stats.cancelados}</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-400 rounded-full" />Programados: {stats.programados}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
