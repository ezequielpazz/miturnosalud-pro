from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, String
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/busqueda", tags=["Busqueda"])

LIMIT = 5


@router.get("/")
def buscar(
    q: str = Query("", min_length=0),
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    """Busqueda global: pacientes, medicos y turnos."""
    user, rol = current

    if not q or not q.strip():
        return {"pacientes": [], "medicos": [], "turnos": []}

    term = f"%{q.strip()}%"

    # --- Pacientes ---
    pacientes_q = db.query(models.Paciente).filter(
        models.Paciente.activo == True,
        (
            models.Paciente.nombre.ilike(term)
            | models.Paciente.dni.ilike(term)
            | models.Paciente.email.ilike(term)
        ),
    )
    pacientes = pacientes_q.order_by(models.Paciente.nombre).limit(LIMIT).all()

    # --- Medicos ---
    medicos_q = db.query(models.Medico).filter(
        models.Medico.activo == True,
        (
            models.Medico.nombre.ilike(term)
            | models.Medico.especialidad.ilike(term)
        ),
    )
    medicos = medicos_q.order_by(models.Medico.nombre).limit(LIMIT).all()

    # --- Turnos (por nombre de paciente o fecha como texto) ---
    turnos_q = (
        db.query(models.Turno)
        .join(models.Paciente, models.Turno.id_paciente == models.Paciente.id)
        .join(models.Medico, models.Turno.id_medico == models.Medico.id)
        .filter(
            models.Paciente.nombre.ilike(term)
            | models.Medico.nombre.ilike(term)
            | cast(models.Turno.fecha, String).ilike(term)
        )
    )
    turnos = turnos_q.order_by(models.Turno.fecha.desc()).limit(LIMIT).all()

    return {
        "pacientes": [
            {
                "id": p.id,
                "nombre": p.nombre,
                "dni": p.dni,
                "email": p.email,
            }
            for p in pacientes
        ],
        "medicos": [
            {
                "id": m.id,
                "nombre": m.nombre,
                "especialidad": m.especialidad,
            }
            for m in medicos
        ],
        "turnos": [
            {
                "id": t.id,
                "fecha": str(t.fecha),
                "hora": str(t.hora),
                "estado": t.estado.value if t.estado else t.estado,
                "paciente_nombre": t.paciente.nombre if t.paciente else "",
                "medico_nombre": t.medico.nombre if t.medico else "",
            }
            for t in turnos
        ],
    }
