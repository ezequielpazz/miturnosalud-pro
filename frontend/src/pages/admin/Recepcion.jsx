import { useState, useEffect } from 'react';
import { getTurnosHoy, getMedicos, createTurnoRecepcion, updateTurno, getDisponibilidad } from '../../lib/api';
import { Phone, PlusCircle, Check, X, RefreshCw } from 'lucide-react';

const statusBadge = {
  programado: 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
  ausente: 'bg-amber-100 text-amber-700',
};

export default function Recepcion() {
  const [turnos, setTurnos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [form, setForm] = useState({ nombre_paciente: '', telefono_paciente: '', id_medico: '', fecha: '', hora: '', motivo: '' });
  const [msg, setMsg] = useState('');

  const cargar = () => {
    getTurnosHoy().then(r => setTurnos(r.data));
  };

  useEffect(() => {
    cargar();
    getMedicos({ activo: true }).then(r => setMedicos(r.data));
  }, []);

  useEffect(() => {
    if (form.id_medico && form.fecha) {
      getDisponibilidad({ id_medico: form.id_medico, fecha: form.fecha }).then(r => setHorarios(r.data));
    }
  }, [form.id_medico, form.fecha]);

  const agendar = async (e) => {
    e.preventDefault();
    try {
      await createTurnoRecepcion({ ...form, id_medico: Number(form.id_medico) });
      setMsg('Turno agendado correctamente');
      setForm({ nombre_paciente: '', telefono_paciente: '', id_medico: '', fecha: '', hora: '', motivo: '' });
      cargar();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error al agendar');
    }
  };

  const cambiarEstado = async (id, estado) => {
    await updateTurno(id, { estado });
    cargar();
  };

  const pendientes = turnos.filter(t => t.estado === 'programado').length;
  const completados = turnos.filter(t => t.estado === 'completado').length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Recepcion</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <PlusCircle size={18} className="text-primary-600" /> Agendar turno
          </h3>
          {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}
          <form onSubmit={agendar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre del paciente</label>
              <input value={form.nombre_paciente} onChange={e => setForm({...form, nombre_paciente: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Telefono</label>
              <input value={form.telefono_paciente} onChange={e => setForm({...form, telefono_paciente: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Medico</label>
              <select value={form.id_medico} onChange={e => setForm({...form, id_medico: e.target.value})} className="input-field" required>
                <option value="">Seleccionar...</option>
                {medicos.map(m => <option key={m.id} value={m.id}>{m.nombre} — {m.especialidad}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Hora</label>
                <select value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar...</option>
                  {horarios.filter(h => h.disponible).map(h => <option key={h.hora} value={h.hora}>{h.hora}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Motivo</label>
              <textarea value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} rows={2} className="input-field resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-sm">
              <Check size={16} className="inline mr-2" /> Confirmar turno
            </button>
          </form>
        </div>

        {/* Today's list */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Phone size={18} className="text-primary-600" /> Sala de espera — Hoy
            </h3>
            <div className="flex gap-2 items-center">
              <span className="badge bg-green-100 text-green-700">{completados} atendidos</span>
              <span className="badge bg-slate-100 text-slate-600">{pendientes} pendientes</span>
              <button onClick={cargar} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="px-5 py-3 text-left font-semibold">Hora</th>
                  <th className="px-5 py-3 text-left font-semibold">Paciente</th>
                  <th className="px-5 py-3 text-left font-semibold">Medico</th>
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-700">{t.hora?.slice(0, 5)}</td>
                    <td className="px-5 py-3 font-medium">{t.paciente_nombre}</td>
                    <td className="px-5 py-3 text-slate-500">{t.medico_nombre}</td>
                    <td className="px-5 py-3"><span className={`badge ${statusBadge[t.estado]}`}>{t.estado}</span></td>
                    <td className="px-5 py-3 text-right">
                      {t.estado === 'programado' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => cambiarEstado(t.id, 'completado')} className="text-green-600 hover:text-green-700 text-xs font-semibold">
                            <Check size={14} className="inline mr-1" />Confirmar
                          </button>
                          <button onClick={() => cambiarEstado(t.id, 'ausente')} className="text-amber-600 hover:text-amber-700 text-xs font-semibold">Ausente</button>
                          <button onClick={() => cambiarEstado(t.id, 'cancelado')} className="text-red-400 hover:text-red-600 text-xs font-semibold">
                            <X size={14} className="inline mr-1" />Cancelar
                          </button>
                        </div>
                      )}
                      {t.estado !== 'programado' && <span className="text-slate-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {turnos.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">No hay turnos para hoy</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
