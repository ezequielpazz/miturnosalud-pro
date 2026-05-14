from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/tarifas", tags=["Tarifas"])


@router.get("/", response_model=list[schemas.TarifaOut])
def listar_tarifas(
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    return db.query(models.Tarifa).order_by(models.Tarifa.especialidad).all()


@router.put("/{especialidad}", response_model=schemas.TarifaOut)
def actualizar_tarifa(
    especialidad: str,
    data: schemas.TarifaUpdate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    tarifa = db.query(models.Tarifa).filter(models.Tarifa.especialidad == especialidad).first()
    if not tarifa:
        raise HTTPException(status_code=404, detail="Tarifa no encontrada")
    tarifa.precio_base = data.precio_base
    db.commit()
    db.refresh(tarifa)
    return tarifa
