from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
from app.auth import require_admin, require_admin_or_medico, get_current_user

router = APIRouter(prefix="/api/pagos", tags=["Pagos"])


@router.get("/")
def listar_pagos(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin_or_medico),
):
    q = db.query(models.Pago).options(
        joinedload(models.Pago.turno).joinedload(models.Turno.paciente),
        joinedload(models.Pago.turno).joinedload(models.Turno.medico),
    )
    if fecha_desde:
        q = q.filter(models.Pago.fecha_pago >= fecha_desde)
    if fecha_hasta:
        q = q.filter(models.Pago.fecha_pago <= fecha_hasta)
    if estado:
        q = q.filter(models.Pago.estado == estado)
    pagos = q.order_by(models.Pago.fecha_pago.desc()).all()
    result = []
    for p in pagos:
        data = schemas.PagoOut.model_validate(p).model_dump()
        data["paciente_nombre"] = p.turno.paciente.nombre if p.turno and p.turno.paciente else None
        data["medico_nombre"] = p.turno.medico.nombre if p.turno and p.turno.medico else None
        result.append(data)
    return result


@router.post("/", response_model=schemas.PagoOut)
def registrar_pago(
    data: schemas.PagoCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    turno = db.query(models.Turno).filter(models.Turno.id == data.id_turno).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    pago = models.Pago(
        id_turno=data.id_turno,
        monto=data.monto,
        metodo=data.metodo,
        obra_social=data.obra_social,
        notas=data.notas,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return pago


@router.put("/{id}", response_model=schemas.PagoOut)
def actualizar_pago(
    id: int,
    data: schemas.PagoUpdate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    pago = db.query(models.Pago).filter(models.Pago.id == id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pago, field, value)
    db.commit()
    db.refresh(pago)
    return pago


@router.get("/turno/{turno_id}", response_model=list[schemas.PagoOut])
def pagos_por_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    pagos = db.query(models.Pago).filter(models.Pago.id_turno == turno_id).all()
    return pagos
