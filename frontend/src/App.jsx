import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Perfil from './pages/Perfil';

// Admin
import Dashboard from './pages/admin/Dashboard';
import Recepcion from './pages/admin/Recepcion';
import Turnos from './pages/admin/Turnos';
import Medicos from './pages/admin/Medicos';
import Pacientes from './pages/admin/Pacientes';
import Tarifas from './pages/admin/Tarifas';
import Reportes from './pages/admin/Reportes';
import Backups from './pages/admin/Backups';
import Pagos from './pages/admin/Pagos';
import ObrasSociales from './pages/admin/ObrasSociales';

// Médico
import TurnosHoy from './pages/medico/TurnosHoy';
import Agenda from './pages/medico/Agenda';
import MisPacientes from './pages/medico/MisPacientes';

// Paciente
import MisTurnos from './pages/paciente/MisTurnos';
import SolicitarTurno from './pages/paciente/SolicitarTurno';
import MedicosDisponibles from './pages/paciente/MedicosDisponibles';

// Público
import Reservar from './pages/Reservar';

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={`/${user.rol}`} />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.rol}`} /> : <Login />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="recepcion" element={<Recepcion />} />
        <Route path="turnos" element={<Turnos />} />
        <Route path="medicos" element={<Medicos />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="tarifas" element={<Tarifas />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="obras-sociales" element={<ObrasSociales />} />
        <Route path="backups" element={<Backups />} />
      </Route>

      {/* Médico */}
      <Route path="/medico" element={<ProtectedRoute roles={['medico']}><Layout /></ProtectedRoute>}>
        <Route index element={<TurnosHoy />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="pacientes" element={<MisPacientes />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* Paciente */}
      <Route path="/paciente" element={<ProtectedRoute roles={['paciente']}><Layout /></ProtectedRoute>}>
        <Route index element={<MisTurnos />} />
        <Route path="solicitar" element={<SolicitarTurno />} />
        <Route path="medicos" element={<MedicosDisponibles />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>

      {/* Público — sin auth */}
      <Route path="/reservar" element={<Reservar />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
