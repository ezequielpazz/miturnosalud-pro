from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import require_admin, require_admin_or_medico, get_current_user, hash_password, validate_password

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])


@router.get("/", response_model=list[schemas.PacienteOut])
def listar_pacientes(
    activo: bool | None = None,
    buscar: str | None = None,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin_or_medico),
):
    q = db.query(models.Paciente)
    if activo is not None:
        q = q.filter(models.Paciente.activo == activo)
    if buscar:
        term = f"%{buscar}%"
        q = q.filter(
            (models.Paciente.nombre.ilike(term)) |
            (models.Paciente.dni.ilike(term))
        )
    return q.order_by(models.Paciente.nombre).all()


@router.get("/{paciente_id}", response_model=schemas.PacienteOut)
def obtener_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return paciente


@router.post("/", response_model=schemas.PacienteOut)
def crear_paciente(
    data: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    if db.query(models.Paciente).filter(models.Paciente.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    if data.dni and db.query(models.Paciente).filter(models.Paciente.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="DNI ya registrado")
    validate_password(data.password)

    paciente = models.Paciente(
        nombre=data.nombre,
        dni=data.dni,
        email=data.email,
        telefono=data.telefono,
        fecha_nacimiento=data.fecha_nacimiento,
        direccion=data.direccion,
        password_hash=hash_password(data.password),
        obra_social_id=data.obra_social_id,
        numero_afiliado=data.numero_afiliado,
    )
    db.add(paciente)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.put("/{paciente_id}", response_model=schemas.PacienteOut)
def actualizar_paciente(
    paciente_id: int,
    data: schemas.PacienteUpdate,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    # Pacientes solo pueden editarse a sí mismos
    if rol == "paciente" and user.id != paciente_id:
        raise HTTPException(status_code=403, detail="No podés editar otro paciente")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(paciente, field, value)
    db.commit()
    db.refresh(paciente)
    return paciente


@router.patch("/{paciente_id}/toggle")
def toggle_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    paciente.activo = not paciente.activo
    db.commit()
    estado = "activado" if paciente.activo else "desactivado"
    return {"message": f"Paciente {estado}", "activo": paciente.activo}


@router.get("/medico/{medico_id}", response_model=list[schemas.PacienteOut])
def pacientes_por_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin_or_medico),
):
    """Pacientes que tuvieron turnos con un médico específico."""
    pacientes = (
        db.query(models.Paciente)
        .join(models.Turno, models.Turno.id_paciente == models.Paciente.id)
        .filter(models.Turno.id_medico == medico_id)
        .distinct()
        .order_by(models.Paciente.nombre)
        .all()
    )
    return pacientes
