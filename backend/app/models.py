from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Time, DateTime, Text,
    ForeignKey, Numeric, Enum as SAEnum, func
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class RolUsuario(str, enum.Enum):
    ADMIN = "admin"
    MEDICO = "medico"
    PACIENTE = "paciente"


class EstadoTurno(str, enum.Enum):
    PROGRAMADO = "programado"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"
    AUSENTE = "ausente"


class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    totp_secret = Column(String(32), nullable=True)
    totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Medico(Base):
    __tablename__ = "medicos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    telefono = Column(String(20))
    especialidad = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    duracion_consulta = Column(Integer, default=30)  # minutos
    totp_secret = Column(String(32), nullable=True)
    totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    turnos = relationship("Turno", back_populates="medico")


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    dni = Column(String(15), unique=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    telefono = Column(String(20))
    fecha_nacimiento = Column(Date, nullable=True)
    direccion = Column(String(200))
    notas_clinicas = Column(Text, default="")
    password_hash = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    requiere_turno = Column(Boolean, default=False)
    obra_social_id = Column(Integer, ForeignKey("obras_sociales.id"), nullable=True)
    numero_afiliado = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    obra_social = relationship("ObraSocial")

    turnos = relationship("Turno", back_populates="paciente")


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    id_paciente = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    id_medico = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    fecha = Column(Date, nullable=False, index=True)
    hora = Column(Time, nullable=False)
    estado = Column(
        SAEnum(EstadoTurno),
        default=EstadoTurno.PROGRAMADO,
        nullable=False
    )
    motivo = Column(String(300))
    telefono_paciente = Column(String(20))
    nota_medica = Column(Text, default="")
    necesita_seguimiento = Column(Boolean, default=False)
    creado_por = Column(String(20), default="paciente")  # paciente | recepcion | admin
    fecha_creacion = Column(DateTime, server_default=func.now())

    paciente = relationship("Paciente", back_populates="turnos")
    medico = relationship("Medico", back_populates="turnos")


class Tarifa(Base):
    __tablename__ = "tarifas"

    id = Column(Integer, primary_key=True, index=True)
    especialidad = Column(String(50), unique=True, nullable=False)
    precio_base = Column(Numeric(12, 2), nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    usuario_email = Column(String(150), nullable=False)
    usuario_rol = Column(String(20), nullable=False)
    accion = Column(String(50), nullable=False)
    detalle = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Mascota(Base):
    __tablename__ = "mascotas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    especie = Column(String(50), nullable=False)
    raza = Column(String(100), default="")
    peso_kg = Column(Numeric(5, 2), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    notas = Column(Text, default="")
    activo = Column(Boolean, default=True)
    id_dueno = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    dueno = relationship("Paciente", backref="mascotas")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    user_email = Column(String(150), nullable=False)
    user_rol = Column(String(20), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class ObraSocial(Base):
    __tablename__ = "obras_sociales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Pago(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    id_turno = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    metodo = Column(String(30), nullable=False)
    obra_social = Column(String(100), default="")
    estado = Column(String(20), default="pendiente")
    notas = Column(Text, default="")
    fecha_pago = Column(DateTime, server_default=func.now())
    turno = relationship("Turno", backref="pagos")


class Archivo(Base):
    __tablename__ = "archivos"
    id = Column(Integer, primary_key=True, index=True)
    nombre_original = Column(String(255), nullable=False)
    nombre_almacenado = Column(String(255), nullable=False, unique=True)
    tipo_mime = Column(String(100), nullable=False)
    tamano_bytes = Column(Integer, nullable=False)
    id_paciente = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    descripcion = Column(String(300), default="")
    subido_por_email = Column(String(150), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    paciente = relationship("Paciente", backref="archivos")


class Notificacion(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True, index=True)
    usuario_email = Column(String(150), nullable=False, index=True)
    usuario_rol = Column(String(20), nullable=False)
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False)
    tipo = Column(String(30), default="info")
    created_at = Column(DateTime, server_default=func.now())
