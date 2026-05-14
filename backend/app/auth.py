from datetime import datetime, timedelta, timezone
import secrets
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app import models

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def validate_password(password: str) -> None:
    """Valida que la contrasena cumpla requisitos minimos."""
    errors = []
    if len(password) < 8:
        errors.append("minimo 8 caracteres")
    if not any(c.isupper() for c in password):
        errors.append("al menos una mayuscula")
    if not any(c.isdigit() for c in password):
        errors.append("al menos un numero")
    if errors:
        raise HTTPException(
            status_code=400,
            detail=f"Contrasena debil: {', '.join(errors)}"
        )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _get_user_by_token(token: str, db: Session):
    """Decode JWT and return (user, rol)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("rol")
        if email is None or rol is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    model_map = {
        "admin": models.Administrador,
        "medico": models.Medico,
        "paciente": models.Paciente,
    }
    model = model_map.get(rol)
    if not model:
        raise credentials_exception

    user = db.query(model).filter(model.email == email, model.activo == True).first()
    if not user:
        raise credentials_exception
    return user, rol


class CurrentUser:
    """Dependency that returns (user, rol) tuple."""
    def __init__(self, allowed_roles: list[str] | None = None):
        self.allowed_roles = allowed_roles

    def __call__(self, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
        user, rol = _get_user_by_token(token, db)
        if self.allowed_roles and rol not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para esta acción",
            )
        return user, rol


# Shortcuts for common dependency patterns
get_current_user = CurrentUser()
require_admin = CurrentUser(allowed_roles=["admin"])
require_medico = CurrentUser(allowed_roles=["medico"])
require_paciente = CurrentUser(allowed_roles=["paciente"])
require_admin_or_medico = CurrentUser(allowed_roles=["admin", "medico"])
