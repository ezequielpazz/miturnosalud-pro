import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { createReceta, downloadRecetaPDF } from '../../lib/api';

export default function RecetaModal({ turno, onClose }) {
  const [medicamentos, setMedicamentos] = useState([
    { nombre: '', dosis: '', frecuencia: '' },
  ]);
  const [indicaciones, setIndicaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMedicamento = () => {
    setMedicamentos([...medicamentos, { nombre: '', dosis: '', frecuencia: '' }]);
  };

  const removeMedicamento = (index) => {
    if (medicamentos.length === 1) return;
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const updateMedicamento = (index, field, value) => {
    const updated = [...medicamentos];
    updated[index] = { ...updated[index], [field]: value };
    setMedicamentos(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que al menos un medicamento tenga nombre
    const validMeds = medicamentos.filter(m => m.nombre.trim());
    if (validMeds.length === 0) {
      setError('Debe agregar al menos un medicamento');
      return;
    }

    setLoading(true);
    try {
      const res = await createReceta({
        id_turno: turno.id,
        id_paciente: turno.id_paciente,
        medicamentos: validMeds,
        indicaciones,
      });
      // Descargar PDF automaticamente
      await downloadRecetaPDF(res.data.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nueva Receta Medica</h2>
            <p className="text-sm text-slate-500 mt-0.5">Paciente: {turno.paciente_nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Medicamentos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
              <button
                type="button"
                onClick={addMedicamento}
                className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            <div className="space-y-3">
              {medicamentos.map((med, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Medicamento"
                      value={med.nombre}
                      onChange={(e) => updateMedicamento(i, 'nombre', e.target.value)}
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Dosis (ej: 500mg)"
                      value={med.dosis}
                      onChange={(e) => updateMedicamento(i, 'dosis', e.target.value)}
                      className="input-field text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Frecuencia (ej: c/8hs)"
                      value={med.frecuencia}
                      onChange={(e) => updateMedicamento(i, 'frecuencia', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedicamento(i)}
                    disabled={medicamentos.length === 1}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mt-1 ${
                      medicamentos.length === 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Indicaciones */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Indicaciones generales
            </label>
            <textarea
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              rows={3}
              className="input-field w-full resize-none text-sm"
              placeholder="Indicaciones adicionales para el paciente..."
              maxLength={1000}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2.5 flex-1 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-4 py-2.5 flex-1 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Generando...' : 'Crear Receta y Descargar PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
