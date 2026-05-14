from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from decimal import Decimal


# ==================== AUTH ====================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    rol: str  # admin | medico | paciente


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    user_id: int


class RefreshRequest(BaseModel):
    refresh_token: str


class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str


# ==================== ADMINISTRADOR ====================

class AdminOut(BaseModel):
    id: int
    nombre: str
    email: str
    activo: bool
    model_config = {"from_attributes": True}


# ==================== MÉDICO ====================

class MedicoCreate(BaseModel):
    nombre: str
    email: EmailStr
    telefono: str = ""
    especialidad: str
    password: str
    duracion_consulta: int = 30


class MedicoUpdate(BaseModel):
    telefono: str | None = None
    especialidad: str | None = None
    duracion_consulta: int | None = None


class MedicoOut(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: str | None
    especialidad: str
    activo: bool
    duracion_consulta: int
    model_config = {"from_attributes": True}


# ==================== PACIENTE ====================

class PacienteCreate(BaseModel):
    nombre: str
    dni: str
    email: EmailStr
    telefono: str = ""
    fecha_nacimiento: date | None = None
    direccion: str = ""
    password: str
    obra_social_id: int | None = None
    numero_afiliado: str | None = None


class PacienteUpdate(BaseModel):
    telefono: str | None = None
    direccion: str | None = None
    notas_clinicas: str | None = None
    requiere_turno: bool | None = None
    obra_social_id: int | None = None
    numero_afiliado: str | None = None


class PacienteOut(BaseModel):
    id: int
    nombre: str
    dni: str | None
    email: str
    telefono: str | None
    fecha_nacimiento: date | None
    direccion: str | None
    notas_clinicas: str | None
    activo: bool
    requiere_turno: bool
    obra_social_id: int | None = None
    numero_afiliado: str | None = None
    model_config = {"from_attributes": True}


# ==================== TURNO ====================

class TurnoCreate(BaseModel):
    id_paciente: int
    id_medico: int
    fecha: date
    hora: time
    motivo: str = ""
    telefono_paciente: str = ""
    creado_por: str = "paciente"


class TurnoRecepcionCreate(BaseModel):
    nombre_paciente: str
    telefono_paciente: str
    id_medico: int
    fecha: date
    hora: time
    motivo: str = ""


class TurnoUpdate(BaseModel):
    estado: str | None = None
    nota_medica: str | None = None
    necesita_seguimiento: bool | None = None
    fecha: date | None = None
    hora: time | None = None


class TurnoOut(BaseModel):
    id: int
    id_paciente: int
    id_medico: int
    fecha: date
    hora: time
    estado: str
    motivo: str | None
    telefono_paciente: str | None
    nota_medica: str | None
    necesita_seguimiento: bool
    creado_por: str | None
    fecha_creacion: datetime | None
    paciente_nombre: str | None = None
    paciente_dni: str | None = None
    medico_nombre: str | None = None
    medico_especialidad: str | None = None
    precio_base: Decimal | None = None
    model_config = {"from_attributes": True}


class DisponibilidadRequest(BaseModel):
    id_medico: int
    fecha: date


class HorarioDisponible(BaseModel):
    hora: time
    disponible: bool


# ==================== TARIFA ====================

class TarifaUpdate(BaseModel):
    precio_base: Decimal


class TarifaOut(BaseModel):
    id: int
    especialidad: str
    precio_base: Decimal
    model_config = {"from_attributes": True}


# ==================== REPORTES ====================

class DashboardStats(BaseModel):
    total_turnos_mes: int
    completados: int
    cancelados: int
    ausentes: int
    programados: int
    ingresos_estimados: Decimal
    tasa_asistencia: float


class ReporteEspecialidad(BaseModel):
    especialidad: str
    completados: int
    ausentes: int
    cancelados: int
    precio_base: Decimal
    ingresos_estimados: Decimal


# ==================== OBRA SOCIAL ====================

class ObraSocialCreate(BaseModel):
    nombre: str
    codigo: str


class ObraSocialOut(BaseModel):
    id: int
    nombre: str
    codigo: str
    activo: bool
    model_config = {"from_attributes": True}


# ==================== PAGOS ====================

class PagoCreate(BaseModel):
    id_turno: int
    monto: Decimal
    metodo: str
    obra_social: str = ""
    notas: str = ""


class PagoUpdate(BaseModel):
    estado: str | None = None
    monto: Decimal | None = None
    metodo: str | None = None
    notas: str | None = None


class PagoOut(BaseModel):
    id: int
    id_turno: int
    monto: Decimal
    metodo: str
    obra_social: str
    estado: str
    notas: str | None
    fecha_pago: datetime | None
    model_config = {"from_attributes": True}
