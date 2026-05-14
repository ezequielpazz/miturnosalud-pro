from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, validate_password, get_current_user
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

    refresh = create_refresh_token()
    db.add(models.RefreshToken(
        token=refresh,
        user_email=user.email,
        user_rol=data.rol,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    ))
    db.commit()

    return schemas.TokenResponse(
        access_token=token,
        refresh_token=refresh,
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
    validate_password(data.password_nueva)
    user.password_hash = hash_password(data.password_nueva)
    db.commit()
    return {"message": "Contraseña actualizada"}


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(data: schemas.RefreshRequest, db: Session = Depends(get_db)):
    rt = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == data.refresh_token,
        models.RefreshToken.revoked == False,
        models.RefreshToken.expires_at > datetime.now(timezone.utc),
    ).first()
    if not rt:
        raise HTTPException(status_code=401, detail="Refresh token invalido o expirado")

    model_map = {
        "admin": models.Administrador,
        "medico": models.Medico,
        "paciente": models.Paciente,
    }
    model = model_map.get(rt.user_rol)
    if not model:
        raise HTTPException(status_code=401, detail="Rol invalido")

    user = db.query(model).filter(model.email == rt.user_email, model.activo == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")

    rt.revoked = True

    new_access = create_access_token({"sub": user.email, "rol": rt.user_rol, "user_id": user.id})
    new_refresh = create_refresh_token()
    db.add(models.RefreshToken(
        token=new_refresh,
        user_email=user.email,
        user_rol=rt.user_rol,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    ))
    db.commit()

    return schemas.TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        rol=rt.user_rol,
        nombre=user.nombre,
        user_id=user.id,
    )


@router.post("/logout")
def logout(
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, _ = current
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_email == user.email,
        models.RefreshToken.revoked == False,
    ).update({"revoked": True})
    db.commit()
    return {"message": "Sesion cerrada"}
