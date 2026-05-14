from datetime import date, time, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin, require_admin_or_medico

router = APIRouter(prefix="/api/turnos", tags=["Turnos"])


def _verificar_disponibilidad(db: Session, id_medico: int, fecha: date, hora: time, excluir_turno_id: int | None = None) -> bool:
    """Verifica que no haya un turno en ese horario (con 30 min de buffer)."""
    medico = db.query(models.Medico).filter(models.Medico.id == id_medico).first()
    if not medico:
        return False

    duracion = medico.duracion_consulta
    hora_dt = datetime.combine(fecha, hora)
    inicio = (hora_dt - timedelta(minutes=duracion - 1)).time()
    fin = (hora_dt + timedelta(minutes=duracion - 1)).time()

    q = db.query(models.Turno).filter(
        models.Turno.id_medico == id_medico,
        models.Turno.fecha == fecha,
        models.Turno.hora >= inicio,
        models.Turno.hora <= fin,
        models.Turno.estado.in_(["programado", "completado"]),
    )
    if excluir_turno_id:
        q = q.filter(models.Turno.id != excluir_turno_id)
    return q.count() == 0


def _enrich_turno(turno: models.Turno, db: Session) -> dict:
    """Add paciente/medico/tarifa info to turno dict."""
    data = {
        "id": turno.id,
        "id_paciente": turno.id_paciente,
        "id_medico": turno.id_medico,
        "fecha": turno.fecha,
        "hora": turno.hora,
        "estado": turno.estado.value if hasattr(turno.estado, 'value') else turno.estado,
        "motivo": turno.motivo,
        "telefono_paciente": turno.telefono_paciente,
        "nota_medica": turno.nota_medica,
        "necesita_seguimiento": turno.necesita_seguimiento,
        "creado_por": turno.creado_por,
        "fecha_creacion": turno.fecha_creacion,
        "paciente_nombre": turno.paciente.nombre if turno.paciente else None,
        "paciente_dni": turno.paciente.dni if turno.paciente else None,
        "medico_nombre": turno.medico.nombre if turno.medico else None,
        "medico_especialidad": turno.medico.especialidad if turno.medico else None,
    }
    if turno.medico:
        tarifa = db.query(models.Tarifa).filter(
            models.Tarifa.especialidad == turno.medico.especialidad
        ).first()
        data["precio_base"] = tarifa.precio_base if tarifa else None
    return data


@router.get("/disponibilidad")
def obtener_disponibilidad(
    id_medico: int,
    fecha: date,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    """Devuelve horarios disponibles para un médico en una fecha."""
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


@router.get("/", response_model=list[schemas.TurnoOut])
def listar_turnos(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    estado: str | None = None,
    especialidad: str | None = None,
    buscar: str | None = None,
    id_medico: int | None = None,
    id_paciente: int | None = None,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    q = db.query(models.Turno).options(
        joinedload(models.Turno.paciente),
        joinedload(models.Turno.medico),
    )

    # Médicos solo ven sus turnos, pacientes solo los suyos
    if rol == "medico":
        q = q.filter(models.Turno.id_medico == user.id)
    elif rol == "paciente":
        q = q.filter(models.Turno.id_paciente == user.id)

    if fecha_desde:
        q = q.filter(models.Turno.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(models.Turno.fecha <= fecha_hasta)
    if estado:
        q = q.filter(models.Turno.estado == estado)
    if id_medico and rol != "medico":
        q = q.filter(models.Turno.id_medico == id_medico)
    if id_paciente and rol != "paciente":
        q = q.filter(models.Turno.id_paciente == id_paciente)
    if especialidad:
        q = q.join(models.Medico).filter(models.Medico.especialidad == especialidad)
    if buscar:
        term = f"%{buscar}%"
        q = q.join(models.Paciente, isouter=True).filter(
            (models.Paciente.nombre.ilike(term)) |
            (models.Paciente.dni.ilike(term))
        )

    turnos = q.order_by(models.Turno.fecha.desc(), models.Turno.hora).all()
    return [_enrich_turno(t, db) for t in turnos]


@router.get("/hoy", response_model=list[schemas.TurnoOut])
def turnos_hoy(
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    """Turnos de hoy — médicos ven solo los suyos, admin ve todos."""
    user, rol = current
    hoy = date.today()
    q = db.query(models.Turno).options(
        joinedload(models.Turno.paciente),
        joinedload(models.Turno.medico),
    ).filter(models.Turno.fecha == hoy)

    if rol == "medico":
        q = q.filter(models.Turno.id_medico == user.id)

    turnos = q.order_by(models.Turno.hora).all()
    return [_enrich_turno(t, db) for t in turnos]


@router.post("/", response_model=schemas.TurnoOut)
def crear_turno(
    data: schemas.TurnoCreate,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current

    # Pacientes solo pueden crear turnos para sí mismos
    if rol == "paciente" and data.id_paciente != user.id:
        raise HTTPException(status_code=403, detail="Solo podés crear turnos para vos")

    # Verificar que médico y paciente existan
    medico = db.query(models.Medico).filter(models.Medico.id == data.id_medico, models.Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado o inactivo")
    paciente = db.query(models.Paciente).filter(models.Paciente.id == data.id_paciente).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if not _verificar_disponibilidad(db, data.id_medico, data.fecha, data.hora):
        raise HTTPException(status_code=409, detail="Horario no disponible")

    turno = models.Turno(
        id_paciente=data.id_paciente,
        id_medico=data.id_medico,
        fecha=data.fecha,
        hora=data.hora,
        motivo=data.motivo,
        telefono_paciente=data.telefono_paciente or paciente.telefono,
        creado_por=data.creado_por,
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return _enrich_turno(turno, db)


@router.post("/recepcion", response_model=schemas.TurnoOut)
def crear_turno_recepcion(
    data: schemas.TurnoRecepcionCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    """Agendar turno desde recepción — crea paciente temporal si no existe."""
    temp_email = f"temp_{data.telefono_paciente.replace(' ', '')}@miturnosalud.com"
    paciente = db.query(models.Paciente).filter(
        (models.Paciente.telefono == data.telefono_paciente) |
        (models.Paciente.email == temp_email)
    ).first()

    if not paciente:
        from app.auth import hash_password
        paciente = models.Paciente(
            nombre=data.nombre_paciente,
            dni="",
            email=temp_email,
            telefono=data.telefono_paciente,
            password_hash=hash_password("temp1234"),
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
        telefono_paciente=data.telefono_paciente,
        creado_por="recepcion",
    )
    db.add(turno)
    db.commit()
    db.refresh(turno)
    return _enrich_turno(turno, db)


@router.put("/{turno_id}", response_model=schemas.TurnoOut)
def actualizar_turno(
    turno_id: int,
    data: schemas.TurnoUpdate,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    turno = db.query(models.Turno).options(
        joinedload(models.Turno.paciente),
        joinedload(models.Turno.medico),
    ).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # Pacientes solo pueden cancelar sus propios turnos
    if rol == "paciente":
        if turno.id_paciente != user.id:
            raise HTTPException(status_code=403, detail="No podés modificar este turno")
        if data.estado and data.estado != "cancelado":
            raise HTTPException(status_code=403, detail="Solo podés cancelar turnos")

    # Si reprograma, verificar disponibilidad
    if data.fecha and data.hora:
        if not _verificar_disponibilidad(db, turno.id_medico, data.fecha, data.hora, excluir_turno_id=turno_id):
            raise HTTPException(status_code=409, detail="Horario no disponible")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(turno, field, value)
    db.commit()
    db.refresh(turno)
    return _enrich_turno(turno, db)
