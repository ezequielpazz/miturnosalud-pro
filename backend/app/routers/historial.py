from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models
from app.auth import require_admin_or_medico

router = APIRouter(prefix="/api/historial", tags=["Historial Clínico"])


@router.get("/paciente/{paciente_id}")
def historial_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin_or_medico),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    turnos = (
        db.query(models.Turno)
        .options(joinedload(models.Turno.medico))
        .filter(models.Turno.id_paciente == paciente_id)
        .order_by(models.Turno.fecha.desc(), models.Turno.hora.desc())
        .all()
    )

    archivos = (
        db.query(models.Archivo)
        .filter(models.Archivo.id_paciente == paciente_id)
        .order_by(models.Archivo.created_at.desc())
        .all()
    )

    timeline = []

    for t in turnos:
        timeline.append({
            "tipo": "turno",
            "id": t.id,
            "fecha": t.fecha.isoformat(),
            "hora": t.hora.strftime("%H:%M") if t.hora else None,
            "estado": t.estado.value if hasattr(t.estado, "value") else t.estado,
            "motivo": t.motivo,
            "nota_medica": t.nota_medica,
            "necesita_seguimiento": t.necesita_seguimiento,
            "medico_nombre": t.medico.nombre if t.medico else "",
            "especialidad": t.medico.especialidad if t.medico else "",
        })

    for a in archivos:
        timeline.append({
            "tipo": "archivo",
            "id": a.id,
            "fecha": a.created_at.date().isoformat() if a.created_at else "",
            "nombre": a.nombre_original,
            "descripcion": a.descripcion,
            "tipo_mime": a.tipo_mime,
        })

    timeline.sort(key=lambda x: x.get("fecha", ""), reverse=True)

    return {
        "paciente": {
            "id": paciente.id,
            "nombre": paciente.nombre,
            "dni": paciente.dni,
            "email": paciente.email,
            "telefono": paciente.telefono,
            "fecha_nacimiento": paciente.fecha_nacimiento.isoformat() if paciente.fecha_nacimiento else None,
            "notas_clinicas": paciente.notas_clinicas,
            "obra_social": paciente.obra_social.nombre if paciente.obra_social else None,
            "numero_afiliado": paciente.numero_afiliado,
        },
        "timeline": timeline,
        "estadisticas": {
            "total_turnos": len(turnos),
            "completados": sum(1 for t in turnos if (t.estado.value if hasattr(t.estado, "value") else t.estado) == "completado"),
            "ausencias": sum(1 for t in turnos if (t.estado.value if hasattr(t.estado, "value") else t.estado) == "ausente"),
            "archivos": len(archivos),
        },
    }
