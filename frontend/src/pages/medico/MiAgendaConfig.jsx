import { useState, useEffect } from 'react';
import { Clock, Save, RotateCcw } from 'lucide-react';
import { getMisHorarios, saveHorariosBulk } from '../../lib/api';
import { useToast } from '../../components/Toast';

const DIAS = [
  { value: 0, label: 'Lunes', short: 'Lun' },
  { value: 1, label: 'Martes', short: 'Mar' },
  { value: 2, label: 'Miercoles', short: 'Mie' },
  { value: 3, label: 'Jueves', short: 'Jue' },
  { value: 4, label: 'Viernes', short: 'Vie' },
  { value: 5, label: 'Sabado', short: 'Sab' },
];

const HORAS = [];
for (let h = 7; h <= 20; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`);
  HORAS.push(`${String(h).padStart(2, '0')}:30`);
}

const INTERVALOS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

function crearHorarioDefault() {
  return DIAS.reduce((acc, dia) => {
    acc[dia.value] = {
      activo: dia.value <= 4, // Lun-Vie activos por defecto
      hora_inicio: '08:00',
      hora_fin: '13:00',
      intervalo_minutos: 30,
    };
    return acc;
  }, {});
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
    </div>
  );
}

export default function MiAgendaConfig() {
  const [horarios, setHorarios] = useState(crearHorarioDefault);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    getMisHorarios()
      .then((res) => {
        const data = res.data;
        if (data && data.length > 0) {
          const mapped = crearHorarioDefault();
          data.forEach((h) => {
            mapped[h.dia_semana] = {
              activo: h.activo,
              hora_inicio: h.hora_inicio,
              hora_fin: h.hora_fin,
              intervalo_minutos: h.intervalo_minutos,
            };
          });
          setHorarios(mapped);
        }
      })
      .catch(() => {
        toast('Error al cargar horarios', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateDia = (dia, field, value) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setHorarios(crearHorarioDefault());
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Build array of active schedules
    const payload = [];
    for (const dia of DIAS) {
      const h = horarios[dia.value];
      if (h.activo) {
        if (h.hora_inicio >= h.hora_fin) {
          toast(`${dia.label}: la hora de inicio debe ser menor a la hora de fin`, 'error');
          return;
        }
        payload.push({
          dia_semana: dia.value,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          intervalo_minutos: h.intervalo_minutos,
          activo: true,
        });
      }
    }

    setSaving(true);
    try {
      await saveHorariosBulk(payload);
      toast('Horarios guardados correctamente', 'success');
      setHasChanges(false);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al guardar horarios';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={20} className="text-primary-600" />
            Configurar horarios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Define tus dias y horarios de atencion semanal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={loading || saving}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw size={15} />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </div>
      </div>

      {/* Schedule grid */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            {DIAS.map((d) => (
              <SkeletonRow key={d.value} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            {DIAS.map((dia) => {
              const h = horarios[dia.value];
              const isActive = h.activo;

              return (
                <div
                  key={dia.value}
                  className={`p-4 transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  {/* Day header with toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-sm font-bold ${
                        isActive
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {dia.label}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => updateDia(dia.value, 'activo', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>

                  {isActive ? (
                    <div className="space-y-3">
                      {/* Hora inicio */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Inicio
                        </label>
                        <select
                          value={h.hora_inicio}
                          onChange={(e) => updateDia(dia.value, 'hora_inicio', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        >
                          {HORAS.map((hora) => (
                            <option key={hora} value={hora}>
                              {hora}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Hora fin */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Fin
                        </label>
                        <select
                          value={h.hora_fin}
                          onChange={(e) => updateDia(dia.value, 'hora_fin', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        >
                          {HORAS.map((hora) => (
                            <option key={hora} value={hora}>
                              {hora}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Intervalo */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Intervalo
                        </label>
                        <select
                          value={h.intervalo_minutos}
                          onChange={(e) =>
                            updateDia(dia.value, 'intervalo_minutos', parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        >
                          {INTERVALOS.map((i) => (
                            <option key={i.value} value={i.value}>
                              {i.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Slots preview */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {(() => {
                            const [hi, mi] = h.hora_inicio.split(':').map(Number);
                            const [hf, mf] = h.hora_fin.split(':').map(Number);
                            const totalMin = (hf * 60 + mf) - (hi * 60 + mi);
                            const slots = totalMin > 0 ? Math.floor(totalMin / h.intervalo_minutos) : 0;
                            return `${slots} turnos disponibles`;
                          })()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Sin atencion</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="card p-4 border-l-4 border-primary-500">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold">Consejo:</span> Configura tus horarios de atencion para cada dia de la semana.
          Los pacientes solo podran reservar turnos dentro de los horarios que definas.
          Los cambios se aplican a partir de la proxima semana.
        </p>
      </div>
    </div>
  );
}
