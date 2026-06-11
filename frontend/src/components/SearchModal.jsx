import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Users, Stethoscope, CalendarDays, X, Loader2 } from 'lucide-react';
import { busquedaGlobal } from '../lib/api';

export default function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ pacientes: [], medicos: [], turnos: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const rol = user?.rol || 'admin';
  const debounceRef = useRef(null);

  // Build flat list of all results for keyboard navigation
  const flatItems = [];
  if (results.pacientes.length > 0) {
    flatItems.push({ type: 'header', label: 'Pacientes' });
    results.pacientes.forEach(p => flatItems.push({ type: 'paciente', data: p }));
  }
  if (results.medicos.length > 0) {
    flatItems.push({ type: 'header', label: 'Medicos' });
    results.medicos.forEach(m => flatItems.push({ type: 'medico', data: m }));
  }
  if (results.turnos.length > 0) {
    flatItems.push({ type: 'header', label: 'Turnos' });
    results.turnos.forEach(t => flatItems.push({ type: 'turno', data: t }));
  }

  const selectableItems = flatItems.filter(i => i.type !== 'header');

  // Autofocus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults({ pacientes: [], medicos: [], turnos: [] });
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback((q) => {
    if (!q.trim()) {
      setResults({ pacientes: [], medicos: [], turnos: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    busquedaGlobal(q.trim())
      .then(res => {
        setResults(res.data);
        setActiveIndex(0);
      })
      .catch(() => setResults({ pacientes: [], medicos: [], turnos: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults({ pacientes: [], medicos: [], turnos: [] });
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // Navigate on select
  const handleSelect = (item) => {
    onClose();
    if (item.type === 'paciente') {
      navigate(rol === 'medico' ? '/medico/pacientes' : '/admin/pacientes');
    } else if (item.type === 'medico') {
      navigate('/admin/medicos');
    } else if (item.type === 'turno') {
      navigate(rol === 'medico' ? '/medico/agenda' : '/admin/turnos');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (selectableItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % selectableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + selectableItems.length) % selectableItems.length);
    } else if (e.key === 'Enter' && selectableItems[activeIndex]) {
      e.preventDefault();
      handleSelect(selectableItems[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = selectableItems.length > 0;

  let selectableIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          {loading ? (
            <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar pacientes, medicos o turnos..."
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {!hasQuery && (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">
              Escribe para buscar pacientes, medicos o turnos...
            </p>
          )}

          {hasQuery && !loading && !hasResults && (
            <p className="px-4 py-8 text-sm text-slate-400 text-center">
              No se encontraron resultados para "{query}"
            </p>
          )}

          {hasResults && flatItems.map((item, i) => {
            if (item.type === 'header') {
              return (
                <div key={`h-${item.label}`} className="px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                  {item.label}
                </div>
              );
            }

            selectableIdx++;
            const isActive = selectableIdx === activeIndex;
            const idx = selectableIdx;

            if (item.type === 'paciente') {
              const p = item.data;
              return (
                <div
                  key={`p-${p.id}`}
                  data-active={isActive}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{p.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">DNI: {p.dni} &middot; {p.email}</p>
                  </div>
                </div>
              );
            }

            if (item.type === 'medico') {
              const m = item.data;
              return (
                <div
                  key={`m-${m.id}`}
                  data-active={isActive}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <Stethoscope size={14} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{m.especialidad}</p>
                  </div>
                </div>
              );
            }

            if (item.type === 'turno') {
              const t = item.data;
              const estadoColor = {
                programado: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
                completado: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
                cancelado: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
                ausente: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
              };
              return (
                <div
                  key={`t-${t.id}`}
                  data-active={isActive}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <CalendarDays size={14} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {t.paciente_nombre} &middot; Dr. {t.medico_nombre}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{t.fecha} {t.hora}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoColor[t.estado] || 'text-slate-500 bg-slate-100'}`}>
                    {t.estado}
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">&uarr;&darr;</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">Enter</kbd>
            seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">Esc</kbd>
            cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
