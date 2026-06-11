import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { refreshToken } from '../lib/api';

const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before expiry
const CHECK_INTERVAL_MS = 30 * 1000; // check every 30 seconds

function decodeTokenPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(5);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const checkExpiration = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = decodeTokenPayload(token);
    if (!payload || !payload.exp) return;

    const now = Date.now();
    const expiresAt = payload.exp * 1000;
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) {
      handleLogout();
      return;
    }

    if (timeLeft <= WARNING_BEFORE_MS) {
      setMinutesLeft(Math.max(1, Math.ceil(timeLeft / 60000)));
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    checkExpiration();
    intervalRef.current = setInterval(checkExpiration, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [checkExpiration]);

  const handleContinue = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      const res = await refreshToken({ refresh_token: refresh });
      localStorage.setItem('token', res.data.access_token);
      if (res.data.refresh_token) {
        localStorage.setItem('refresh_token', res.data.refresh_token);
      }
      setShowWarning(false);
    } catch {
      handleLogout();
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Warning header bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert size={28} className="text-amber-500" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Sesion por expirar
          </h2>

          {/* Message */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Tu sesion expirara en{' '}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {minutesLeft} {minutesLeft === 1 ? 'minuto' : 'minutos'}
            </span>
            . Deseas continuar?
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cerrar sesion
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
            >
              Continuar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
