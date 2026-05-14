from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: schemas.LoginRequest, db: Session = Depends(get_db)):
    model_map = {
        "admin": models.Administrador,
        "medico": models.Medico,
        "paciente": models.Paciente,
    }
    model = model_map.get(data.rol)
    if not model:
        raise HTTPException(status_code=400, detail="Rol inválido")

    user = db.query(model).filter(model.email == data.email, model.activo == True).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    token = create_access_token({"sub": user.email, "rol": data.rol, "user_id": user.id})
    return schemas.TokenResponse(
        access_token=token,
        rol=data.rol,
        nombre=user.nombre,
        user_id=user.id,
    )


@router.get("/me")
def get_me(current: tuple = Depends(get_current_user)):
    user, rol = current
    data = {
        "id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "rol": rol,
        "activo": user.activo,
    }
    if rol == "medico":
        data["especialidad"] = user.especialidad
        data["telefono"] = user.telefono
        data["duracion_consulta"] = user.duracion_consulta
    elif rol == "paciente":
        data["telefono"] = user.telefono
        data["dni"] = user.dni
        data["direccion"] = user.direccion
        data["fecha_nacimiento"] = str(user.fecha_nacimiento) if user.fecha_nacimiento else None
    return data


@router.put("/cambiar-password")
def cambiar_password(
    data: schemas.CambiarPasswordRequest,
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = current
    if not verify_password(data.password_actual, user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    user.password_hash = hash_password(data.password_nueva)
    db.commit()
    return {"message": "Contraseña actualizada"}
