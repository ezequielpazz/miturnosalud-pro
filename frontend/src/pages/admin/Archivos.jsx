import { useState, useEffect, useRef, useCallback } from 'react';
import { getPacientes, getArchivos, uploadArchivo, downloadArchivo, deleteArchivo } from '../../lib/api';
import {
  Paperclip, Search, Upload, X, File, FileText, Image, Trash2, Download,
  Loader2, AlertCircle, FolderOpen, Plus
} from 'lucide-react';

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getIconByMime(mime) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  return File;
}

function getIconColor(mime) {
  if (!mime) return 'text-slate-400';
  if (mime.startsWith('image/')) return 'text-purple-500';
  if (mime.includes('pdf')) return 'text-red-500';
  return 'text-blue-500';
}

export default function Archivos() {
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [pacienteId, setPacienteId] = useState(null);
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!busqueda.trim()) {
      setPacientes([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getPacientes({ search: busqueda, limit: 10 });
        const data = res.data?.results || res.data || [];
        setPacientes(Array.isArray(data) ? data : []);
        setShowDropdown(true);
      } catch {
        setPacientes([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchArchivos = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoadingArchivos(true);
      const res = await getArchivos(id);
      const data = res.data?.results || res.data || [];
      setArchivos(Array.isArray(data) ? data : []);
    } catch {
      setArchivos([]);
    } finally {
      setLoadingArchivos(false);
    }
  }, []);

  const selectPaciente = (p) => {
    setPacienteId(p.id);
    setPacienteNombre(p.nombre || `${p.first_name || ''} ${p.last_name || ''}`.trim());
    setBusqueda('');
    setShowDropdown(false);
    fetchArchivos(p.id);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !pacienteId) return;
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('paciente_id', pacienteId);
    if (descripcion) formData.append('descripcion', descripcion);

    try {
      setUploading(true);
      setProgress(0);
      setError('');
      await uploadArchivo(formData, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setShowModal(false);
      setFile(null);
      setDescripcion('');
      setProgress(0);
      fetchArchivos(pacienteId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este archivo?')) return;
    try {
      setEliminando(id);
      await deleteArchivo(id);
      setArchivos((prev) => prev.filter((a) => a.id !== id));
    } catch {} finally {
      setEliminando(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Paperclip size={24} /> Archivos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestion de archivos de pacientes</p>
        </div>
        {pacienteId && (
          <button
            onClick={() => { setShowModal(true); setError(''); setFile(null); setDescripcion(''); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={18} /> Subir archivo
          </button>
        )}
      </div>

      {/* Buscador de paciente */}
      <div className="relative mb-6" ref={dropdownRef}>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente por nombre, DNI o email..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {loading && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
        </div>

        {showDropdown && pacientes.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
            {pacientes.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPaciente(p)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">{p.nombre || `${p.first_name || ''} ${p.last_name || ''}`.trim()}</p>
                <p className="text-sm text-slate-400">{p.email || p.dni || ''}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Paciente seleccionado */}
      {pacienteId && (
        <div className="flex items-center gap-3 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <FolderOpen size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Archivos de: <strong>{pacienteNombre}</strong></span>
          <button
            onClick={() => { setPacienteId(null); setPacienteNombre(''); setArchivos([]); }}
            className="ml-auto text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Lista de archivos */}
      {!pacienteId ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Search size={48} className="mb-4" />
          <p className="text-lg font-medium">Selecciona un paciente para ver sus archivos</p>
        </div>
      ) : loadingArchivos ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : archivos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <FolderOpen size={48} className="mb-4" />
          <p className="text-lg font-medium">No hay archivos</p>
          <p className="text-sm mt-1">Subi el primer archivo de este paciente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {archivos.map((a) => {
            const Icon = getIconByMime(a.tipo_mime || a.content_type);
            const color = getIconColor(a.tipo_mime || a.content_type);
            return (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate" title={a.nombre || a.filename}>{a.nombre || a.filename || 'Archivo'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatSize(a.tamanio || a.size)} &middot; {formatFecha(a.created_at || a.fecha)}</p>
                  </div>
                </div>
                {a.descripcion && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{a.descripcion}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadArchivo(a.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Download size={14} /> Descargar
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={eliminando === a.id}
                    className="flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-medium py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {eliminando === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de subida */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !uploading && setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subir archivo</h2>
              <button onClick={() => !uploading && setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : file
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                {file ? (
                  <div>
                    <File size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-slate-300 dark:text-slate-500 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Arrastra un archivo o hace clic para seleccionar</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripcion (opcional)</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Resultado de laboratorio"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-center">{progress}%</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={16} className="animate-spin" /> Subiendo...</> : <><Upload size={16} /> Subir</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
