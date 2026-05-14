import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getTurnosHoy, getReportePorEspecialidad } from '../../lib/api';
import { CalendarCheck, CheckCircle, UserX, DollarSign, ArrowUp, ArrowDown, Clock, Phone, Stethoscope, FileText, Database } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const statusBadge = {
  programado: 'bg-slate-100 text-slate-600',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
  ausente: 'bg-amber-100 text-amber-700',
};

function agruparPorFecha(turnos) {
  const map = {};
  turnos.forEach((t) => {
    const fecha = t.fecha ? t.fecha.slice(0, 10) : null;
    if (!fecha) return;
    map[fecha] = (map[fecha] || 0) + 1;
  });
  // Last 7 distinct dates sorted
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([fecha, total]) => ({
      fecha: fecha.slice(5), // MM-DD
      total,
    }));
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard().then(r => setStats(r.data));
    getTurnosHoy().then(r => setTurnos(r.data));
    getReportePorEspecialidad().then(r => setEspecialidades(r.data));
  }, []);

  if (!stats) return <div className="text-center py-12 text-slate-400">Cargando...</div>;

  const statCards = [
    { label: 'Turnos este mes', value: stats.total_turnos_mes, icon: CalendarCheck, color: 'bg-primary-50 text-primary-600', trend: '+12%', up: true },
    { label: 'Completados', value: stats.completados, icon: CheckCircle, color: 'bg-green-50 text-green-600', trend: '+8%', up: true },
    { label: 'Ausentes', value: stats.ausentes, icon: UserX, color: 'bg-amber-50 text-amber-600', trend: '-3%', up: false },
    { label: 'Ingresos estimados', value: `$${Number(stats.ingresos_estimados).toLocaleString('es-AR')}`, icon: DollarSign, color: 'bg-violet-50 text-violet-600', trend: '+15%', up: true },
  ];

  const barData = especialidades.map((e) => ({
    especialidad: e.especialidad,
    total: e.completados + e.ausentes + e.cancelados,
  }));

  const lineData = agruparPorFecha(turnos);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Panel de control</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon size={20} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                {s.up ? <ArrowUp size={10} className="inline mr-0.5" /> : <ArrowDown size={10} className="inline mr-0.5" />}
                {s.trend}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Line chart — turnos últimos 7 días */}
      {lineData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Turnos — últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={lineData} margin={{ top: 4, right: 16, left: -32, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v) => [v, 'Turnos']}
              />
              <Line type="monotone" dataKey="total" stroke="#1e40af" strokeWidth={2} dot={{ r: 3, fill: '#1e40af' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Turnos de hoy */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Turnos de hoy</h3>
            <span className="text-xs text-slate-400">{new Date().toLocaleDateString('es-AR')}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {turnos.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold text-slate-500 w-14">{t.hora?.slice(0, 5)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{t.paciente_nombre}</p>
                  <p className="text-xs text-slate-400">{t.medico_nombre} — {t.medico_especialidad}</p>
                </div>
                <span className={`badge ${statusBadge[t.estado] || 'bg-slate-100 text-slate-500'}`}>{t.estado}</span>
              </div>
            ))}
            {turnos.length === 0 && <p className="p-5 text-sm text-slate-400 text-center">No hay turnos para hoy</p>}
          </div>
          <div className="p-4 border-t border-slate-50 text-center">
            <button onClick={() => navigate('/admin/turnos')} className="text-sm text-primary-600 font-semibold hover:text-primary-700">
              Ver todos los turnos →
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Por especialidad — Recharts BarChart */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-4">Por especialidad</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -28, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="especialidad"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [v, 'Turnos']}
                  />
                  <Bar dataKey="total" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-4">Acciones rapidas</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nuevo turno', icon: Phone, color: 'bg-primary-50 text-primary-700', to: '/admin/recepcion' },
                { label: 'Agregar medico', icon: Stethoscope, color: 'bg-green-50 text-green-700', to: '/admin/medicos' },
                { label: 'Exportar', icon: FileText, color: 'bg-amber-50 text-amber-700', to: '/admin/reportes' },
                { label: 'Backup', icon: Database, color: 'bg-violet-50 text-violet-700', to: '/admin/backups' },
              ].map((a) => (
                <button key={a.label} onClick={() => navigate(a.to)} className={`flex flex-col items-center gap-2 p-3 rounded-xl ${a.color} hover:opacity-80 transition text-xs font-semibold`}>
                  <a.icon size={20} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
