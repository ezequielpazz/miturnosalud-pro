from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_admin_or_medico

router = APIRouter(prefix="/api/horarios", tags=["Horarios"])


@router.get("/medico/{medico_id}", response_model=list[schemas.HorarioMedicoOut])
def get_horarios_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    """Devuelve todos los horarios configurados para un medico."""
    medico = db.query(models.Medico).filter(models.Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Medico no encontrado")
    horarios = (
        db.query(models.HorarioMedico)
        .filter(models.HorarioMedico.id_medico == medico_id)
        .order_by(models.HorarioMedico.dia_semana, models.HorarioMedico.hora_inicio)
        .all()
    )
    return horarios


@router.get("/mis-horarios", response_model=list[schemas.HorarioMedicoOut])
def get_mis_horarios(
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    """Devuelve los horarios del medico autenticado."""
    user, rol = current
    if rol != "medico":
        raise HTTPException(status_code=403, detail="Solo medicos pueden acceder a sus horarios")
    horarios = (
        db.query(models.HorarioMedico)
        .filter(models.HorarioMedico.id_medico == user.id)
        .order_by(models.HorarioMedico.dia_semana, models.HorarioMedico.hora_inicio)
        .all()
    )
    return horarios


@router.post("/", response_model=schemas.HorarioMedicoOut)
def crear_horario(
    data: schemas.HorarioMedicoCreate,
    db: Session = Depends(get_db),
    current: tuple = Depends(require_admin_or_medico),
):
    """Crea una nueva entrada de horario."""
    user, rol = current
    if rol == "medico":
        id_medico = user.id
    else:
        raise HTTPException(
            status_code=400,
            detail="Use el endpoint bulk para asignar horarios como admin",
        )

    if data.dia_semana < 0 or data.dia_semana > 5:
        raise HTTPException(status_code=400, detail="dia_semana debe ser entre 0 (Lun) y 5 (Sab)")
    if data.hora_inicio >= data.hora_fin:
        raise HTTPException(status_code=400, detail="hora_inicio debe ser menor a hora_fin")

    horario = models.HorarioMedico(
        id_medico=id_medico,
        dia_semana=data.dia_semana,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        intervalo_minutos=data.intervalo_minutos,
        activo=data.activo,
    )
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.put("/{horario_id}", response_model=schemas.HorarioMedicoOut)
def actualizar_horario(
    horario_id: int,
    data: schemas.HorarioMedicoCreate,
    db: Session = Depends(get_db),
    current: tuple = Depends(require_admin_or_medico),
):
    """Actualiza una entrada de horario existente."""
    user, rol = current
    horario = db.query(models.HorarioMedico).filter(models.HorarioMedico.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    if rol == "medico" and horario.id_medico != user.id:
        raise HTTPException(status_code=403, detail="No podes modificar horarios de otro medico")

    if data.dia_semana < 0 or data.dia_semana > 5:
        raise HTTPException(status_code=400, detail="dia_semana debe ser entre 0 (Lun) y 5 (Sab)")
    if data.hora_inicio >= data.hora_fin:
        raise HTTPException(status_code=400, detail="hora_inicio debe ser menor a hora_fin")

    horario.dia_semana = data.dia_semana
    horario.hora_inicio = data.hora_inicio
    horario.hora_fin = data.hora_fin
    horario.intervalo_minutos = data.intervalo_minutos
    horario.activo = data.activo
    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{horario_id}")
def eliminar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current: tuple = Depends(require_admin_or_medico),
):
    """Elimina una entrada de horario."""
    user, rol = current
    horario = db.query(models.HorarioMedico).filter(models.HorarioMedico.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    if rol == "medico" and horario.id_medico != user.id:
        raise HTTPException(status_code=403, detail="No podes eliminar horarios de otro medico")

    db.delete(horario)
    db.commit()
    return {"detail": "Horario eliminado"}


@router.post("/bulk", response_model=list[schemas.HorarioMedicoOut])
def bulk_upsert_horarios(
    data: list[schemas.HorarioMedicoCreate],
    db: Session = Depends(get_db),
    current: tuple = Depends(require_admin_or_medico),
):
    """Bulk upsert: recibe array de horarios, elimina los anteriores del medico e inserta los nuevos."""
    user, rol = current
    if rol == "medico":
        id_medico = user.id
    else:
        # Admin: necesita que al menos un item tenga datos validos
        raise HTTPException(
            status_code=400,
            detail="Solo medicos pueden usar bulk upsert de sus propios horarios",
        )

    # Validar todos los items
    for item in data:
        if item.dia_semana < 0 or item.dia_semana > 5:
            raise HTTPException(status_code=400, detail=f"dia_semana invalido: {item.dia_semana}")
        if item.hora_inicio >= item.hora_fin:
            raise HTTPException(
                status_code=400,
                detail=f"hora_inicio ({item.hora_inicio}) debe ser menor a hora_fin ({item.hora_fin})",
            )

    # Eliminar horarios anteriores del medico (dentro de transaccion)
    db.query(models.HorarioMedico).filter(
        models.HorarioMedico.id_medico == id_medico
    ).delete()

    # Insertar nuevos
    nuevos = []
    for item in data:
        horario = models.HorarioMedico(
            id_medico=id_medico,
            dia_semana=item.dia_semana,
            hora_inicio=item.hora_inicio,
            hora_fin=item.hora_fin,
            intervalo_minutos=item.intervalo_minutos,
            activo=item.activo,
        )
        db.add(horario)
        nuevos.append(horario)

    db.commit()
    for h in nuevos:
        db.refresh(h)

    return nuevos
