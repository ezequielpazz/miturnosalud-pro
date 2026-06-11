from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user, require_admin
from app.config import get_settings

router = APIRouter(prefix="/api/notificaciones", tags=["Notificaciones"])


@router.get("/")
def listar_notificaciones(
    solo_no_leidas: bool = False,
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, rol = current
    q = db.query(models.Notificacion).filter(
        models.Notificacion.usuario_email == user.email,
        models.Notificacion.usuario_rol == rol,
    )
    if solo_no_leidas:
        q = q.filter(models.Notificacion.leida == False)

    notifs = q.order_by(models.Notificacion.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "titulo": n.titulo,
            "mensaje": n.mensaje,
            "tipo": n.tipo,
            "leida": n.leida,
            "created_at": str(n.created_at),
        }
        for n in notifs
    ]


@router.get("/count")
def count_notificaciones(
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, rol = current
    base = db.query(models.Notificacion).filter(
        models.Notificacion.usuario_email == user.email,
        models.Notificacion.usuario_rol == rol,
    )
    total = base.count()
    no_leidas = base.filter(models.Notificacion.leida == False).count()
    return {"total": total, "no_leidas": no_leidas}


@router.put("/{id}/leer")
def marcar_leida(
    id: int,
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, rol = current
    notif = db.query(models.Notificacion).filter(
        models.Notificacion.id == id,
        models.Notificacion.usuario_email == user.email,
        models.Notificacion.usuario_rol == rol,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    notif.leida = True
    db.commit()
    return {"message": "Notificacion marcada como leida"}


@router.put("/leer-todas")
def marcar_todas_leidas(
    current: tuple = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user, rol = current
    db.query(models.Notificacion).filter(
        models.Notificacion.usuario_email == user.email,
        models.Notificacion.usuario_rol == rol,
        models.Notificacion.leida == False,
    ).update({"leida": True})
    db.commit()
    return {"message": "Todas las notificaciones marcadas como leidas"}


@router.post("/enviar-recordatorios")
def enviar_recordatorios(
    current: tuple = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Manually trigger sending tomorrow's appointment reminders (admin only).

    This endpoint can be automated via cron job. Example:
        # Run daily at 20:00 to send reminders for the next day
        0 20 * * * curl -X POST http://localhost:8000/api/notificaciones/enviar-recordatorios \\
            -H "Authorization: Bearer <admin_token>"
    """
    settings = get_settings()
    if not settings.ENABLE_EMAIL_REMINDERS:
        raise HTTPException(
            status_code=400,
            detail="Los recordatorios por email están desactivados. "
                   "Activá ENABLE_EMAIL_REMINDERS=true en la configuración.",
        )

    from app.services.reminder_service import send_tomorrow_reminders
    result = send_tomorrow_reminders(db)
    return result
