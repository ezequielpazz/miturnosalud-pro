from app.services.email import _send


def build_reminder_html(
    paciente_nombre: str,
    medico_nombre: str,
    especialidad: str,
    fecha: str,
    hora: str,
) -> str:
    """Build a professional HTML email template for appointment reminders."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <div style="background:linear-gradient(135deg,#1a2542,#2563eb);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">MiTurno Salud</h1>
          <p style="color:#93c5fd;margin:8px 0 0;font-size:14px;">Recordatorio de turno</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#334155;font-size:16px;margin:0 0 20px;">Hola <strong>{paciente_nombre}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">Te recordamos que tenés un turno programado para <strong>mañana</strong>:</p>
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Médico</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;text-align:right;">Dr. {medico_nombre}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Especialidad</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;text-align:right;">{especialidad}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Fecha</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;text-align:right;">{fecha}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Hora</td><td style="padding:8px 0;color:#1e293b;font-weight:600;font-size:14px;text-align:right;">{hora}</td></tr>
            </table>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;">Si necesitás cancelar o reprogramar, por favor contactános con anticipación.</p>
        </div>
        <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">MiTurno Salud PRO &mdash; Gestión de turnos médicos</p>
        </div>
      </div>
    </body>
    </html>
    """


def send_reminder_email(
    to: str, subject: str, html_body: str
) -> bool:
    """Send a reminder email. Returns True if sent successfully."""
    try:
        _send(to, subject, html_body)
        print(f"[EMAIL] Reminder sent to {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Error sending reminder to {to}: {e}")
        return False
