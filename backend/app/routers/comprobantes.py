from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/comprobantes", tags=["Comprobantes"])


@router.get("/{turno_id}")
def generar_comprobante(
    turno_id: int,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    turno = db.query(models.Turno).options(
        joinedload(models.Turno.paciente),
        joinedload(models.Turno.medico),
    ).filter(models.Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if rol == "paciente" and turno.id_paciente != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2.5*cm, rightMargin=2.5*cm,
        topMargin=2.5*cm, bottomMargin=2.5*cm,
    )
    styles = getSampleStyleSheet()

    titulo = ParagraphStyle(
        "titulo", parent=styles["Title"],
        fontSize=22, textColor=colors.HexColor("#1e40af"), spaceAfter=6,
    )
    subtitulo = ParagraphStyle(
        "subtitulo", parent=styles["Normal"],
        fontSize=12, textColor=colors.HexColor("#6b7280"), spaceAfter=20,
    )

    story = []
    story.append(Paragraph("MiTurno Salud PRO", titulo))
    story.append(Paragraph("Comprobante de turno", subtitulo))
    story.append(Spacer(1, 0.5*cm))

    fecha_str = turno.fecha.strftime("%d/%m/%Y") if turno.fecha else ""
    hora_str = turno.hora.strftime("%H:%M") if turno.hora else ""
    estado = turno.estado.value if hasattr(turno.estado, "value") else turno.estado

    data = [
        ["Campo", "Detalle"],
        ["Paciente", turno.paciente.nombre if turno.paciente else ""],
        ["DNI", turno.paciente.dni if turno.paciente else ""],
        ["Medico", turno.medico.nombre if turno.medico else ""],
        ["Especialidad", turno.medico.especialidad if turno.medico else ""],
        ["Fecha", fecha_str],
        ["Hora", hora_str],
        ["Estado", estado.upper()],
        ["Motivo", turno.motivo or ""],
    ]

    col_w = [5*cm, 10*cm]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 1*cm))

    pie = ParagraphStyle(
        "pie", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#9ca3af"), alignment=1,
    )
    story.append(Paragraph("Comprobante generado automaticamente — MiTurno Salud PRO", pie))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=comprobante_turno_{turno_id}.pdf"},
    )
