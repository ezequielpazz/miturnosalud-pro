import { useState, useEffect } from 'react';
import { getMedicos } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Phone, CalendarPlus } from 'lucide-react';

export default function MedicosDisponibles() {
  const [medicos, setMedicos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { getMedicos({ activo: true }).then(r => setMedicos(r.data)); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Medicos disponibles</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicos.map(m => (
          <div key={m.id} className="card p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Stethoscope size={28} className="text-primary-600" />
            </div>
            <h4 className="font-bold text-slate-900">{m.nombre}</h4>
            <span className="badge bg-primary-100 text-primary-700 mt-2 inline-block">{m.especialidad}</span>
            <p className="text-xs text-slate-400 mt-3"><Phone size={10} className="inline mr-1" />{m.telefono || '—'}</p>
            <button onClick={() => navigate('/paciente/solicitar')} className="btn-primary w-full py-2.5 text-sm mt-4">
              <CalendarPlus size={14} className="inline mr-2" />Solicitar turno
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
