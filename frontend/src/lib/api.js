import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const cambiarPassword = (data) => api.put('/auth/cambiar-password', data);

// Médicos
export const getMedicos = (params) => api.get('/medicos/', { params });
export const getMedico = (id) => api.get(`/medicos/${id}`);
export const createMedico = (data) => api.post('/medicos/', data);
export const updateMedico = (id, data) => api.put(`/medicos/${id}`, data);
export const toggleMedico = (id) => api.patch(`/medicos/${id}/toggle`);
export const getEspecialidades = () => api.get('/medicos/especialidades');

// Pacientes
export const getPacientes = (params) => api.get('/pacientes/', { params });
export const getPaciente = (id) => api.get(`/pacientes/${id}`);
export const createPaciente = (data) => api.post('/pacientes/', data);
export const updatePaciente = (id, data) => api.put(`/pacientes/${id}`, data);
export const togglePaciente = (id) => api.patch(`/pacientes/${id}/toggle`);
export const getPacientesPorMedico = (medicoId) => api.get(`/pacientes/medico/${medicoId}`);

// Turnos
export const getTurnos = (params) => api.get('/turnos/', { params });
export const getTurnosHoy = () => api.get('/turnos/hoy');
export const createTurno = (data) => api.post('/turnos/', data);
export const createTurnoRecepcion = (data) => api.post('/turnos/recepcion', data);
export const updateTurno = (id, data) => api.put(`/turnos/${id}`, data);
export const getDisponibilidad = (params) => api.get('/turnos/disponibilidad', { params });

// Tarifas
export const getTarifas = () => api.get('/tarifas/');
export const updateTarifa = (esp, data) => api.put(`/tarifas/${esp}`, data);

// Reportes
export const getDashboard = (params) => api.get('/reportes/dashboard', { params });
export const getReportePorEspecialidad = (params) => api.get('/reportes/por-especialidad', { params });

// Backups
export const getBackups = () => api.get('/backups/');
export const createBackup = () => api.post('/backups/');
export const restaurarBackup = (nombre) => api.post(`/backups/restaurar/${nombre}`);

// Mascotas
export const getMascotas = (params) => api.get('/mascotas/', { params });
export const createMascota = (data) => api.post('/mascotas/', data);
export const updateMascota = (id, data) => api.put(`/mascotas/${id}`, data);

// Portal público (sin auth)
const publicApi = axios.create({ baseURL: '/api' });
export const getEspecialidadesPublico = () => publicApi.get('/publico/especialidades');
export const getMedicosPublico = (especialidad) => publicApi.get('/publico/medicos', { params: { especialidad } });
export const getDisponibilidadPublico = (params) => publicApi.get('/publico/disponibilidad', { params });
export const reservarTurnoPublico = (data) => publicApi.post('/publico/reservar', data);

export default api;
