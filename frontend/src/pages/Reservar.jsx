import { useState, useEffect } from 'react';
import {
  getEspecialidadesPublico,
  getMedicosPublico,
  getDisponibilidadPublico,
  reservarTurnoPublico,
} from '../lib/api';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle, Clock, User, Stethoscope, Calendar } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

// ── sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  const steps = ['Especialidad', 'Médico', 'Fecha y hora', 'Tus datos'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-blue-800 text-white' : active ? 'bg-blue-800 text-white ring-4 ring-blue-200' : 'bg-slate-200 text-slate-400'}`}
              >
                {done ? <CheckCircle size={16} /> : num}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${active ? 'text-blue-800 font-semibold' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-blue-800' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResumenLateral({ especialidad, medico, fecha, hora }) {
  if (!especialidad) return null;
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-sm space-y-2">
      <p className="font-semibold text-blue-800 mb-3">Resumen de tu selección</p>
      {especialidad && (
        <div className="flex items-center gap-2 text-slate-700">
          <Stethoscope size={14} className="text-blue-600 shrink-0" />
          <span>{especialidad}</span>
        </div>
      )}
      {medico && (
        <div className="flex items-center gap-2 text-slate-700">
          <User size={14} className="text-blue-600 shrink-0" />
          <span>{medico.nombre}</span>
        </div>
      )}
      {fecha && (
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar size={14} className="text-blue-600 shrink-0" />
          <span>{fecha}</span>
        </div>
      )}
      {hora && (
        <div className="flex items-center gap-2 text-slate-700">
          <Clock size={14} className="text-blue-600 shrink-0" />
          <span>{hora}</span>
        </div>
      )}
    </div>
  );
}

