import os
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import require_admin, require_admin_or_medico
from app.config import get_settings

router = APIRouter(prefix="/api/archivos", tags=["Archivos"])
settings = get_settings()

os.makedirs(settings.UPLOADS_DIR, exist_ok=True)


@router.post("/upload")
def upload_archivo(
    id_paciente: int = Form(...),
    descripcion: str = Form(""),
    file: UploadFile = File(...),
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    user, rol = current

    paciente = db.query(models.Paciente).filter(models.Paciente.id == id_paciente).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    contents = file.file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Archivo excede {settings.MAX_UPLOAD_SIZE_MB} MB")

    nombre_almacenado = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(settings.UPLOADS_DIR, nombre_almacenado)
    with open(filepath, "wb") as f:
        f.write(contents)

    archivo = models.Archivo(
        nombre_original=file.filename,
        nombre_almacenado=nombre_almacenado,
        tipo_mime=file.content_type or "application/octet-stream",
        tamano_bytes=len(contents),
        id_paciente=id_paciente,
        descripcion=descripcion,
        subido_por_email=user.email,
    )
    db.add(archivo)
    db.commit()
    db.refresh(archivo)

    return {
        "id": archivo.id,
        "nombre_original": archivo.nombre_original,
        "tipo_mime": archivo.tipo_mime,
        "tamano_bytes": archivo.tamano_bytes,
        "id_paciente": archivo.id_paciente,
        "descripcion": archivo.descripcion,
        "created_at": str(archivo.created_at),
    }


@router.get("/paciente/{id_paciente}")
def listar_archivos_paciente(
    id_paciente: int,
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    archivos = (
        db.query(models.Archivo)
        .filter(models.Archivo.id_paciente == id_paciente)
        .order_by(models.Archivo.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "nombre_original": a.nombre_original,
            "tipo_mime": a.tipo_mime,
            "tamano_bytes": a.tamano_bytes,
            "descripcion": a.descripcion,
            "subido_por_email": a.subido_por_email,
            "created_at": str(a.created_at),
        }
        for a in archivos
    ]


@router.get("/download/{id}")
def download_archivo(
    id: int,
    current: tuple = Depends(require_admin_or_medico),
    db: Session = Depends(get_db),
):
    archivo = db.query(models.Archivo).filter(models.Archivo.id == id).first()
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    filepath = os.path.join(settings.UPLOADS_DIR, archivo.nombre_almacenado)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")

    return FileResponse(
        path=filepath,
        filename=archivo.nombre_original,
        media_type=archivo.tipo_mime,
    )


@router.delete("/{id}")
def eliminar_archivo(
    id: int,
    current: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    archivo = db.query(models.Archivo).filter(models.Archivo.id == id).first()
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    filepath = os.path.join(settings.UPLOADS_DIR, archivo.nombre_almacenado)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(archivo)
    db.commit()
    return {"message": "Archivo eliminado"}
