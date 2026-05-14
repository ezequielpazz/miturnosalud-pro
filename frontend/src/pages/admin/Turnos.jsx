import { useState, useEffect } from 'react';
import { getTurnos, updateTurno } from '../../lib/api';
import { CalendarDays, Search, Download } from 'lucide-react';

const statusBadge = {
  programado: 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
  ausente: 'bg-amber-100 text-amber-700',
};

export default function Turnos() {
  const [turnos, setTurnos] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', estado: '', buscar: '' });

  const cargar = (params) => {
    const clean = Object.fromEntries(Object.entries(params || filtros).filter(([_, v]) => v));
    getTurnos(clean).then(r => setTurnos(r.data));
  };

  useEffect(() => { cargar({}); }, []);

  const hoy = () => {
    const h = new Date().toISOString().split('T')[0];
    const f = { ...filtros, fecha_desde: h, fecha_hasta: h };
    setFiltros(f);
    cargar(f);
  };

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar este turno?')) return;
    await updateTurno(id, { estado: 'cancelado' });
    cargar();
  };

  const exportCsv = () => {
    const header = 'ID,Fecha,Hora,Paciente,DNI,Medico,Especialidad,Estado,Precio\n';
    const rows = turnos.map(t =>
      `${t.id},${t.fecha},${t.hora?.slice(0,5)},${t.paciente_nombre},${t.paciente_dni || ''},${t.medico_nombre},${t.medico_especialidad},${t.estado},${t.precio_base || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'turnos.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Gestion de turnos</h2>

      <div className="card">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Desde</label>
              <input type="date" value={filtros.fecha_desde} onChange={e => setFiltros({...filtros, fecha_desde: e.target.value})} className="input-field" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta</label>
              <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltros({...filtros, fecha_hasta: e.target.value})} className="input-field" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
              <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})} className="input-field">
                <option value="">Todos</option>
                <option value="programado">Programado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar paciente</label>
              <input placeholder="Nombre o DNI..." value={filtros.buscar} onChange={e => setFiltros({...filtros, buscar: e.target.value})} className="input-field" />
            </div>
            <button onClick={() => cargar()} className="btn-primary px-5 py-2.5 text-sm"><Search size={14} className="inline mr-1" />Filtrar</button>
            <button onClick={hoy} className="btn-secondary px-4 py-2.5 text-sm">Hoy</button>
            <button onClick={exportCsv} className="btn-secondary px-4 py-2.5 text-sm"><Download size={14} className="inline mr-1" />CSV</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
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
              {turnos.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-slate-400 font-medium">{t.id}</td>
                  <td className="px-5 py-3 font-medium">{t.fecha}</td>
                  <td className="px-5 py-3 font-semibold">{t.hora?.slice(0, 5)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{t.paciente_nombre}</td>
                  <td className="px-5 py-3 text-slate-400">{t.paciente_dni}</td>
                  <td className="px-5 py-3 text-slate-600">{t.medico_nombre}</td>
                  <td className="px-5 py-3 text-slate-500">{t.medico_especialidad}</td>
                  <td className="px-5 py-3"><span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span></td>
                  <td className="px-5 py-3 text-right font-semibold">{t.precio_base ? `$${Number(t.precio_base).toLocaleString('es-AR')}` : '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {t.estado === 'programado' && (
                      <button onClick={() => cancelar(t.id)} className="text-red-400 hover:text-red-600 text-xs font-semibold">Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
              {turnos.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-8 text-center text-slate-400">No se encontraron turnos</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-50">
          <span className="text-xs text-slate-400">{turnos.length} turnos encontrados</span>
        </div>
      </div>
    </div>
  );
}
