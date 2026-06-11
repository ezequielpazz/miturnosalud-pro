from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models import Turno, Paciente, Medico, EstadoTurno
from app.services.email_service import send_reminder_email, build_reminder_html


def send_tomorrow_reminders(db: Session) -> dict:
    """Send email reminders for all appointments scheduled for tomorrow."""
    tomorrow = date.today() + timedelta(days=1)

    turnos = (
        db.query(Turno)
        .filter(
            Turno.fecha == tomorrow,
            Turno.estado == EstadoTurno.PROGRAMADO,
        )
        .all()
    )

    sent = 0
    errors = 0
    for turno in turnos:
        paciente = db.query(Paciente).filter(Paciente.id == turno.id_paciente).first()
        medico = db.query(Medico).filter(Medico.id == turno.id_medico).first()

        if not paciente or not medico:
            continue

        email = paciente.email
        if not email:
            continue

        hora_str = turno.hora.strftime("%H:%M") if turno.hora else ""
        fecha_str = turno.fecha.strftime("%d/%m/%Y") if turno.fecha else str(tomorrow)

        html = build_reminder_html(
            paciente_nombre=paciente.nombre,
            medico_nombre=medico.nombre,
            especialidad=medico.especialidad,
            fecha=fecha_str,
            hora=hora_str,
        )

        subject = f"Recordatorio: Turno mañana {hora_str}"
        if send_reminder_email(email, subject, html):
            sent += 1
        else:
            errors += 1

    return {
        "fecha_recordatorio": str(tomorrow),
        "total_turnos": len(turnos),
        "emails_enviados": sent,
        "errores": errors,
    }