// ── Paso 1 ────────────────────────────────────────────────────────────────────
function Paso1({ onSelect }) {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getEspecialidadesPublico()
      .then((r) => setEspecialidades(r.data))
      .catch(() => setError('No se pudieron cargar las especialidades. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Cargando especialidades…
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
        <AlertCircle size={18} /> {error}
      </div>
    );

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">¿Qué especialidad necesitás?</h2>
      <p className="text-sm text-slate-500 mb-6">Seleccioná una especialidad para continuar.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {especialidades.map((esp) => {
          const nombre = typeof esp === 'string' ? esp : esp.nombre ?? esp.especialidad ?? String(esp);
          return (
            <button
              key={nombre}
              onClick={() => onSelect(nombre)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold text-slate-700 hover:text-blue-800 min-h-[80px]"
            >
              <Stethoscope size={20} className="text-blue-700" />
              {nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 2 ────────────────────────────────────────────────────────────────────
function Paso2({ especialidad, seleccionado, onSelect }) {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getMedicosPublico(especialidad)
      .then((r) => setMedicos(r.data))
      .catch(() => setError('No se pudieron cargar los médicos. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, [especialidad]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Cargando médicos…
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
        <AlertCircle size={18} /> {error}
      </div>
    );

  if (medicos.length === 0)
    return <p className="text-slate-400 text-center py-12">No hay médicos disponibles para {especialidad}.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Elegí tu médico</h2>
      <p className="text-sm text-slate-500 mb-6">Especialidad seleccionada: <strong>{especialidad}</strong></p>
      <div className="space-y-3">
        {medicos.map((m) => {
          const id = m.id ?? m._id ?? m.nombre;
          const isSelected = seleccionado?.id === id || seleccionado === m;
          return (
            <button
              key={id}
              onClick={() => onSelect({ ...m, id })}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                ${isSelected ? 'border-blue-700 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
            >
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-lg shrink-0">
                {(m.nombre ?? 'M')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{m.nombre}</p>
                <p className="text-xs text-slate-500">{m.especialidad ?? especialidad}</p>
                {m.duracion_consulta && (
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> {m.duracion_consulta} min por consulta
                  </p>
                )}
              </div>
              {isSelected && <CheckCircle size={20} className="text-blue-700 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 3 ────────────────────────────────────────────────────────────────────
function Paso3({ medico, fechaSel, horaSel, onFechaChange, onHoraChange }) {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fechaSel || !medico) return;
    setLoading(true);
    setError('');
    setHorarios([]);
    getDisponibilidadPublico({ medico_id: medico.id, fecha: fechaSel })
      .then((r) => setHorarios(r.data))
      .catch(() => setError('No se pudo cargar la disponibilidad. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, [fechaSel, medico]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Seleccioná fecha y horario</h2>
      <p className="text-sm text-slate-500 mb-6">Médico: <strong>{medico?.nombre}</strong></p>

      <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha</label>
      <input
        type="date"
        min={hoy()}
        value={fechaSel}
        onChange={(e) => { onFechaChange(e.target.value); onHoraChange(''); }}
        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 mb-6"
      />

      {fechaSel && (
        <>
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Buscando horarios…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {!loading && !error && horarios.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">No hay horarios disponibles para esta fecha.</p>
          )}
          {!loading && horarios.length > 0 && (
            <>
              <p className="text-sm font-semibold text-slate-700 mb-3">Horarios disponibles</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {horarios.map((h) => {
                  const hora = typeof h === 'string' ? h : h.hora ?? h.horario ?? String(h);
                  const disponible = typeof h === 'string' ? true : h.disponible !== false;
                  const selected = horaSel === hora;
                  return (
                    <button
                      key={hora}
                      disabled={!disponible}
                      onClick={() => disponible && onHoraChange(hora)}
                      className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all
                        ${!disponible
                          ? 'border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed'
                          : selected
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-green-200 bg-green-50 text-green-800 hover:border-green-500'
                        }`}
                    >
                      {hora.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Paso 4 ────────────────────────────────────────────────────────────────────
function Paso4({ especialidad, medico, fecha, hora, onExito }) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    dni: '',
    motivo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.telefono) {
      setError('Completá al menos nombre, email y teléfono.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await reservarTurnoPublico({
        especialidad,
        medico_id: medico.id,
        fecha,
        hora,
        ...form,
      });
      onExito(res.data, form.nombre, form.email);
    } catch (err) {
      setError(err.response?.data?.detail ?? 'No se pudo confirmar el turno. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Completá tus datos</h2>
      <p className="text-sm text-slate-500 mb-6">Turno: {fecha} a las {hora?.slice(0, 5)} con {medico?.nombre}</p>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo *</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Ej: María García"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="tu@email.com"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono *</label>
          <input
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            required
            placeholder="+54 9 11 1234-5678"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">DNI <span className="text-slate-400 font-normal">(opcional)</span></label>
          <input
            name="dni"
            value={form.dni}
            onChange={handleChange}
            placeholder="12345678"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Motivo de consulta <span className="text-slate-400 font-normal">(opcional)</span></label>
          <textarea
            name="motivo"
            value={form.motivo}
            onChange={handleChange}
            rows={3}
            placeholder="Describí brevemente el motivo de tu consulta…"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-colors"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Confirmando…' : 'Confirmar turno'}
        </button>
      </form>
    </div>
  );
}

// ── Pantalla de éxito ─────────────────────────────────────────────────────────
function PantallaExito({ turno, especialidad, medico, fecha, hora, nombre, email }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">¡Turno confirmado!</h2>
      <p className="text-slate-500 mb-8">Te enviamos un email de confirmación a <strong>{email}</strong>.</p>

      <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 max-w-sm mx-auto">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Detalle del turno</p>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <User size={15} className="text-blue-700 shrink-0" />
          <span>{nombre}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Stethoscope size={15} className="text-blue-700 shrink-0" />
          <span>{medico?.nombre} — {especialidad}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Calendar size={15} className="text-blue-700 shrink-0" />
          <span>{fecha}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <Clock size={15} className="text-blue-700 shrink-0" />
          <span>{hora?.slice(0, 5)}</span>
        </div>
        {(turno?.id ?? turno?.numero) && (
          <p className="text-xs text-slate-400 pt-1">N.° de turno: <strong>{turno.id ?? turno.numero}</strong></p>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Reservar() {
  const [step, setStep] = useState(1);
  const [especialidad, setEspecialidad] = useState('');
  const [medico, setMedico] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [exito, setExito] = useState(null);

  const canNext = () => {
    if (step === 1) return !!especialidad;
    if (step === 2) return !!medico;
    if (step === 3) return !!fecha && !!hora;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Stethoscope size={24} className="text-blue-800" />
          <span className="text-lg font-extrabold text-blue-800">MiTurno Salud PRO</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {exito ? (
          <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
            <PantallaExito
              turno={exito.turno}
              especialidad={especialidad}
              medico={medico}
              fecha={fecha}
              hora={hora}
              nombre={exito.nombre ?? ''}
              email={exito.email ?? ''}
            />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
              <ProgressBar step={step} />

              {/* Resumen lateral (pasos 2-4) */}
              {step >= 2 && (
                <ResumenLateral
                  especialidad={especialidad}
                  medico={step >= 2 ? medico : null}
                  fecha={step >= 3 ? fecha : ''}
                  hora={step >= 3 ? hora : ''}
                />
              )}

              {step === 1 && (
                <Paso1
                  onSelect={(esp) => { setEspecialidad(esp); setStep(2); }}
                />
              )}
              {step === 2 && (
                <Paso2
                  especialidad={especialidad}
                  seleccionado={medico}
                  onSelect={(m) => { setMedico(m); setStep(3); }}
                />
              )}
              {step === 3 && (
                <Paso3
                  medico={medico}
                  fechaSel={fecha}
                  horaSel={hora}
                  onFechaChange={setFecha}
                  onHoraChange={setHora}
                />
              )}
              {step === 4 && (
                <Paso4
                  especialidad={especialidad}
                  medico={medico}
                  fecha={fecha}
                  hora={hora}
                  onExito={(data, nombre, email) => {
                    setExito({ turno: data, nombre: nombre ?? '', email: email ?? '' });
                  }}
                />
              )}

              {/* Navigation buttons */}
              {step < 4 && (
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext()}
                    className="flex items-center gap-1 px-6 py-2 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              )}
              {step === 4 && (
                <div className="mt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
