from datetime import datetime, timedelta, timezone
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
import pyotp
import qrcode
from jose import JWTError, jwt
from app.database import get_db
from app.config import get_settings
from app import models, schemas
from app.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, validate_password, get_current_user,
    require_admin_or_medico,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

limiter = Limiter(key_func=get_remote_address)


@router.post("/login")
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

    if data.rol in ("admin", "medico") and getattr(user, "totp_enabled", False):
        temp_token = create_access_token(
            {"sub": user.email, "rol": data.rol, "user_id": user.id, "pending_2fa": True},
            expires_delta=timedelta(minutes=5),
        )
        return {"requires_2fa": True, "temp_token": temp_token}

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


# ==================== 2FA ====================

class TwoFACode(BaseModel):
    code: str


class TwoFALogin(BaseModel):
    temp_token: str
    code: str


@router.post("/2fa/setup")
def setup_2fa(
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    user, rol = current
    secret = pyotp.random_base32()
    user.totp_secret = secret
    db.commit()

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name="MiTurno Salud PRO")

    img = qrcode.make(uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@router.post("/2fa/verify")
def verify_2fa(
    data: TwoFACode,
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    user, rol = current
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero ejecutá /2fa/setup")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Código TOTP inválido")

    user.totp_enabled = True
    db.commit()
    return {"message": "2FA activado"}


@router.post("/2fa/disable")
def disable_2fa(
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    user, rol = current
    user.totp_enabled = False
    user.totp_secret = None
    db.commit()
    return {"message": "2FA desactivado"}


@router.post("/2fa/login", response_model=schemas.TokenResponse)
def login_2fa(data: TwoFALogin, db: Session = Depends(get_db)):
    settings = get_settings()
    try:
        payload = jwt.decode(data.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    if not payload.get("pending_2fa"):
        raise HTTPException(status_code=400, detail="Token no es de 2FA pendiente")

    email = payload.get("sub")
    rol = payload.get("rol")
    user_id = payload.get("user_id")

    model_map = {"admin": models.Administrador, "medico": models.Medico}
    model = model_map.get(rol)
    if not model:
        raise HTTPException(status_code=400, detail="Rol inválido para 2FA")

    user = db.query(model).filter(model.email == email, model.activo == True).first()
    if not user or not user.totp_secret:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o 2FA no configurado")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=401, detail="Código TOTP inválido")

    token = create_access_token({"sub": user.email, "rol": rol, "user_id": user.id})
    refresh = create_refresh_token()
    db.add(models.RefreshToken(
        token=refresh,
        user_email=user.email,
        user_rol=rol,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    ))
    db.commit()

    return schemas.TokenResponse(
        access_token=token,
        refresh_token=refresh,
        rol=rol,
        nombre=user.nombre,
        user_id=user.id,
    )
