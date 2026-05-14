import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPagos, createPago, updatePago, descargarComprobante } from '../../lib/api';
import { DollarSign, Plus, Download, CheckCircle, Clock, X, Loader2 } from 'lucide-react';

const metodos = ['efectivo', 'tarjeta', 'transferencia'];
const estados = ['pendiente', 'pagado'];

export default function Pagos() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filtros, setFiltros] = useState({ fecha_desde: '', fecha_hasta: '', estado: '' });
  const [form, setForm] = useState({ id_turno: '', monto: '', metodo: 'efectivo', obra_social: '', notas: '' });

  const params = {};
  if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
  if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
  if (filtros.estado) params.estado = filtros.estado;

  const { data, isLoading, error } = useQuery({
    queryKey: ['pagos', params],
    queryFn: () => getPagos(params),
  });

  const pagos = data?.data || [];

  const totalCobrado = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.monto || 0), 0);
  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + Number(p.monto || 0), 0);

  const crearMut = useMutation({
    mutationFn: createPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      setModalOpen(false);
      setForm({ id_turno: '', monto: '', metodo: 'efectivo', obra_social: '', notas: '' });
    },
  });

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, estado }) => updatePago(id, { estado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pagos'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    crearMut.mutate({
      id_turno: Number(form.id_turno),
      monto: Number(form.monto),
      metodo: form.metodo,
      obra_social: form.obra_social || null,
      notas: form.notas || null,
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">Error al cargar los pagos. Intente nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pagos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion de facturacion y cobros</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Registrar pago
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total cobrado</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">${totalCobrado.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total pendiente</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">${totalPendiente.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Desde"
          />
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            placeholder="Hasta"
          />
          <select
            value={filtros.estado}
            onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">Todos los estados</option>
            {estados.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <DollarSign size={40} className="mx-auto mb-3 opacity-50" />
            <p>No se encontraron pagos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">ID</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Fecha</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Paciente</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Medico</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Monto</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Metodo</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Obra Social</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Estado</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map(pago => (
                  <tr key={pago.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">#{pago.id}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{pago.paciente_nombre || '-'}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{pago.medico_nombre || '-'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">${Number(pago.monto || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300 capitalize">{pago.metodo || '-'}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{pago.obra_social || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${pago.estado === 'pagado' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {pago.estado === 'pendiente' && (
                          <button
                            onClick={() => cambiarEstadoMut.mutate({ id: pago.id, estado: 'pagado' })}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            title="Marcar como pagado"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => descargarComprobante(pago.id_turno || pago.id)}
                          className="text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400"
                          title="Descargar comprobante"
                        >
                          <Download size={16} />
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative card p-6 w-full max-w-md dark:bg-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registrar pago</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Turno</label>
                <input
                  type="number"
                  value={form.id_turno}
                  onChange={e => setForm(f => ({ ...f, id_turno: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metodo de pago</label>
                <select
                  value={form.metodo}
                  onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  {metodos.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Obra social</label>
                <input
                  type="text"
                  value={form.obra_social}
                  onChange={e => setForm(f => ({ ...f, obra_social: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-4 py-2.5 flex-1 text-sm dark:border-slate-600 dark:text-slate-300">
                  Cancelar
                </button>
                <button type="submit" disabled={crearMut.isPending} className="btn-primary px-4 py-2.5 flex-1 text-sm flex items-center justify-center gap-2">
                  {crearMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Registrar
                </button>
              </div>
              {crearMut.isError && (
                <p className="text-sm text-red-500 dark:text-red-400">Error al registrar el pago.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
