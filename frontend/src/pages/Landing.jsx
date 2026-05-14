import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Heart, CalendarDays, Bell, Shield, FileText, CreditCard, Smartphone,
  ChevronRight, Check, Sun, Moon, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: CalendarDays, title: 'Gestion de turnos', desc: 'Agenda inteligente con disponibilidad en tiempo real' },
  { icon: Bell, title: 'Notificaciones', desc: 'Recordatorios automaticos por email a pacientes' },
  { icon: Shield, title: 'Seguridad', desc: '2FA, tokens seguros y encriptacion de datos' },
  { icon: FileText, title: 'Reportes', desc: 'Estadisticas detalladas y exportacion a PDF' },
  { icon: CreditCard, title: 'Facturacion', desc: 'Control de pagos, obras sociales y comprobantes' },
  { icon: Smartphone, title: 'PWA', desc: 'Instala la app en tu celular sin App Store' },
];

const plans = [
  {
    name: 'Basico',
    price: 25,
    tag: null,
    items: ['2 profesionales', 'Gestion de turnos', 'Notificaciones por email', 'Soporte por email'],
  },
  {
    name: 'Profesional',
    price: 60,
    tag: 'Popular',
    items: ['8 profesionales', 'Portal de reservas online', 'WhatsApp + email', 'Reportes avanzados', 'Obras sociales'],
  },
  {
    name: 'Clinica',
    price: 120,
    tag: null,
    items: ['Profesionales ilimitados', 'Multi-sucursal', 'Soporte prioritario 24/7', 'API personalizada', 'Backups automaticos'],
  },
];

export default function Landing() {
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
                <Heart size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">MiTurno Salud PRO</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Inicio</a>
              <a href="#funcionalidades" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Funcionalidades</a>
              <a href="#precios" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Precios</a>
              <a href="#contacto" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contacto</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={toggle} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2">
                Ingresar
              </Link>
              <Link to="/reservar" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all hover:scale-105">
                Reservar turno
              </Link>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-600 dark:text-slate-300">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 px-4 pb-4">
            <a href="#inicio" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Inicio</a>
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Funcionalidades</a>
            <a href="#precios" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Precios</a>
            <a href="#contacto" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-slate-600 dark:text-slate-300">Contacto</a>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={toggle} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300">Ingresar</Link>
              <Link to="/reservar" onClick={() => setMenuOpen(false)} className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl">Reservar turno</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="inicio" className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-100 font-medium">Plataforma activa 24/7</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Gestion de turnos medicos{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">inteligente</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              Optimiza tu clinica con un sistema que automatiza turnos, notifica pacientes y genera reportes en un clic
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/reservar" className="w-full sm:w-auto bg-white text-blue-900 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2">
                Empezar ahora <ChevronRight size={20} />
              </Link>
              <Link to="/login" className="w-full sm:w-auto border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                Ver demo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16 sm:mt-20">
            {[
              { value: '500+', label: 'Turnos gestionados' },
              { value: '98%', label: 'Satisfaccion' },
              { value: '24/7', label: 'Disponible' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-xs sm:text-sm text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-slate-950" />
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20 sm:py-28 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Funcionalidades</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">Todo lo que tu clinica necesita</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto">Herramientas profesionales para gestionar turnos, pacientes y facturacion en un solo lugar</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f) => (
              <div key={f.title} className="group p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <f.icon size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Precios</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-3">Planes para cada necesidad</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl mx-auto">Sin sorpresas, sin contratos largos. Cancela cuando quieras.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  p.tag
                    ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg'
                }`}
              >
                {p.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">{p.tag}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">${p.price}</span>
                  <span className="text-slate-400 dark:text-slate-500 ml-1">/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/reservar"
                  className={`block text-center font-semibold py-3 rounded-xl transition-all hover:scale-105 ${
                    p.tag
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Comenzar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Heart size={18} className="text-white" />
                </div>
                <span className="font-bold text-white">MiTurno Salud PRO</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Sistema de gestion de turnos medicos profesional para clinicas y consultorios.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
                <li><Link to="/reservar" className="hover:text-white transition-colors">Reservar turno</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#inicio" className="hover:text-white transition-colors">Sobre nosotros</a></li>
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Acceso profesionales</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>info@miturnosalud.com</li>
                <li>Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            &copy; 2026 MiTurno Salud PRO. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
