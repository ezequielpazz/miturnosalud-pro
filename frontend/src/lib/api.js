import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const rt = localStorage.getItem('refresh_token');
      if (rt) {
        try {
          const res = await axios.post('/api/auth/refresh', { refresh_token: rt });
          localStorage.setItem('token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const cambiarPassword = (data) => api.put('/auth/cambiar-password', data);
export const refreshToken = (data) => api.post('/auth/refresh', data);

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

// Obras sociales
export const getObrasSociales = (params) => api.get('/obras-sociales/', { params });
export const createObraSocial = (data) => api.post('/obras-sociales/', data);
export const updateObraSocial = (id, data) => api.put(`/obras-sociales/${id}`, data);
export const toggleObraSocial = (id) => api.patch(`/obras-sociales/${id}/toggle`);

// Pagos
export const getPagos = (params) => api.get('/pagos/', { params });
export const createPago = (data) => api.post('/pagos/', data);
export const updatePago = (id, data) => api.put(`/pagos/${id}`, data);
export const getPagosPorTurno = (turnoId) => api.get(`/pagos/turno/${turnoId}`);

// Comprobantes
export const descargarComprobante = (turnoId) =>
  api.get(`/comprobantes/${turnoId}`, { responseType: 'blob' }).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_turno_${turnoId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  });

// Notificaciones
export const getNotificaciones = (params) => api.get('/notificaciones/', { params });
export const getNotificacionesCount = () => api.get('/notificaciones/count');
export const marcarLeida = (id) => api.put(`/notificaciones/${id}/leer`);
export const marcarTodasLeidas = () => api.put('/notificaciones/leer-todas');

// Archivos
export const getArchivos = (pacienteId) => api.get(`/archivos/paciente/${pacienteId}`);
export const uploadArchivo = (formData) => api.post('/archivos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadArchivo = (id) => api.get(`/archivos/download/${id}`, { responseType: 'blob' }).then(res => {
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers['content-disposition'];
  a.download = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : `archivo_${id}`;
  a.click();
  window.URL.revokeObjectURL(url);
});
export const deleteArchivo = (id) => api.delete(`/archivos/${id}`);

// 2FA
export const setup2FA = () => api.post('/auth/2fa/setup', {}, { responseType: 'blob' });
export const verify2FA = (code) => api.post('/auth/2fa/verify', { code });
export const disable2FA = () => api.post('/auth/2fa/disable');
export const login2FA = (data) => api.post('/auth/2fa/login', data);

// Sala de espera (público)
export const getTurnosHoyPublico = () => publicApi.get('/publico/turnos-hoy');

export default api;
