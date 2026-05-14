import { useState, useEffect, useCallback } from 'react';
import { getMascotas, createMascota, updateMascota, getPacientes } from '../../lib/api';
import { PawPrint, Plus, X, Loader2, AlertCircle, Pencil } from 'lucide-react';

const ESPECIES = ['perro', 'gato', 'conejo', 'ave', 'reptil', 'otro'];

const EMPTY_FORM = {
  nombre: '',
  especie: '',
  raza: '',
  peso: '',
  fecha_nacimiento: '',
  id_dueno: '',
  notas: '',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

function FormMascota({ inicial, pacientes, onSubmit, loading, error }) {
  const [form, setForm] = useState(inicial ?? EMPTY_FORM);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-3 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre *</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Rex"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Especie *</label>
          <select
            name="especie"
            value={form.especie}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Seleccioná…</option>
            {ESPECIES.map((e) => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Raza</label>
          <input
            name="raza"
            value={form.raza}
            onChange={handleChange}
            placeholder="Labrador"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Peso (kg)</label>
          <input
            name="peso"
            type="number"
            step="0.1"
            min="0"
            value={form.peso}
            onChange={handleChange}
            placeholder="12.5"
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de nacimiento</label>
          <input
            name="fecha_nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Dueño</label>
          <select
            name="id_dueno"
            value={form.id_dueno}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Sin asignar</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Notas</label>
        <textarea
          name="notas"
          value={form.notas}
          onChange={handleChange}
          rows={3}
          placeholder="Alergias, condiciones especiales…"
          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Guardando…' : 'Guardar mascota'}
      </button>
    </form>
  );
}

export default function Mascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'nuevo' | { mascota }
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(() => {
    setLoading(true);
    Promise.all([
      getMascotas(),
      getPacientes(),
    ])
      .then(([mRes, pRes]) => {
        setMascotas(mRes.data);
        setPacientes(pRes.data);
      })
      .catch(() => setError('Error al cargar datos. Recargá la página.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async (form) => {
    setSaving(true);
    setSaveError('');
    try {
      if (modal?.mascota) {
        await updateMascota(modal.mascota.id, form);
      } else {
        await createMascota(form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      setSaveError(err.response?.data?.detail ?? 'Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const mascotasFiltradas = mascotas.filter((m) => {
    const q = busqueda.toLowerCase();
    return !q || m.nombre?.toLowerCase().includes(q) || m.especie?.toLowerCase().includes(q) || m.raza?.toLowerCase().includes(q);
  });

  const nombreDueno = (id) => pacientes.find((p) => String(p.id) === String(id))?.nombre ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint size={22} className="text-blue-800" />
          <h2 className="text-lg font-bold text-slate-900">Mascotas</h2>
        </div>
        <button
          onClick={() => { setSaveError(''); setModal('nuevo'); }}
          className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          <Plus size={16} /> Nueva mascota
        </button>
      </div>

      {/* Buscador */}
      <div>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, especie o raza…"
          className="w-full max-w-xs border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Estado */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Cargando mascotas…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Especie</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Raza</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Dueño</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Peso</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mascotasFiltradas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">{m.nombre}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{m.especie}</td>
                    <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{m.raza || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{nombreDueno(m.id_dueno)}</td>
                    <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{m.peso ? `${m.peso} kg` : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => { setSaveError(''); setModal({ mascota: m }); }}
                        className="text-slate-400 hover:text-blue-700 transition"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {mascotasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      {busqueda ? 'No se encontraron mascotas.' : 'Aún no hay mascotas registradas.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === 'nuevo' ? 'Nueva mascota' : `Editar: ${modal.mascota.nombre}`}
          onClose={() => setModal(null)}
        >
          <FormMascota
            inicial={modal === 'nuevo' ? EMPTY_FORM : {
              nombre: modal.mascota.nombre ?? '',
              especie: modal.mascota.especie ?? '',
              raza: modal.mascota.raza ?? '',
              peso: modal.mascota.peso ?? '',
              fecha_nacimiento: modal.mascota.fecha_nacimiento ?? '',
              id_dueno: modal.mascota.id_dueno ?? '',
              notas: modal.mascota.notas ?? '',
            }}
            pacientes={pacientes}
            onSubmit={handleSave}
            loading={saving}
            error={saveError}
          />
        </Modal>
      )}
    </div>
  );
}
