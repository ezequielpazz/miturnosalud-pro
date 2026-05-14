from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin, get_current_user, hash_password

router = APIRouter(prefix="/api/medicos", tags=["Médicos"])

ESPECIALIDADES = [
    "Clínica Médica", "Cardiología", "Pediatría", "Traumatología",
    "Dermatología", "Ginecología", "Neurología", "Oftalmología",
]


@router.get("/especialidades")
def listar_especialidades():
    return ESPECIALIDADES


@router.get("/", response_model=list[schemas.MedicoOut])
def listar_medicos(
    activo: bool | None = None,
    especialidad: str | None = None,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    q = db.query(models.Medico)
    if activo is not None:
        q = q.filter(models.Medico.activo == activo)
    if especialidad:
        q = q.filter(models.Medico.especialidad == especialidad)
    return q.order_by(models.Medico.nombre).all()


@router.get("/{medico_id}", response_model=schemas.MedicoOut)
def obtener_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    medico = db.query(models.Medico).filter(models.Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    return medico


@router.post("/", response_model=schemas.MedicoOut)
def crear_medico(
    data: schemas.MedicoCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    if data.especialidad not in ESPECIALIDADES:
        raise HTTPException(status_code=400, detail="Especialidad inválida")
    if db.query(models.Medico).filter(models.Medico.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    medico = models.Medico(
        nombre=data.nombre,
        email=data.email,
        telefono=data.telefono,
        especialidad=data.especialidad,
        password_hash=hash_password(data.password),
        duracion_consulta=data.duracion_consulta,
    )
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return medico


@router.put("/{medico_id}", response_model=schemas.MedicoOut)
def actualizar_medico(
    medico_id: int,
    data: schemas.MedicoUpdate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    medico = db.query(models.Medico).filter(models.Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(medico, field, value)
    db.commit()
    db.refresh(medico)
    return medico


@router.patch("/{medico_id}/toggle")
def toggle_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    medico = db.query(models.Medico).filter(models.Medico.id == medico_id).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    medico.activo = not medico.activo
    db.commit()
    estado = "activado" if medico.activo else "desactivado"
    return {"message": f"Médico {estado}", "activo": medico.activo}
