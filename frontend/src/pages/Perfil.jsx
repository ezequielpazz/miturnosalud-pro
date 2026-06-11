import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cambiarPassword, guardarFirma, obtenerFirma, exportarDatosPaciente } from '../lib/api';
import { useToast } from '../components/Toast';
import { User, Lock, Save, PenTool, FileDown } from 'lucide-react';
import SignatureCanvas from '../components/SignatureCanvas';

export default function Perfil() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ password_actual: '', password_nueva: '' });
  const [msg, setMsg] = useState('');
  const [firmaExistente, setFirmaExistente] = useState(null);
  const [loadingFirma, setLoadingFirma] = useState(false);

  const isMedico = user?.rol === 'medico';
  const isPaciente = user?.rol === 'paciente';
  const [exportando, setExportando] = useState(false);

  const handleExportarDatos = async () => {
    setExportando(true);
    try {
      const res = await exportarDatosPaciente();
      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis_datos_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Datos exportados correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al exportar datos');
    } finally {
      setExportando(false);
    }
  };

  useEffect(() => {
    if (isMedico) {
      setLoadingFirma(true);
      obtenerFirma()
        .then((res) => {
          if (res.data.firma) setFirmaExistente(res.data.firma);
        })
        .catch(() => {})
        .finally(() => setLoadingFirma(false));
    }
  }, [isMedico]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cambiarPassword(form);
      setMsg('Contrasena actualizada correctamente');
      setForm({ password_actual: '', password_nueva: '' });
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleGuardarFirma = async (base64) => {
    try {
      await guardarFirma(base64);
      setFirmaExistente(base64);
      toast.success('Firma digital guardada correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar la firma');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mi perfil</h2>

      <div className="max-w-lg">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={28} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{user?.nombre}</h3>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="badge bg-primary-100 text-primary-700 mt-1 inline-block">{user?.rol}</span>
            </div>
          </div>

          {user?.telefono && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Telefono: {user.telefono}</p>}
          {user?.especialidad && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Especialidad: {user.especialidad}</p>}
          {user?.dni && <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">DNI: {user.dni}</p>}
          {user?.direccion && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Direccion: {user.direccion}</p>}

          <h4 className="font-bold text-slate-900 dark:text-white mt-6 mb-4 flex items-center gap-2"><Lock size={16} />Cambiar contrasena</h4>
          {msg && <div className={`mb-4 p-3 rounded-xl text-sm ${msg.includes('Error') || msg.includes('incorrecta') ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400'}`}>{msg}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">Contrasena actual</label><input type="password" value={form.password_actual} onChange={e => setForm({...form, password_actual: e.target.value})} className="input-field" required /></div>
            <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nueva contrasena</label><input type="password" value={form.password_nueva} onChange={e => setForm({...form, password_nueva: e.target.value})} className="input-field" required /></div>
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm"><Save size={14} className="inline mr-2" />Guardar</button>
          </form>
        </div>

        {isMedico && (
          <div className="card p-6 mt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PenTool size={16} className="text-primary-600" />
              Firma Digital
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Su firma aparecera en las recetas medicas que emita. Dibuje su firma en el recuadro de abajo.
            </p>

            {loadingFirma ? (
              <div className="h-[200px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : (
              <SignatureCanvas
                onSave={handleGuardarFirma}
                initialSignature={firmaExistente}
              />
            )}

            {firmaExistente && (
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 mb-2">Firma guardada actualmente:</p>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 inline-block">
                  <img
                    src={firmaExistente.startsWith('data:') ? firmaExistente : `data:image/png;base64,${firmaExistente}`}
                    alt="Firma digital del medico"
                    className="max-h-24 w-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {isPaciente && (
          <div className="card p-6 mt-6">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileDown size={16} className="text-primary-600" />
              Mis datos
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Podes descargar todos tus datos almacenados en formato JSON
            </p>
            <button
              onClick={handleExportarDatos}
              disabled={exportando}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              <FileDown size={14} className="inline mr-2" />
              {exportando ? 'Exportando...' : 'Descargar mis datos (JSON)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
