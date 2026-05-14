import { useState, useEffect, useRef } from 'react';
import { Heart, Clock, CalendarDays, User, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import { getTurnosHoyPublico } from '../lib/api';

const estadoConfig = {
  en_consulta: { label: 'En consulta', bg: 'bg-green-500', text: 'text-white' },
  completado: { label: 'Completado', bg: 'bg-green-600', text: 'text-white' },
  programado: { label: 'Programado', bg: 'bg-blue-500', text: 'text-white' },
  confirmado: { label: 'Confirmado', bg: 'bg-blue-500', text: 'text-white' },
  ausente: { label: 'Ausente', bg: 'bg-slate-500', text: 'text-white' },
  cancelado: { label: 'Cancelado', bg: 'bg-slate-500', text: 'text-white' },
};

function formatNombre(nombre) {
  if (!nombre) return '';
  const parts = nombre.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function formatHora(fecha) {
  if (!fecha) return '';
  try {
    const d = new Date(fecha);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fecha;
  }
}

const MOCK_TURNOS = [
  { id: 1, fecha_hora: new Date().toISOString(), paciente_nombre: 'Maria Garcia', medico_nombre: 'Dr. Rodriguez', especialidad: 'Cardiologia', estado: 'completado' },
  { id: 2, fecha_hora: new Date().toISOString(), paciente_nombre: 'Juan Lopez', medico_nombre: 'Dra. Martinez', especialidad: 'Dermatologia', estado: 'en_consulta' },
  { id: 3, fecha_hora: new Date(Date.now() + 1800000).toISOString(), paciente_nombre: 'Carlos Fernandez', medico_nombre: 'Dr. Rodriguez', especialidad: 'Cardiologia', estado: 'programado' },
  { id: 4, fecha_hora: new Date(Date.now() + 3600000).toISOString(), paciente_nombre: 'Ana Perez', medico_nombre: 'Dra. Martinez', especialidad: 'Dermatologia', estado: 'programado' },
  { id: 5, fecha_hora: new Date(Date.now() + 5400000).toISOString(), paciente_nombre: 'Roberto Diaz', medico_nombre: 'Dr. Sanchez', especialidad: 'Pediatria', estado: 'programado' },
  { id: 6, fecha_hora: new Date(Date.now() + 7200000).toISOString(), paciente_nombre: 'Laura Moreno', medico_nombre: 'Dr. Rodriguez', especialidad: 'Cardiologia', estado: 'programado' },
];

export default function SalaEspera() {
  const [turnos, setTurnos] = useState([]);
  const [reloj, setReloj] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [usandoMock, setUsandoMock] = useState(false);
  const wsRef = useRef(null);

  const fetchTurnos = async () => {
    try {
      const res = await getTurnosHoyPublico();
      const data = res.data?.results || res.data || [];
      setTurnos(Array.isArray(data) ? data : []);
      setError(false);
      setUsandoMock(false);
    } catch {
      if (turnos.length === 0 && !usandoMock) {
        setTurnos(MOCK_TURNOS);
        setUsandoMock(true);
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnos();
    const interval = setInterval(fetchTurnos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const wsUrl = `${protocol}://${host}:8000/ws/turnos`;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.tipo === 'turno_actualizado' || data.type === 'turno_actualizado') {
              fetchTurnos();
            }
          } catch {}
        };
        ws.onclose = () => {
          setTimeout(connect, 5000);
        };
        ws.onerror = () => {
          ws.close();
        };
      } catch {}
    }

    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const siguienteIdx = turnos.findIndex(
    (t) => t.estado === 'programado' || t.estado === 'confirmado'
  );

  const fechaHoy = reloj.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const horaStr = reloj.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 lg:px-10 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MiTurno Salud PRO</h1>
            <p className="text-sm text-slate-400">Sala de Espera</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {usandoMock && (
            <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-300 text-sm px-3 py-1 rounded-lg">
              <AlertCircle size={14} />
              <span>Datos de ejemplo</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-300">
            <Clock size={20} />
            <span className="text-3xl lg:text-4xl font-mono font-bold tabular-nums">{horaStr}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={48} className="animate-spin text-blue-400" />
          </div>
        ) : turnos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <CalendarDays size={64} className="mb-4" />
            <p className="text-2xl font-semibold">No hay turnos para hoy</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {turnos.map((turno, idx) => {
              const esSiguiente = idx === siguienteIdx;
              const cfg = estadoConfig[turno.estado] || estadoConfig.programado;
              return (
                <div
                  key={turno.id || idx}
                  className={`relative bg-slate-800 rounded-2xl p-5 lg:p-6 border transition-all ${
                    esSiguiente
                      ? 'border-blue-400 ring-2 ring-blue-400/30 animate-pulse-subtle'
                      : 'border-slate-700'
                  }`}
                >
                  {esSiguiente && (
                    <div className="absolute -top-2.5 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      SIGUIENTE
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">
                      {formatHora(turno.fecha_hora || turno.hora)}
                    </span>
                    <span className={`${cfg.bg} ${cfg.text} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-200">
                      <User size={18} className="text-slate-400 flex-shrink-0" />
                      <span className="text-lg font-semibold truncate">
                        {formatNombre(turno.paciente_nombre || turno.paciente?.nombre || 'Paciente')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Stethoscope size={16} className="flex-shrink-0" />
                      <span className="text-sm truncate">
                        {turno.medico_nombre || turno.medico?.nombre || 'Medico'} &mdash; {turno.especialidad || turno.medico?.especialidad || ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-6 lg:px-10 py-3 flex items-center justify-between flex-shrink-0 text-sm text-slate-400">
        <span className="capitalize">{fechaHoy}</span>
        <span>MiTurno Salud PRO &mdash; Sistema de gestion de turnos</span>
      </footer>

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(96, 165, 250, 0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
