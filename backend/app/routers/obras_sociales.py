from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/obras-sociales", tags=["Obras Sociales"])


@router.get("/", response_model=list[schemas.ObraSocialOut])
def listar_obras_sociales(
    incluir_inactivas: bool = False,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    q = db.query(models.ObraSocial)
    if not incluir_inactivas:
        q = q.filter(models.ObraSocial.activo == True)
    return q.order_by(models.ObraSocial.nombre).all()


@router.post("/", response_model=schemas.ObraSocialOut)
def crear_obra_social(
    data: schemas.ObraSocialCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    if db.query(models.ObraSocial).filter(models.ObraSocial.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail="Codigo ya registrado")
    os = models.ObraSocial(nombre=data.nombre, codigo=data.codigo)
    db.add(os)
    db.commit()
    db.refresh(os)
    return os


@router.put("/{id}", response_model=schemas.ObraSocialOut)
def actualizar_obra_social(
    id: int,
    data: schemas.ObraSocialCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    os = db.query(models.ObraSocial).filter(models.ObraSocial.id == id).first()
    if not os:
        raise HTTPException(status_code=404, detail="Obra social no encontrada")
    existe = db.query(models.ObraSocial).filter(
        models.ObraSocial.codigo == data.codigo,
        models.ObraSocial.id != id,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Codigo ya registrado")
    os.nombre = data.nombre
    os.codigo = data.codigo
    db.commit()
    db.refresh(os)
    return os


@router.patch("/{id}/toggle")
def toggle_obra_social(
    id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    os = db.query(models.ObraSocial).filter(models.ObraSocial.id == id).first()
    if not os:
        raise HTTPException(status_code=404, detail="Obra social no encontrada")
    os.activo = not os.activo
    db.commit()
    estado = "activada" if os.activo else "desactivada"
    return {"message": f"Obra social {estado}", "activo": os.activo}
