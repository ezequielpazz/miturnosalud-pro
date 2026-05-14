import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import get_settings


def _send(to_email: str, subject: str, html_body: str) -> None:
    settings = get_settings()
    if not settings.SMTP_HOST:
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
    except Exception:
        pass


def enviar_confirmacion_turno(
    email: str,
    nombre: str,
    paciente_nombre: str,
    fecha_str: str,
    hora_str: str,
    medico_nombre: str,
    especialidad: str,
) -> None:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#1e40af;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;">MiTurno Salud PRO</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 16px;color:#1e40af;font-size:20px;">Turno confirmado</h2>
                <p style="margin:0 0 24px;color:#374151;font-size:15px;">
                  Hola <strong>{nombre}</strong>, tu turno fue registrado exitosamente.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="6" cellspacing="0">
                        <tr>
                          <td style="color:#6b7280;font-size:13px;width:130px;">Paciente</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{paciente_nombre}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Fecha</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{fecha_str}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Hora</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{hora_str}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Médico</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{medico_nombre}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Especialidad</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{especialidad}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
                  Si necesitás cancelar o reprogramar, contactá a tu clínica con anticipación.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">MiTurno Salud PRO &mdash; Sistema de gestión de turnos</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    _send(email, "Turno confirmado", html)


def enviar_cancelacion_turno(
    email: str,
    nombre: str,
    fecha_str: str,
    hora_str: str,
    medico_nombre: str,
) -> None:
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#dc2626;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;">MiTurno Salud PRO</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;">Turno cancelado</h2>
                <p style="margin:0 0 24px;color:#374151;font-size:15px;">
                  Hola <strong>{nombre}</strong>, tu turno fue cancelado.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <table width="100%" cellpadding="6" cellspacing="0">
                        <tr>
                          <td style="color:#6b7280;font-size:13px;width:130px;">Fecha</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{fecha_str}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Hora</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{hora_str}</td>
                        </tr>
                        <tr>
                          <td style="color:#6b7280;font-size:13px;">Médico</td>
                          <td style="color:#111827;font-size:14px;font-weight:bold;">{medico_nombre}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#6b7280;font-size:13px;">
                  Podés solicitar un nuevo turno cuando lo necesites.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">MiTurno Salud PRO &mdash; Sistema de gestión de turnos</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    _send(email, "Turno cancelado", html)
