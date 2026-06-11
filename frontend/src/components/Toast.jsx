import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-green-50 dark:bg-green-950/60',
    border: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    text: 'text-green-800 dark:text-green-200',
    close: 'text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    text: 'text-red-800 dark:text-red-200',
    close: 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
    close: 'text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
    close: 'text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300',
  },
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

let toastId = 0;

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const timerRef = useRef(null);

  useEffect(() => {
    // Trigger slide-in on mount
    requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timerRef.current);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
        max-w-sm w-full pointer-events-auto
        transition-all duration-300 ease-out
        ${config.bg} ${config.border}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
    >
      <Icon size={18} className={`${config.iconColor} shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{toast.message}</p>
      <button
        onClick={handleDismiss}
        className={`${config.close} shrink-0 mt-0.5 transition-colors`}
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = ++toastId;
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      // Keep only the latest MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg) => addToast('success', msg),
      error: (msg) => addToast('error', msg),
      info: (msg) => addToast('info', msg),
      warning: (msg) => addToast('warning', msg),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — bottom-right, stacked vertically */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
