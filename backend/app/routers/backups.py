import os
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_admin
from app.config import get_settings

router = APIRouter(prefix="/api/backups", tags=["Backups"])

BACKUP_DIR = Path("backups")


@router.get("/")
def listar_backups(_: tuple = Depends(require_admin)):
    BACKUP_DIR.mkdir(exist_ok=True)
    files = sorted(BACKUP_DIR.glob("*.db"), reverse=True)
    return [
        {
            "nombre": f.name,
            "tamaño_kb": round(f.stat().st_size / 1024, 1),
            "fecha": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
        }
        for f in files
    ]


@router.post("/")
def crear_backup(_: tuple = Depends(require_admin)):
    settings = get_settings()
    if not settings.DATABASE_URL.startswith("sqlite"):
        raise HTTPException(status_code=400, detail="Backup manual solo disponible para SQLite. Usá pg_dump para PostgreSQL.")

    db_path = settings.DATABASE_URL.replace("sqlite:///./", "")
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Archivo de base de datos no encontrado")

    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"miturnosalud_{timestamp}.db"
    shutil.copy2(db_path, backup_path)
    return {"message": "Backup creado", "archivo": backup_path.name}


@router.post("/restaurar/{nombre}")
def restaurar_backup(nombre: str, _: tuple = Depends(require_admin)):
    settings = get_settings()
    if not settings.DATABASE_URL.startswith("sqlite"):
        raise HTTPException(status_code=400, detail="Restauración manual solo para SQLite")

    backup_path = BACKUP_DIR / nombre
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup no encontrado")

    db_path = settings.DATABASE_URL.replace("sqlite:///./", "")
    # Crear backup del actual antes de restaurar
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(db_path, BACKUP_DIR / f"pre_restore_{timestamp}.db")
    shutil.copy2(backup_path, db_path)
    return {"message": f"Base restaurada desde {nombre}"}
