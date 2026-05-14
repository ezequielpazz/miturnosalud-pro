import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart, LayoutDashboard, Phone, CalendarDays, Users, UserCog, DollarSign,
  FileText, Database, CalendarClock, Calendar, User, PlusCircle, Stethoscope,
  Menu, X, LogOut, Bell
} from 'lucide-react';

const navConfig = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Panel de control', end: true },
    { to: '/admin/recepcion', icon: Phone, label: 'Recepcion' },
    { to: '/admin/turnos', icon: CalendarDays, label: 'Turnos' },
    { to: '/admin/medicos', icon: Stethoscope, label: 'Medicos' },
    { to: '/admin/pacientes', icon: Users, label: 'Pacientes' },
    { to: '/admin/tarifas', icon: DollarSign, label: 'Tarifas' },
    { to: '/admin/reportes', icon: FileText, label: 'Reportes' },
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rol = user?.rol || 'admin';
  const items = navConfig[rol] || [];

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
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col fixed h-full z-30">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">MiTurno Salud</h1>
              <span className="text-xs text-slate-400 font-medium">{roleLabels[rol]}</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <NavItems />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.nombre}</p>
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
          <aside className="relative w-72 bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Heart size={16} className="text-white" />
                </div>
                <span className="font-bold text-sm">MiTurno Salud</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4"><NavItems /></nav>
            <div className="p-4 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-red-500 py-2">
                <LogOut size={16} /> Cerrar sesion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
              <Menu size={24} />
            </button>
            <div />
            <div className="flex items-center gap-3">
              <button className="relative w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <Bell size={18} />
              </button>
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
