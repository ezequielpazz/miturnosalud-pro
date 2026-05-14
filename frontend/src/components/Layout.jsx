import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Heart, LayoutDashboard, Phone, CalendarDays, Users, UserCog, DollarSign,
  FileText, Database, CalendarClock, Calendar, User, PlusCircle, Stethoscope,
  Menu, X, LogOut, Bell, Sun, Moon, CreditCard, Shield, Paperclip, Info
} from 'lucide-react';
import { getNotificacionesCount, getNotificaciones, marcarLeida, marcarTodasLeidas } from '../lib/api';

const navConfig = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Panel de control', end: true },
    { to: '/admin/recepcion', icon: Phone, label: 'Recepcion' },
    { to: '/admin/turnos', icon: CalendarDays, label: 'Turnos' },
    { to: '/admin/medicos', icon: Stethoscope, label: 'Medicos' },
    { to: '/admin/pacientes', icon: Users, label: 'Pacientes' },
    { to: '/admin/tarifas', icon: DollarSign, label: 'Tarifas' },
    { to: '/admin/reportes', icon: FileText, label: 'Reportes' },
    { to: '/admin/pagos', icon: CreditCard, label: 'Pagos' },
    { to: '/admin/obras-sociales', icon: Shield, label: 'Obras sociales' },
    { to: '/admin/archivos', icon: Paperclip, label: 'Archivos' },
    { to: '/admin/backups', icon: Database, label: 'Backups' },
  ],
  medico: [
    { to: '/medico', icon: CalendarClock, label: 'Turnos de hoy', end: true },
    { to: '/medico/agenda', icon: Calendar, label: 'Mi agenda' },
    { to: '/medico/pacientes', icon: Users, label: 'Mis pacientes' },
    { to: '/medico/perfil', icon: User, label: 'Mi perfil' },
  ],
  paciente: [
    { to: '/paciente', icon: CalendarDays, label: 'Mis turnos', end: true },
    { to: '/paciente/solicitar', icon: PlusCircle, label: 'Solicitar turno' },
    { to: '/paciente/medicos', icon: Stethoscope, label: 'Medicos disponibles' },
    { to: '/paciente/perfil', icon: User, label: 'Mi perfil' },
  ],
};

const roleLabels = { admin: 'ADMINISTRADOR', medico: 'MEDICO', paciente: 'PACIENTE' };

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const notifRef = useRef(null);
  const rol = user?.rol || 'admin';
  const items = navConfig[rol] || [];

  useEffect(() => {
    const fetchCount = () => {
      getNotificacionesCount().then(r => setNotifCount(r.data.no_leidas)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notifOpen) {
      getNotificaciones({ solo_no_leidas: false }).then(r => setNotifs(r.data?.slice(0, 10) || [])).catch(() => {});
    }
  }, [notifOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarcarTodas = () => {
    marcarTodasLeidas().then(() => { setNotifCount(0); setNotifs(n => n.map(x => ({ ...x, leida: true }))); }).catch(() => {});
  };

  const handleLeerUna = (id) => {
    marcarLeida(id).then(() => {
      setNotifs(n => n.map(x => x.id === id ? { ...x, leida: true } : x));
      setNotifCount(c => Math.max(0, c - 1));
    }).catch(() => {});
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavItems = () => (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col fixed h-full z-30">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-sm">MiTurno Salud</h1>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">{roleLabels[rol]}</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.nombre}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors py-2">
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <span className="font-bold text-sm dark:text-white">MiTurno Salud</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4"><NavItems /></nav>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-red-500 py-2">
                <LogOut size={16} /> Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-slate-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
              <Menu size={24} />
            </button>
            <div />
            <div className="flex items-center gap-3">
              <button onClick={toggle} className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-all">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600 transition-all">
                  <Bell size={18} />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Notificaciones</span>
                      {notifCount > 0 && (
                        <button onClick={handleMarcarTodas} className="text-xs text-blue-600 hover:text-blue-800">Marcar todas</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
                      {notifs.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400 text-center">Sin notificaciones</p>
                      ) : notifs.map(n => (
                        <div key={n.id} onClick={() => handleLeerUna(n.id)} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!n.leida ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.tipo === 'turno' ? 'bg-blue-100 text-blue-600' : n.tipo === 'pago' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            {n.tipo === 'turno' ? <CalendarDays size={14} /> : n.tipo === 'pago' ? <CreditCard size={14} /> : <Info size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{n.titulo}</p>
                            <p className="text-xs text-slate-400 truncate">{n.mensaje}</p>
                          </div>
                          {!n.leida && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
