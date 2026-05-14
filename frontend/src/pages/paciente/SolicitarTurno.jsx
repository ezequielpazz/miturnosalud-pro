import { useState, useEffect } from 'react';
import { getMedicos, getDisponibilidad, getTarifas, createTurno } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

const ESPECIALIDADES = ['Cardiologia','Pediatria','Traumatologia','Dermatologia','Clinica Medica','Neurologia','Ginecologia','Oftalmologia'];

export default function SolicitarTurno() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [especialidad, setEspecialidad] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [medicoId, setMedicoId] = useState(null);
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tarifas, setTarifas] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { getTarifas().then(r => setTarifas(r.data)); }, []);

  useEffect(() => {
    if (especialidad) getMedicos({ activo: true, especialidad }).then(r => setMedicos(r.data));
  }, [especialidad]);

  useEffect(() => {
    if (medicoId && fecha) getDisponibilidad({ id_medico: medicoId, fecha }).then(r => setHorarios(r.data));
  }, [medicoId, fecha]);

  const precio = tarifas.find(t => t.especialidad === especialidad)?.precio_base;

  const confirmar = async () => {
    try {
      await createTurno({ id_paciente: user.id, id_medico: medicoId, fecha, hora, motivo });
      navigate('/paciente');
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error al solicitar turno');
    }
  };

  const steps = ['Especialidad', 'Medico', 'Fecha y hora', 'Confirmar'];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Solicitar turno</h2>

      <div className="max-w-2xl mx-auto card p-6">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs font-semibold text-slate-500 hidden sm:block">{s}</span>
              {i < 3 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-400' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {msg && <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600">{msg}</div>}

        {/* Step 0: Especialidad */}
        {step === 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 mb-4">Selecciona una especialidad</h3>
            <div className="grid grid-cols-2 gap-3">
              {ESPECIALIDADES.map(e => (
                <button key={e} onClick={() => { setEspecialidad(e); setStep(1); }}
                  className="p-4 rounded-xl border-2 border-slate-100 hover:border-primary-500 hover:bg-primary-50 text-left transition-all">
                  <span className="font-semibold text-slate-800">{e}</span>
                  {tarifas.find(t => t.especialidad === e) && (
                    <p className="text-xs text-slate-400 mt-1">Precio: ${Number(tarifas.find(t => t.especialidad === e).precio_base).toLocaleString('es-AR')}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Médico */}
        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 mb-4">Selecciona un medico</h3>
            <p className="text-sm text-slate-400 mb-4">Especialidad: <span className="font-semibold text-primary-600">{especialidad}</span></p>
            {medicos.map(m => (
              <button key={m.id} onClick={() => { setMedicoId(m.id); setStep(2); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${medicoId === m.id ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-slate-200'} text-left transition-all`}>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  {m.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{m.nombre}</p>
                  <p className="text-xs text-slate-400">Tel: {m.telefono}</p>
                </div>
                {precio && <span className="text-sm font-bold text-slate-700">${Number(precio).toLocaleString('es-AR')}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Fecha y hora */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 mb-4">Selecciona fecha y hora</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field max-w-xs" min={new Date().toISOString().split('T')[0]} />
            </div>
            {horarios.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Horarios disponibles</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {horarios.map(h => (
                    <button key={h.hora} onClick={() => h.disponible && setHora(h.hora)} disabled={!h.disponible}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        hora === h.hora ? 'bg-primary-600 text-white' :
                        h.disponible ? 'bg-slate-50 text-slate-700 hover:bg-primary-50 hover:text-primary-600' :
                        'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                      }`}>
                      {h.hora}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Motivo de la consulta</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2} className="input-field resize-none" placeholder="Describe brevemente el motivo..." />
            </div>
          </div>
        )}

        {/* Step 3: Confirmar */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 mb-4">Confirmar turno</h3>
            <div className="bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Especialidad</span><span className="font-semibold">{especialidad}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Medico</span><span className="font-semibold">{medicos.find(m => m.id === medicoId)?.nombre}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Fecha</span><span className="font-semibold">{fecha}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Hora</span><span className="font-semibold">{hora}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Motivo</span><span className="font-semibold">{motivo || '—'}</span></div>
              {precio && <div className="flex justify-between text-sm border-t border-slate-200 pt-3"><span className="text-slate-500">Precio orientativo</span><span className="font-bold text-green-700">${Number(precio).toLocaleString('es-AR')}</span></div>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 btn-secondary py-3 text-sm"><ArrowLeft size={14} className="inline mr-2" />Volver</button>}
          {step === 2 && hora && <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3 text-sm">Siguiente <ArrowRight size={14} className="inline ml-2" /></button>}
          {step === 3 && <button onClick={confirmar} className="flex-1 btn-primary py-3 text-sm"><Check size={14} className="inline mr-2" />Confirmar turno</button>}
        </div>
      </div>
    </div>
  );
}
