import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboard,
  getTurnosHoy,
  getReportePorEspecialidad,
  getTurnosPorMes,
  getIngresosSemanales,
  enviarRecordatorios,
} from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  CalendarCheck,
  CheckCircle,
  UserX,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Clock,
  Activity,
  Mail,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const statusBadge = {
  programado: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completado: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelado: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  ausente: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const PIE_COLORS = ['#1a73f5', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

const CustomTooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  padding: '10px 14px',
};

function formatCurrency(value) {
  return `$${Number(value).toLocaleString('es-AR')}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [turnosMes, setTurnosMes] = useState([]);
  const [ingresosSemanales, setIngresosSemanales] = useState([]);
  const [enviandoRecordatorios, setEnviandoRecordatorios] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    getDashboard().then((r) => setStats(r.data));
    getTurnosHoy().then((r) => setTurnos(r.data));
    getReportePorEspecialidad().then((r) => setEspecialidades(r.data));
    getTurnosPorMes().then((r) => setTurnosMes(r.data)).catch(() => {});
    getIngresosSemanales().then((r) => setIngresosSemanales(r.data)).catch(() => {});
  }, []);

  if (!stats)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#1a73f5] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const statCards = [
    {
      label: 'Turnos este mes',
      value: stats.total_turnos_mes,
      icon: CalendarCheck,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-[#1a73f5]',
      trend: '+12%',
      up: true,
    },
    {
      label: 'Completados',
      value: stats.completados,
      icon: CheckCircle,
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-[#22c55e]',
      trend: '+8%',
      up: true,
    },
    {
      label: 'Ausentes',
      value: stats.ausentes,
      icon: UserX,
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-[#f59e0b]',
      trend: '-3%',
      up: false,
    },
    {
      label: 'Ingresos estimados',
      value: formatCurrency(stats.ingresos_estimados),
      icon: DollarSign,
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-[#8b5cf6]',
      trend: '+15%',
      up: true,
    },
  ];

  const handleEnviarRecordatorios = async () => {
    setEnviandoRecordatorios(true);
    try {
      const res = await enviarRecordatorios();
      const { total_turnos, emails_enviados, errores } = res.data;
      toast.success(
        `Recordatorios enviados: ${emails_enviados}/${total_turnos} turnos de mañana` +
        (errores > 0 ? ` (${errores} errores)` : '')
      );
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Error al enviar recordatorios');
    } finally {
      setEnviandoRecordatorios(false);
    }
  };

  // Pie chart data: turnos por especialidad
  const pieData = especialidades.map((e) => ({
    name: e.especialidad,
    value: e.completados + e.ausentes + e.cancelados,
  })).filter((d) => d.value > 0);

  // Activity feed: latest 5 turnos
  const actividadReciente = turnos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1a2542] dark:text-white">
            Panel de control
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Resumen de actividad del centro medico
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnviarRecordatorios}
            disabled={enviandoRecordatorios}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a73f5] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Mail size={16} />
            {enviandoRecordatorios ? 'Enviando...' : 'Enviar recordatorios de mañana'}
          </button>
          <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="card p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <s.icon size={22} className={s.iconColor} />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  s.up
                    ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
                    : 'text-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {s.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {s.trend}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-[#1a2542] dark:text-white">
              {s.value}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Row 2: Bar Chart (Turnos por Mes) + Line Chart (Ingresos Semanales) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart - Turnos por Mes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1a2542] dark:text-white text-sm">
                Turnos por Mes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Ultimos 6 meses</p>
            </div>
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-[#1a73f5]" />
            </div>
          </div>
          {turnosMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={turnosMes}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(v) => [v, 'Turnos']}
                  cursor={{ fill: 'rgba(26, 115, 245, 0.06)' }}
                />
                <Bar
                  dataKey="total"
                  fill="#1a73f5"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* Line Chart - Ingresos Semanales */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1a2542] dark:text-white text-sm">
                Ingresos Semanales
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Ultimas 4 semanas</p>
            </div>
            <div className="w-9 h-9 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-[#22c55e]" />
            </div>
          </div>
          {ingresosSemanales.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={ingresosSemanales}
                margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="ingresoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(v) => [formatCurrency(v), 'Ingresos']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7, stroke: '#22c55e', strokeWidth: 2 }}
                  fill="url(#ingresoGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
              Sin datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Pie Chart (Especialidad) + Actividad Reciente */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie/Donut Chart - Turnos por Especialidad */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1a2542] dark:text-white text-sm">
                Turnos por Especialidad
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribucion del periodo actual
              </p>
            </div>
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-[#8b5cf6]" />
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CustomTooltipStyle}
                  formatter={(v, name) => [v, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
              Sin datos disponibles
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="font-bold text-[#1a2542] dark:text-white text-sm">
                Actividad Reciente
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ultimos turnos registrados hoy
              </p>
            </div>
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-[#f59e0b]" />
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-700/50 px-2">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg mx-0 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[#1a73f5] text-xs font-bold shrink-0">
                    {t.paciente_nombre
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2542] dark:text-white truncate">
                      {t.paciente_nombre}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {t.medico_nombre} &middot; {t.medico_especialidad}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        statusBadge[t.estado] || 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.estado}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      {t.hora?.slice(0, 5)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full py-12 text-sm text-slate-400">
                No hay turnos para hoy
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 text-center">
            <button
              onClick={() => navigate('/admin/turnos')}
              className="text-sm text-[#1a73f5] font-semibold hover:text-blue-700 transition-colors"
            >
              Ver todos los turnos &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
