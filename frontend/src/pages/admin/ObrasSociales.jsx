import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getObrasSociales, createObraSocial, updateObraSocial, toggleObraSocial } from '../../lib/api';
import { Shield, Plus, Pencil, X, Loader2 } from 'lucide-react';

export default function ObrasSociales() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', codigo: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['obras-sociales'],
    queryFn: () => getObrasSociales(),
  });

  const obras = data?.data || [];

  const crearMut = useMutation({
    mutationFn: createObraSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras-sociales'] });
      cerrarModal();
    },
  });

  const editarMut = useMutation({
    mutationFn: ({ id, data }) => updateObraSocial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras-sociales'] });
      cerrarModal();
    },
  });

  const toggleMut = useMutation({
    mutationFn: toggleObraSocial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['obras-sociales'] }),
  });

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    setForm({ nombre: '', codigo: '' });
  };

  const abrirEditar = (obra) => {
    setEditando(obra);
    setForm({ nombre: obra.nombre, codigo: obra.codigo || '' });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editando) {
      editarMut.mutate({ id: editando.id, data: form });
    } else {
      crearMut.mutate(form);
    }
  };

  const isSaving = crearMut.isPending || editarMut.isPending;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">Error al cargar las obras sociales. Intente nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Obras Sociales</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion de obras sociales y prepagas</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nueva obra social
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : obras.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Shield size={40} className="mx-auto mb-3 opacity-50" />
            <p>No hay obras sociales registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Nombre</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Codigo</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Estado</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {obras.map(obra => (
                  <tr key={obra.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{obra.nombre}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{obra.codigo || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${obra.activo !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {obra.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(obra)}
                          className="text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleMut.mutate(obra.id)}
                          className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                            obra.activo !== false
                              ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                          }`}
                        >
                          {obra.activo !== false ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cerrarModal} />
          <div className="relative card p-6 w-full max-w-md dark:bg-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editando ? 'Editar obra social' : 'Nueva obra social'}
              </h2>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Codigo</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="btn-secondary px-4 py-2.5 flex-1 text-sm dark:border-slate-600 dark:text-slate-300">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary px-4 py-2.5 flex-1 text-sm flex items-center justify-center gap-2">
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {editando ? 'Guardar' : 'Crear'}
                </button>
              </div>
              {(crearMut.isError || editarMut.isError) && (
                <p className="text-sm text-red-500 dark:text-red-400">Error al guardar. Intente nuevamente.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
