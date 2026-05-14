from datetime import date, time, timedelta, datetime
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import hash_password
from app.services.email import enviar_confirmacion_turno

router = APIRouter(prefix="/api/publico", tags=["Portal Público"])


class ReservaPublicaCreate(BaseModel):
    id_medico: int
    fecha: date
    hora: time
    motivo: str
    nombre: str
    email: EmailStr
    telefono: str
    dni: str = ""


def _verificar_disponibilidad(db: Session, id_medico: int, fecha: date, hora: time) -> bool:
    medico = db.query(models.Medico).filter(models.Medico.id == id_medico).first()
    if not medico:
        return False
    duracion = medico.duracion_consulta
    hora_dt = datetime.combine(fecha, hora)
    inicio = (hora_dt - timedelta(minutes=duracion - 1)).time()
    fin = (hora_dt + timedelta(minutes=duracion - 1)).time()
    return db.query(models.Turno).filter(
        models.Turno.id_medico == id_medico,
        models.Turno.fecha == fecha,
        models.Turno.hora >= inicio,
        models.Turno.hora <= fin,
        models.Turno.estado.in_(["programado", "completado"]),
    ).count() == 0


@router.get("/especialidades")
def listar_especialidades(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Medico.especialidad)
        .filter(models.Medico.activo == True)
        .distinct()
        .all()
    )
    return [r[0] for r in rows]


@router.get("/medicos")
def listar_medicos_publico(
    especialidad: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Medico).filter(models.Medico.activo == True)
    if especialidad:
        q = q.filter(models.Medico.especialidad == especialidad)
    medicos = q.all()
    return [
        {
            "id": m.id,
            "nombre": m.nombre,
            "especialidad": m.especialidad,
            "duracion_consulta": m.duracion_consulta,
        }
        for m in medicos
    ]


@router.get("/disponibilidad")
def disponibilidad_publica(
    id_medico: int,
    fecha: date,
    db: Session = Depends(get_db),
):
    medico = db.query(models.Medico).filter(models.Medico.id == id_medico).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")

    duracion = medico.duracion_consulta
    horarios = []
    hora_actual = datetime.combine(fecha, time(8, 0))
    hora_fin = datetime.combine(fecha, time(19, 30))

    while hora_actual <= hora_fin:
        t = hora_actual.time()
        disponible = _verificar_disponibilidad(db, id_medico, fecha, t)
        horarios.append({"hora": t.strftime("%H:%M"), "disponible": disponible})
        hora_actual += timedelta(minutes=duracion)

    return horarios


@router.post("/reservar")
def reservar_turno(
    data: ReservaPublicaCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    medico = db.query(models.Medico).filter(
        models.Medico.id == data.id_medico, models.Medico.activo == True
    ).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado o inactivo")

    paciente = db.query(models.Paciente).filter(models.Paciente.email == data.email).first()
    if not paciente:
        paciente = models.Paciente(
            nombre=data.nombre,
            email=data.email,
            telefono=data.telefono,
            dni=data.dni if data.dni else None,
            password_hash=hash_password("cambiar123"),
            activo=True,
        )
        db.add(paciente)
        db.flush()

    if not _verificar_disponibilidad(db, data.id_medico, data.fecha, data.hora):
        raise HTTPException(status_code=409, detail="Horario no disponible")

    turno = models.Turno(
        id_paciente=paciente.id,
        id_medico=data.id_medico,
        fecha=data.fecha,
        hora=data.hora,
        motivo=data.motivo,
        telefono_paciente=data.telefono,
        creado_por="portal",
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)

    background_tasks.add_task(
        enviar_confirmacion_turno,
        paciente.email,
        paciente.nombre,
        paciente.nombre,
        data.fecha.strftime("%d/%m/%Y"),
        data.hora.strftime("%H:%M"),
        medico.nombre,
        medico.especialidad,
    )

    return {"mensaje": "Turno reservado exitosamente", "turno_id": turno.id}


@router.get("/turnos-hoy")
def turnos_hoy_publico(db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    hoy = date.today()
    turnos = (
        db.query(models.Turno)
        .options(joinedload(models.Turno.paciente), joinedload(models.Turno.medico))
        .filter(models.Turno.fecha == hoy)
        .order_by(models.Turno.hora)
        .all()
    )
    result = []
    for t in turnos:
        nombre = t.paciente.nombre if t.paciente else ""
        partes = nombre.split()
        nombre_privado = f"{partes[0]} {partes[1][0]}." if len(partes) > 1 else partes[0] if partes else ""
        result.append({
            "id": t.id,
            "hora": t.hora.strftime("%H:%M") if t.hora else "",
            "paciente_nombre": nombre_privado,
            "medico_nombre": t.medico.nombre if t.medico else "",
            "especialidad": t.medico.especialidad if t.medico else "",
            "estado": t.estado.value if hasattr(t.estado, "value") else t.estado,
        })
    return result
