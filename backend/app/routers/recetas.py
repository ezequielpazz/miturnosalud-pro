from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from io import BytesIO
from datetime import date
import json
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from app.database import get_db
from app import models
from app.auth import get_current_user, require_medico
from app.config import get_settings

router = APIRouter(prefix="/api/recetas", tags=["Recetas"])
settings = get_settings()


class MedicamentoSchema(BaseModel):
    nombre: str
    dosis: str
    frecuencia: str


class RecetaCreate(BaseModel):
    id_turno: int
    id_paciente: int
    medicamentos: list[MedicamentoSchema]
    indicaciones: str = ""


class RecetaOut(BaseModel):
    id: int
    id_turno: int
    id_medico: int
    id_paciente: int
    medicamentos: str
    indicaciones: str
    fecha: date
    created_at: str | None = None
    medico_nombre: str | None = None
    paciente_nombre: str | None = None

    class Config:
        from_attributes = True


@router.get("/")
def listar_recetas(
    medico_id: int | None = Query(None),
    paciente_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    query = db.query(models.Receta).options(
        joinedload(models.Receta.medico),
        joinedload(models.Receta.paciente),
    )

    if rol == "medico":
        query = query.filter(models.Receta.id_medico == user.id)
    elif rol == "paciente":
        query = query.filter(models.Receta.id_paciente == user.id)

    if medico_id:
        query = query.filter(models.Receta.id_medico == medico_id)
    if paciente_id:
        query = query.filter(models.Receta.id_paciente == paciente_id)

    recetas = query.order_by(models.Receta.created_at.desc()).all()
    result = []
    for r in recetas:
        result.append({
            "id": r.id,
            "id_turno": r.id_turno,
            "id_medico": r.id_medico,
            "id_paciente": r.id_paciente,
            "medicamentos": r.medicamentos,
            "indicaciones": r.indicaciones,
            "fecha": r.fecha.isoformat(),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "medico_nombre": r.medico.nombre if r.medico else None,
            "paciente_nombre": r.paciente.nombre if r.paciente else None,
        })
    return result


@router.post("/")
def crear_receta(
    data: RecetaCreate,
    db: Session = Depends(get_db),
    current: tuple = Depends(require_medico),
):
    user, rol = current

    # Verificar que el turno existe y pertenece al medico
    turno = db.query(models.Turno).filter(models.Turno.id == data.id_turno).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    if turno.id_medico != user.id:
        raise HTTPException(status_code=403, detail="No autorizado para este turno")

    receta = models.Receta(
        id_turno=data.id_turno,
        id_medico=user.id,
        id_paciente=data.id_paciente,
        medicamentos=json.dumps([m.model_dump() for m in data.medicamentos]),
        indicaciones=data.indicaciones,
        fecha=date.today(),
    )
    db.add(receta)
    db.commit()
    db.refresh(receta)
    return {"id": receta.id, "mensaje": "Receta creada exitosamente"}


@router.get("/{receta_id}/pdf")
def descargar_receta_pdf(
    receta_id: int,
    db: Session = Depends(get_db),
    current: tuple = Depends(get_current_user),
):
    user, rol = current
    receta = db.query(models.Receta).options(
        joinedload(models.Receta.medico),
        joinedload(models.Receta.paciente),
    ).filter(models.Receta.id == receta_id).first()

    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    if rol == "medico" and receta.id_medico != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if rol == "paciente" and receta.id_paciente != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Generar PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2.5 * cm, rightMargin=2.5 * cm,
        topMargin=2.5 * cm, bottomMargin=2.5 * cm,
    )
    styles = getSampleStyleSheet()

    titulo_style = ParagraphStyle(
        "titulo", parent=styles["Title"],
        fontSize=22, textColor=colors.HexColor("#1e40af"), spaceAfter=6,
    )
    subtitulo_style = ParagraphStyle(
        "subtitulo", parent=styles["Normal"],
        fontSize=12, textColor=colors.HexColor("#6b7280"), spaceAfter=20,
    )
    normal_style = ParagraphStyle(
        "normal_receta", parent=styles["Normal"],
        fontSize=11, spaceAfter=6,
    )
    footer_style = ParagraphStyle(
        "footer_receta", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#9ca3af"), alignment=1,
    )

    story = []

    # Header clinica
    story.append(Paragraph(settings.CLINIC_NAME, titulo_style))
    story.append(Paragraph("Receta Medica", subtitulo_style))
    story.append(Spacer(1, 0.3 * cm))

    # Info medico y paciente
    fecha_str = receta.fecha.strftime("%d/%m/%Y") if receta.fecha else ""
    medico_nombre = receta.medico.nombre if receta.medico else ""
    medico_esp = receta.medico.especialidad if receta.medico else ""
    paciente_nombre = receta.paciente.nombre if receta.paciente else ""

    info_data = [
        ["Medico:", f"Dr/a. {medico_nombre}"],
        ["Especialidad:", medico_esp],
        ["Paciente:", paciente_nombre],
        ["Fecha:", fecha_str],
    ]
    info_table = Table(info_data, colWidths=[4 * cm, 12 * cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.8 * cm))

    # Separador
    separator = Table([[""]],  colWidths=[16 * cm])
    separator.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#cbd5e1")),
    ]))
    story.append(separator)
    story.append(Spacer(1, 0.5 * cm))

    # Medicamentos
    story.append(Paragraph("<b>Medicamentos:</b>", normal_style))
    story.append(Spacer(1, 0.3 * cm))

    medicamentos = json.loads(receta.medicamentos)
    med_data = [["#", "Medicamento", "Dosis", "Frecuencia"]]
    for i, med in enumerate(medicamentos, 1):
        med_data.append([
            str(i),
            med.get("nombre", ""),
            med.get("dosis", ""),
            med.get("frecuencia", ""),
        ])

    med_table = Table(med_data, colWidths=[1 * cm, 6 * cm, 4 * cm, 5 * cm])
    med_table.setStyle(TableStyle([
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
    story.append(med_table)
    story.append(Spacer(1, 0.8 * cm))

    # Indicaciones
    if receta.indicaciones:
        story.append(Paragraph("<b>Indicaciones:</b>", normal_style))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(receta.indicaciones, normal_style))
        story.append(Spacer(1, 0.8 * cm))

    # Firma digital del médico
    if receta.medico and receta.medico.firma_digital:
        story.append(Spacer(1, 0.8 * cm))
        firma_label_style = ParagraphStyle(
            "firma_label", parent=styles["Normal"],
            fontSize=10, textColor=colors.HexColor("#374151"), spaceAfter=4,
        )
        story.append(Paragraph("<b>Firma del médico:</b>", firma_label_style))
        story.append(Spacer(1, 0.2 * cm))
        try:
            firma_b64 = receta.medico.firma_digital
            # Strip data URL prefix if present
            if "," in firma_b64:
                firma_b64 = firma_b64.split(",", 1)[1]
            firma_bytes = base64.b64decode(firma_b64)
            firma_buffer = BytesIO(firma_bytes)
            firma_img = Image(firma_buffer, width=6 * cm, height=2.5 * cm)
            firma_img.hAlign = "LEFT"
            story.append(firma_img)
        except Exception:
            pass  # Skip signature if decoding fails
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(f"Dr/a. {medico_nombre}", firma_label_style))

    # Footer
    story.append(Spacer(1, 1 * cm))
    separator2 = Table([[""]],  colWidths=[16 * cm])
    separator2.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#cbd5e1")),
    ]))
    story.append(separator2)
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Este documento es una receta medica valida", footer_style))
    story.append(Paragraph(f"{settings.CLINIC_NAME} — Sistema de gestion medica", footer_style))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=receta_{receta_id}.pdf"},
    )
