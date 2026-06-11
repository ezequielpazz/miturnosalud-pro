import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Phone, CalendarDays, Users, DollarSign,
  FileText, Database, CalendarClock, Calendar, User, PlusCircle, Stethoscope,
  Menu, X, LogOut, Bell, Sun, Moon, CreditCard, Shield, Paperclip, Info,
  Search, ChevronRight, Clock
} from 'lucide-react';
import Logo from './Logo';
import SearchModal from './SearchModal';
import SessionTimeout from './SessionTimeout';
import { getNotificacionesCount, getNotificaciones, marcarLeida, marcarTodasLeidas } from '../lib/api';

const navConfig = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
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
    { to: '/medico/agenda/config', icon: Clock, label: 'Configurar horarios' },
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

const roleLabels = { admin: 'Administrador', medico: 'Medico', paciente: 'Paciente' };

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function nameToColor(name) {
  if (!name) return 'bg-slate-500';
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const notifRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const rol = user?.rol || 'admin';
  const items = navConfig[rol] || [];

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Desktop Sidebar — Navy */}
      <aside className="hidden md:flex w-64 flex-col fixed h-full z-30"
        style={{ background: 'linear-gradient(180deg, #1a2542 0%, #111a33 100%)' }}>
        {/* Logo */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <Logo size={40} pulse />
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide">MiTurno Salud</h1>
              <span className="text-[10px] text-blue-300/70 font-medium uppercase tracking-widest">{roleLabels[rol]}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-white/10 mb-2" />

        {/* Nav */}
        <nav className="flex-1 py-1 overflow-y-auto space-y-0.5">
          <NavItems />
        </nav>

        {/* User section */}
        <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 ${nameToColor(user?.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(user?.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nombre}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors py-1.5 px-1">
            <LogOut size={15} /> Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar — Navy */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full shadow-2xl flex flex-col"
            style={{ background: 'linear-gradient(180deg, #1a2542 0%, #111a33 100%)' }}>
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size={36} pulse />
                <span className="font-bold text-sm text-white">MiTurno Salud</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="mx-5 border-t border-white/10 mb-2" />
            <nav className="flex-1 py-1 space-y-0.5"><NavItems /></nav>
            <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-red-400 py-2 px-1">
                <LogOut size={15} /> Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-8 py-3">
            {/* Left: hamburger + search */}
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                <Menu size={22} />
              </button>
              <div
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 flex-1 max-w-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Search size={16} className="text-slate-400" />
                <span className="text-sm text-slate-400 flex-1">Buscar pacientes, turnos...</span>
                <kbd className="hidden lg:inline text-[10px] text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono">Ctrl+K</kbd>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <Bell size={17} />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">{notifCount > 9 ? '9+' : notifCount}</span>
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

              {/* User avatar in header */}
              <div className="hidden md:flex items-center gap-2.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className={`w-8 h-8 ${nameToColor(user?.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {getInitials(user?.nombre)}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-slate-700 dark:text-white leading-tight">{user?.nombre?.split(' ')[0]}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{roleLabels[rol]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SessionTimeout />
    </div>
  );
}
