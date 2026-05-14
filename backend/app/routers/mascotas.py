from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/mascotas", tags=["Mascotas"])


class MascotaCreate(BaseModel):
    nombre: str
    especie: str
    raza: str = ""
    peso_kg: Decimal | None = None
    fecha_nacimiento: date | None = None
    id_dueno: int
    notas: str = ""


class MascotaUpdate(BaseModel):
    nombre: str | None = None
    especie: str | None = None
    raza: str | None = None
    peso_kg: Decimal | None = None
    fecha_nacimiento: date | None = None
    notas: str | None = None
    activo: bool | None = None


def _mascota_dict(m: models.Mascota) -> dict:
    return {
        "id": m.id,
        "nombre": m.nombre,
        "especie": m.especie,
        "raza": m.raza,
        "peso_kg": m.peso_kg,
        "fecha_nacimiento": m.fecha_nacimiento,
        "notas": m.notas,
        "activo": m.activo,
        "id_dueno": m.id_dueno,
        "created_at": m.created_at,
    }


@router.get("/")
def listar_mascotas(
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    q = db.query(models.Mascota)
    if rol == "paciente":
        q = q.filter(models.Mascota.id_dueno == user.id)
    mascotas = q.all()
    return [_mascota_dict(m) for m in mascotas]


@router.post("/")
def crear_mascota(
    data: MascotaCreate,
    db: Session = Depends(get_db),
    _: tuple = Depends(get_current_user),
):
    dueno = db.query(models.Paciente).filter(models.Paciente.id == data.id_dueno).first()
    if not dueno:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")

    mascota = models.Mascota(
        nombre=data.nombre,
        especie=data.especie,
        raza=data.raza,
        peso_kg=data.peso_kg,
        fecha_nacimiento=data.fecha_nacimiento,
        id_dueno=data.id_dueno,
        notas=data.notas,
    )
    db.add(mascota)
    db.commit()
    db.refresh(mascota)
    return _mascota_dict(mascota)


@router.put("/{mascota_id}")
def actualizar_mascota(
    mascota_id: int,
    data: MascotaUpdate,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    mascota = db.query(models.Mascota).filter(models.Mascota.id == mascota_id).first()
    if not mascota:
        raise HTTPException(status_code=404, detail="Mascota no encontrada")

    if rol == "paciente" and mascota.id_dueno != user.id:
        raise HTTPException(status_code=403, detail="No podés modificar esta mascota")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(mascota, field, value)
    db.commit()
    db.refresh(mascota)
    return _mascota_dict(mascota)


@router.get("/dueno/{id_dueno}")
def mascotas_por_dueno(
    id_dueno: int,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    if rol == "paciente" and user.id != id_dueno:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    mascotas = db.query(models.Mascota).filter(models.Mascota.id_dueno == id_dueno).all()
    return [_mascota_dict(m) for m in mascotas]
