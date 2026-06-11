"""
Genera los 3 PDFs del proyecto MiTurno Salud PRO:
1. Diagrama Entidad-Relación
2. Diagrama de Flujo del Sistema
3. Informe completo (manual de uso + roadmap)
"""
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os

NAVY = HexColor("#1a2542")
NAVY_LIGHT = HexColor("#243356")
PRIMARY = HexColor("#1a73f5")
GREEN = HexColor("#16a34a")
RED = HexColor("#dc2626")
AMBER = HexColor("#d97706")
PURPLE = HexColor("#7c3aed")
CYAN = HexColor("#0891b2")
GRAY = HexColor("#64748b")
LIGHT_BG = HexColor("#f8fafc")
LIGHT_BLUE = HexColor("#dbeafe")
LIGHT_GREEN = HexColor("#dcfce7")
LIGHT_AMBER = HexColor("#fef3c7")
LIGHT_PURPLE = HexColor("#ede9fe")
WHITE = white
BLACK = black

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# HELPER: draw header on every page
# ============================================================
def draw_page_header(c, title, subtitle="MiTurno Salud PRO"):
    w, h = c._pagesize
    c.setFillColor(NAVY)
    c.rect(0, h - 2.2 * cm, w, 2.2 * cm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1.5 * cm, h - 1.5 * cm, subtitle)
    c.setFont("Helvetica", 10)
    c.drawRightString(w - 1.5 * cm, h - 1.5 * cm, title)
    # red heart dot
    c.setFillColor(RED)
    c.circle(1 * cm, h - 1.3 * cm, 0.25 * cm, fill=1, stroke=0)


def draw_page_footer(c, page_num):
    w, h = c._pagesize
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(w / 2, 0.8 * cm, f"MiTurno Salud PRO — Pag. {page_num}")


# ============================================================
# 1. DIAGRAMA ENTIDAD-RELACIÓN (landscape A4)
# ============================================================
def generar_er():
    path = os.path.join(OUT_DIR, "diagrama_entidad_relacion.pdf")
    c = canvas.Canvas(path, pagesize=landscape(A4))
    w, h = landscape(A4)

    draw_page_header(c, "Diagrama Entidad-Relacion", "MiTurno Salud PRO")

    # Entity box helper
    def draw_entity(x, y, name, fields, color, bg_color):
        box_w = 4.2 * cm
        line_h = 0.4 * cm
        header_h = 0.65 * cm
        box_h = header_h + len(fields) * line_h + 0.3 * cm

        # Shadow
        c.setFillColor(HexColor("#e2e8f0"))
        c.roundRect(x + 1.5, y - box_h - 1.5, box_w, box_h, 3, fill=1, stroke=0)

        # Box
        c.setFillColor(WHITE)
        c.setStrokeColor(color)
        c.setLineWidth(1.5)
        c.roundRect(x, y - box_h, box_w, box_h, 3, fill=1, stroke=1)

        # Header
        c.setFillColor(color)
        c.roundRect(x, y - header_h, box_w, header_h, 3, fill=1, stroke=0)
        c.rect(x, y - header_h, box_w, header_h * 0.5, fill=1, stroke=0)

        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + box_w / 2, y - header_h + 0.2 * cm, name)

        # Fields
        c.setFont("Helvetica", 6.5)
        for i, f in enumerate(fields):
            fy = y - header_h - 0.25 * cm - i * line_h
            if f.startswith("PK") or f.startswith("FK"):
                c.setFillColor(color)
                c.setFont("Helvetica-Bold", 6.5)
            else:
                c.setFillColor(HexColor("#334155"))
                c.setFont("Helvetica", 6.5)
            c.drawString(x + 0.2 * cm, fy, f)

        return (x, y - box_h, x + box_w, y)

    # Relationship line helper
    def draw_rel(x1, y1, x2, y2, label="", card="1:N"):
        c.setStrokeColor(GRAY)
        c.setLineWidth(0.7)
        c.setDash([], 0)

        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2

        if abs(x1 - x2) > abs(y1 - y2):
            c.line(x1, y1, mx, y1)
            c.line(mx, y1, mx, y2)
            c.line(mx, y2, x2, y2)
        else:
            c.line(x1, y1, x1, my)
            c.line(x1, my, x2, my)
            c.line(x2, my, x2, y2)

        if label:
            c.setFillColor(WHITE)
            c.rect(mx - 1 * cm, my - 0.2 * cm, 2 * cm, 0.4 * cm, fill=1, stroke=0)
            c.setFillColor(GRAY)
            c.setFont("Helvetica", 6)
            c.drawCentredString(mx, my - 0.1 * cm, f"{card} {label}")

    base_y = h - 3 * cm

    # ROW 1: Auth entities (blue)
    draw_entity(1 * cm, base_y, "Administrador",
                ["PK id", "nombre", "email", "password_hash", "activo", "totp_secret", "totp_enabled"], PRIMARY, LIGHT_BLUE)

    draw_entity(6 * cm, base_y, "RefreshToken",
                ["PK id", "token (unique)", "user_email", "user_rol", "expires_at", "revoked"], PRIMARY, LIGHT_BLUE)

    draw_entity(11 * cm, base_y, "PasswordResetToken",
                ["PK id", "email", "token (unique)", "expires_at", "used"], PRIMARY, LIGHT_BLUE)

    draw_entity(16 * cm, base_y, "AuditLog",
                ["PK id", "usuario_email", "usuario_rol", "accion", "detalle", "created_at"], PURPLE, LIGHT_PURPLE)

    draw_entity(21 * cm, base_y, "Notificacion",
                ["PK id", "usuario_email", "usuario_rol", "titulo", "mensaje", "leida", "tipo"], PURPLE, LIGHT_PURPLE)

    # ROW 2: Core entities (green)
    row2_y = base_y - 5 * cm

    draw_entity(1 * cm, row2_y, "Medico",
                ["PK id", "nombre", "email", "telefono", "especialidad", "duracion_consulta",
                 "activo", "totp_enabled"], GREEN, LIGHT_GREEN)

    b_turno = draw_entity(8.5 * cm, row2_y, "Turno",
                ["PK id", "FK id_paciente", "FK id_medico", "fecha", "hora",
                 "estado (enum)", "motivo", "nota_medica",
                 "necesita_seguimiento", "creado_por"], GREEN, LIGHT_GREEN)

    draw_entity(16 * cm, row2_y, "Paciente",
                ["PK id", "nombre", "dni", "email", "telefono",
                 "fecha_nacimiento", "FK obra_social_id",
                 "numero_afiliado", "notas_clinicas", "activo"], GREEN, LIGHT_GREEN)

    draw_entity(23 * cm, row2_y, "ObraSocial",
                ["PK id", "nombre", "codigo", "activo"], GREEN, LIGHT_GREEN)

    # ROW 3: Financial + support (amber/purple)
    row3_y = row2_y - 5.5 * cm

    draw_entity(1 * cm, row3_y, "Tarifa",
                ["PK id", "especialidad", "precio_base"], AMBER, LIGHT_AMBER)

    draw_entity(6 * cm, row3_y, "Pago",
                ["PK id", "FK id_turno", "monto", "metodo",
                 "obra_social", "estado", "notas"], AMBER, LIGHT_AMBER)

    draw_entity(11 * cm, row3_y, "Receta",
                ["PK id", "FK id_turno", "FK id_medico",
                 "FK id_paciente", "medicamentos (JSON)",
                 "indicaciones", "fecha"], PURPLE, LIGHT_PURPLE)

    draw_entity(16 * cm, row3_y, "Archivo",
                ["PK id", "nombre_original", "nombre_almacenado",
                 "tipo_mime", "FK id_paciente",
                 "descripcion", "subido_por_email"], PURPLE, LIGHT_PURPLE)

    draw_entity(22 * cm, row3_y, "Mascota",
                ["PK id", "nombre", "especie", "raza",
                 "FK id_dueno (Paciente)",
                 "fecha_nacimiento", "activo"], CYAN, LIGHT_BLUE)

    # Draw relationships
    # Medico 1:N Turno
    draw_rel(5.2 * cm, row2_y - 2 * cm, 8.5 * cm, row2_y - 2 * cm, "", "1:N")
    # Turno N:1 Paciente
    draw_rel(12.7 * cm, row2_y - 2 * cm, 16 * cm, row2_y - 2 * cm, "", "N:1")
    # Paciente N:1 ObraSocial
    draw_rel(20.2 * cm, row2_y - 2.5 * cm, 23 * cm, row2_y - 2.5 * cm, "", "N:1")
    # Turno 1:N Pago
    draw_rel(10 * cm, row2_y - 5 * cm, 7.5 * cm, row3_y, "", "1:N")
    # Turno 1:N Receta
    draw_rel(11 * cm, row2_y - 5 * cm, 12.5 * cm, row3_y, "", "1:N")
    # Paciente 1:N Archivo
    draw_rel(18 * cm, row2_y - 5 * cm, 18 * cm, row3_y, "", "1:N")
    # Paciente 1:N Mascota
    draw_rel(19 * cm, row2_y - 5 * cm, 23 * cm, row3_y, "", "1:N")

    # Legend
    ly = 2.5 * cm
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLACK)
    c.drawString(1 * cm, ly, "Leyenda:")
    for i, (color, label) in enumerate([
        (PRIMARY, "Autenticacion"), (GREEN, "Core / Negocio"),
        (AMBER, "Financiero"), (PURPLE, "Soporte"), (CYAN, "Veterinaria")
    ]):
        c.setFillColor(color)
        c.rect(5 * cm + i * 4.5 * cm, ly - 0.1 * cm, 0.4 * cm, 0.4 * cm, fill=1, stroke=0)
        c.setFillColor(BLACK)
        c.setFont("Helvetica", 7)
        c.drawString(5.6 * cm + i * 4.5 * cm, ly, label)

    draw_page_footer(c, 1)
    c.save()
    print(f"  -> {path}")


# ============================================================
# 2. DIAGRAMA DE FLUJO (landscape A4, 2 pages)
# ============================================================
def generar_flujo():
    path = os.path.join(OUT_DIR, "diagrama_flujo_sistema.pdf")
    c = canvas.Canvas(path, pagesize=landscape(A4))
    w, h = landscape(A4)

    # ---- PAGE 1: Public Portal + Patient flow ----
    draw_page_header(c, "Flujo del Sistema (1/2): Portal Publico + Paciente")

    def draw_start_end(x, y, text, color=NAVY):
        c.setFillColor(color)
        c.roundRect(x - 1.5 * cm, y - 0.35 * cm, 3 * cm, 0.7 * cm, 10, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(x, y - 0.1 * cm, text)

    def draw_process(x, y, text, color=PRIMARY):
        bw = max(3.5 * cm, len(text) * 0.14 * cm + 0.8 * cm)
        c.setFillColor(color)
        c.rect(x - bw / 2, y - 0.35 * cm, bw, 0.7 * cm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(x, y - 0.1 * cm, text)

    def draw_decision(x, y, text, color=AMBER):
        size = 0.65 * cm
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(x, y + size)
        p.lineTo(x + size * 1.5, y)
        p.lineTo(x, y - size)
        p.lineTo(x - size * 1.5, y)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 5.5)
        c.drawCentredString(x, y - 0.08 * cm, text)

    def draw_io(x, y, text, color=CYAN):
        bw = max(3 * cm, len(text) * 0.14 * cm + 0.6 * cm)
        offset = 0.2 * cm
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(x - bw / 2 + offset, y + 0.35 * cm)
        p.lineTo(x + bw / 2 + offset, y + 0.35 * cm)
        p.lineTo(x + bw / 2 - offset, y - 0.35 * cm)
        p.lineTo(x - bw / 2 - offset, y - 0.35 * cm)
        p.close()
        c.drawPath(p, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(x, y - 0.1 * cm, text)

    def arrow_down(x, y1, y2):
        c.setStrokeColor(GRAY)
        c.setLineWidth(1)
        c.line(x, y1 - 0.35 * cm, x, y2 + 0.35 * cm)
        c.setFillColor(GRAY)
        p = c.beginPath()
        p.moveTo(x - 2, y2 + 0.35 * cm + 2)
        p.lineTo(x, y2 + 0.35 * cm - 1)
        p.lineTo(x + 2, y2 + 0.35 * cm + 2)
        p.close()
        c.drawPath(p, fill=1, stroke=0)

    def arrow_right(x1, y, x2):
        c.setStrokeColor(GRAY)
        c.setLineWidth(1)
        c.line(x1, y, x2, y)
        c.setFillColor(GRAY)
        p = c.beginPath()
        p.moveTo(x2 - 3, y - 2)
        p.lineTo(x2, y)
        p.lineTo(x2 - 3, y + 2)
        p.close()
        c.drawPath(p, fill=1, stroke=0)

    # Section labels
    def section_label(x, y, text, color):
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x, y, text)
        c.setStrokeColor(color)
        c.setLineWidth(2)
        c.line(x, y - 0.15 * cm, x + len(text) * 0.22 * cm, y - 0.15 * cm)

    # ---- PUBLIC PORTAL FLOW (left side) ----
    sx = 5.5 * cm
    sy = h - 3.5 * cm
    step = 1.6 * cm

    section_label(1 * cm, sy + 0.6 * cm, "Portal Publico (sin login)", GREEN)

    draw_start_end(sx, sy, "INICIO", GREEN)
    arrow_down(sx, sy, sy - step)
    draw_io(sx, sy - step, "Accede al portal web")
    arrow_down(sx, sy - step, sy - 2 * step)
    draw_process(sx, sy - 2 * step, "Seleccionar especialidad")
    arrow_down(sx, sy - 2 * step, sy - 3 * step)
    draw_process(sx, sy - 3 * step, "Seleccionar medico")
    arrow_down(sx, sy - 3 * step, sy - 4 * step)
    draw_process(sx, sy - 4 * step, "Elegir fecha y hora")
    arrow_down(sx, sy - 4 * step, sy - 5 * step)
    draw_decision(sx, sy - 5 * step, "Disponible?")

    # Si branch
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(sx + 1.2 * cm, sy - 5 * step + 0.3 * cm, "Si")
    arrow_down(sx, sy - 5 * step - 0.65 * cm, sy - 6 * step)
    draw_io(sx, sy - 6 * step, "Cargar datos paciente")
    arrow_down(sx, sy - 6 * step, sy - 7 * step)
    draw_process(sx, sy - 7 * step, "Crear turno en BD", GREEN)
    arrow_down(sx, sy - 7 * step, sy - 8 * step)
    draw_process(sx, sy - 8 * step, "Enviar email confirmacion", PRIMARY)
    arrow_down(sx, sy - 8 * step, sy - 9 * step)
    draw_start_end(sx, sy - 9 * step, "TURNO CREADO", GREEN)

    # No branch
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(sx - 2.3 * cm, sy - 5 * step - 0.1 * cm, "No")
    c.setStrokeColor(GRAY)
    c.setLineWidth(1)
    c.line(sx - 1.5 * cm, sy - 5 * step, sx - 3 * cm, sy - 5 * step)
    c.line(sx - 3 * cm, sy - 5 * step, sx - 3 * cm, sy - 3.5 * step)
    # arrow up
    c.line(sx - 3 * cm, sy - 3.5 * step, sx - 1.8 * cm, sy - 3.5 * step)

    # ---- PATIENT FLOW (right side) ----
    px = 19 * cm
    py = h - 3.5 * cm

    section_label(15 * cm, py + 0.6 * cm, "Flujo Paciente (con login)", PRIMARY)

    draw_start_end(px, py, "LOGIN PACIENTE", PRIMARY)
    arrow_down(px, py, py - step)
    draw_decision(px, py - step, "Tiene 2FA?")

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(px + 1.2 * cm, py - step + 0.3 * cm, "No")
    c.setFillColor(AMBER)
    c.drawString(px - 2.2 * cm, py - step - 0.1 * cm, "Si")

    # 2FA path
    c.setStrokeColor(GRAY)
    c.line(px - 1.5 * cm, py - step, px - 3 * cm, py - step)
    c.line(px - 3 * cm, py - step, px - 3 * cm, py - 1.5 * step)
    draw_io(px - 3 * cm, py - 1.5 * step, "Codigo 2FA")
    c.line(px - 3 * cm, py - 1.5 * step - 0.35 * cm, px - 3 * cm, py - 2 * step + 0.35 * cm)
    c.line(px - 3 * cm, py - 2 * step + 0.35 * cm, px - 1.8 * cm, py - 2 * step + 0.35 * cm)

    arrow_down(px, py - step - 0.65 * cm, py - 2 * step)
    draw_process(px, py - 2 * step, "Panel: Mis Turnos")
    arrow_down(px, py - 2 * step, py - 3 * step)
    draw_decision(px, py - 3 * step, "Accion?")

    # Branch: Solicitar turno
    arrow_right(px + 1.5 * cm, py - 3 * step, px + 5 * cm)
    draw_process(px + 6.5 * cm, py - 3 * step, "Solicitar turno")
    arrow_down(px + 6.5 * cm, py - 3 * step, py - 4 * step)
    draw_process(px + 6.5 * cm, py - 4 * step, "Wizard 4 pasos")
    arrow_down(px + 6.5 * cm, py - 4 * step, py - 5 * step)
    draw_start_end(px + 6.5 * cm, py - 5 * step, "TURNO CREADO", GREEN)

    # Branch: Ver perfil
    arrow_down(px, py - 3 * step - 0.65 * cm, py - 4.5 * step)
    draw_process(px, py - 4.5 * step, "Ver perfil / 2FA")

    # Branch: Ver medicos
    c.setStrokeColor(GRAY)
    c.line(px - 1.5 * cm, py - 3 * step, px - 4 * cm, py - 3 * step)
    draw_process(px - 5.5 * cm, py - 3 * step, "Ver medicos")

    draw_page_footer(c, 1)
    c.showPage()

    # ---- PAGE 2: Admin + Doctor flow ----
    draw_page_header(c, "Flujo del Sistema (2/2): Admin + Medico")

    # ---- ADMIN FLOW (left) ----
    ax = 6 * cm
    ay = h - 3.5 * cm

    section_label(1 * cm, ay + 0.6 * cm, "Flujo Administrador", NAVY)

    draw_start_end(ax, ay, "LOGIN ADMIN", NAVY)
    arrow_down(ax, ay, ay - step)
    draw_process(ax, ay - step, "Dashboard (estadisticas)")

    arrow_down(ax, ay - step, ay - 2 * step)
    draw_decision(ax, ay - 2 * step, "Accion?")

    # Branches
    bx = 1.5 * cm
    branches = [
        (bx, "Gestionar Medicos", GREEN),
        (bx + 3.8 * cm, "Gestionar Pacientes", GREEN),
        (bx + 7.6 * cm, "Gestionar Turnos", PRIMARY),
        (bx + 11.4 * cm, "Registrar Pagos", AMBER),
    ]
    for bxi, label, color in branches:
        by = ay - 3.5 * step
        c.setStrokeColor(GRAY)
        c.setLineWidth(1)
        c.line(ax, ay - 2 * step - 0.65 * cm, ax, by + 0.65 * cm)
        c.line(bxi + 1.7 * cm, by + 0.65 * cm, ax, by + 0.65 * cm) if bxi + 1.7 * cm != ax else None
        draw_process(bxi + 1.7 * cm, by, label, color)

    # Second row of admin actions
    row2_branches = [
        (bx, "Reportes + Excel", PURPLE),
        (bx + 3.8 * cm, "Obras Sociales", PRIMARY),
        (bx + 7.6 * cm, "Archivos", CYAN),
        (bx + 11.4 * cm, "Backups", NAVY_LIGHT),
    ]
    for bxi, label, color in row2_branches:
        by2 = ay - 5 * step
        draw_process(bxi + 1.7 * cm, by2, label, color)
        c.setStrokeColor(GRAY)
        c.setLineWidth(0.5)
        c.setDash([2, 2], 0)
        c.line(bxi + 1.7 * cm, ay - 3.5 * step - 0.35 * cm, bxi + 1.7 * cm, by2 + 0.35 * cm)
        c.setDash([], 0)

    # Audit log note
    draw_process(ax, ay - 6.5 * step, "Todas las acciones -> AuditLog", PURPLE)

    # ---- DOCTOR FLOW (right) ----
    dx = 21 * cm
    dy = h - 3.5 * cm

    section_label(16 * cm, dy + 0.6 * cm, "Flujo Medico", GREEN)

    draw_start_end(dx, dy, "LOGIN MEDICO", GREEN)
    arrow_down(dx, dy, dy - step)
    draw_process(dx, dy - step, "Turnos de Hoy")
    arrow_down(dx, dy - step, dy - 2 * step)
    draw_decision(dx, dy - 2 * step, "Paciente?")

    # Llega
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(dx + 1.2 * cm, dy - 2 * step + 0.3 * cm, "Llega")
    arrow_down(dx, dy - 2 * step - 0.65 * cm, dy - 3 * step)
    draw_process(dx, dy - 3 * step, "Marcar COMPLETADO", GREEN)
    arrow_down(dx, dy - 3 * step, dy - 4 * step)
    draw_process(dx, dy - 4 * step, "Agregar nota medica")
    arrow_down(dx, dy - 4 * step, dy - 5 * step)
    draw_decision(dx, dy - 5 * step, "Receta?")

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(dx + 1.2 * cm, dy - 5 * step + 0.3 * cm, "Si")
    arrow_down(dx, dy - 5 * step - 0.65 * cm, dy - 6 * step)
    draw_process(dx, dy - 6 * step, "Crear receta -> PDF", PURPLE)
    arrow_down(dx, dy - 6 * step, dy - 7 * step)
    draw_decision(dx, dy - 7 * step, "Seguimiento?")

    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(dx + 1.2 * cm, dy - 7 * step + 0.3 * cm, "Si")
    arrow_down(dx, dy - 7 * step - 0.65 * cm, dy - 8 * step)
    draw_process(dx, dy - 8 * step, "Marcar seguimiento", AMBER)

    # No llega branch
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(dx - 2.3 * cm, dy - 2 * step - 0.1 * cm, "No llega")
    c.setStrokeColor(GRAY)
    c.setLineWidth(1)
    c.line(dx - 1.5 * cm, dy - 2 * step, dx - 4 * cm, dy - 2 * step)
    draw_process(dx - 5 * cm, dy - 2 * step, "Marcar AUSENTE", RED)

    # Extra: historial
    arrow_right(dx + 1.8 * cm, dy - 4 * step, dx + 4 * cm)
    draw_process(dx + 5.5 * cm, dy - 4 * step, "Ver historial", CYAN)
    arrow_down(dx + 5.5 * cm, dy - 4 * step, dy - 5 * step)
    draw_process(dx + 5.5 * cm, dy - 5 * step, "Timeline visual")

    # Legend
    ly = 1.8 * cm
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(BLACK)
    c.drawString(1 * cm, ly + 0.6 * cm, "Simbologia:")

    symbols = [
        ("Inicio/Fin", NAVY, "rounded"),
        ("Proceso", PRIMARY, "rect"),
        ("Decision", AMBER, "diamond"),
        ("Entrada/Salida", CYAN, "parallelogram"),
    ]
    for i, (label, color, shape) in enumerate(symbols):
        sx2 = 5 * cm + i * 5 * cm
        sy2 = ly + 0.3 * cm
        c.setFillColor(color)
        if shape == "rounded":
            c.roundRect(sx2, sy2, 1 * cm, 0.5 * cm, 5, fill=1, stroke=0)
        elif shape == "rect":
            c.rect(sx2, sy2, 1 * cm, 0.5 * cm, fill=1, stroke=0)
        elif shape == "diamond":
            p = c.beginPath()
            p.moveTo(sx2 + 0.5 * cm, sy2 + 0.5 * cm)
            p.lineTo(sx2 + 1 * cm, sy2 + 0.25 * cm)
            p.lineTo(sx2 + 0.5 * cm, sy2)
            p.lineTo(sx2, sy2 + 0.25 * cm)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
        elif shape == "parallelogram":
            p = c.beginPath()
            p.moveTo(sx2 + 0.15 * cm, sy2 + 0.5 * cm)
            p.lineTo(sx2 + 1.15 * cm, sy2 + 0.5 * cm)
            p.lineTo(sx2 + 0.85 * cm, sy2)
            p.lineTo(sx2 - 0.15 * cm, sy2)
            p.close()
            c.drawPath(p, fill=1, stroke=0)
        c.setFillColor(BLACK)
        c.setFont("Helvetica", 6.5)
        c.drawString(sx2 + 1.3 * cm, sy2 + 0.15 * cm, label)

    draw_page_footer(c, 2)
    c.save()
    print(f"  -> {path}")


# ============================================================
# 3. INFORME COMPLETO (portrait A4, multi-page)
# ============================================================
def generar_informe():
    path = os.path.join(OUT_DIR, "informe_miturnosalud_pro.pdf")

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        'CustomTitle', parent=styles['Title'], fontSize=22,
        textColor=NAVY, spaceAfter=6, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CustomH1', parent=styles['Heading1'], fontSize=16,
        textColor=NAVY, spaceBefore=20, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CustomH2', parent=styles['Heading2'], fontSize=12,
        textColor=PRIMARY, spaceBefore=14, spaceAfter=6, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CustomBody', parent=styles['Normal'], fontSize=10,
        leading=14, alignment=TA_JUSTIFY, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        'CustomSmall', parent=styles['Normal'], fontSize=8,
        leading=11, textColor=GRAY
    ))

    story = []

    # ---- COVER PAGE ----
    story.append(Spacer(1, 5 * cm))
    story.append(Paragraph("MiTurno Salud PRO", styles['CustomTitle']))
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Sistema Integral de Gestion de Turnos Medicos", ParagraphStyle(
        'Subtitle', parent=styles['Normal'], fontSize=14, textColor=GRAY, alignment=TA_CENTER
    )))
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("Informe del Proyecto", ParagraphStyle(
        'SubTitle2', parent=styles['Normal'], fontSize=18, textColor=PRIMARY,
        alignment=TA_CENTER, fontName='Helvetica-Bold'
    )))
    story.append(Spacer(1, 2 * cm))

    cover_data = [
        ["Autor", "Javier Ituarte"],
        ["Institucion", "Universidad - Tesis de grado"],
        ["Tecnologias", "FastAPI + React 19 + PostgreSQL"],
        ["Version", "2.0.0 PRO"],
        ["Fecha", "Mayo 2026"],
    ]
    cover_table = Table(cover_data, colWidths=[5 * cm, 10 * cm])
    cover_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), NAVY),
        ('TEXTCOLOR', (1, 0), (1, -1), BLACK),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, HexColor("#e2e8f0")),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ---- TABLE OF CONTENTS ----
    story.append(Paragraph("Indice", styles['CustomH1']))
    toc_items = [
        "1. Objetivo del Proyecto",
        "2. Arquitectura del Sistema",
        "3. Modelo de Datos (Entidad-Relacion)",
        "4. Roles y Permisos",
        "5. Manual de Uso por Rol",
        "    5.1 Administrador",
        "    5.2 Medico",
        "    5.3 Paciente",
        "    5.4 Portal Publico",
        "6. Funcionalidades Implementadas",
        "7. Seguridad",
        "8. Credenciales de Acceso",
        "9. Roadmap: Mejoras Pendientes",
        "10. Modelo de Negocio",
        "11. Tecnologias Utilizadas",
    ]
    for item in toc_items:
        story.append(Paragraph(item, ParagraphStyle(
            'TOC', parent=styles['Normal'], fontSize=10, leading=18,
            leftIndent=20 if item.startswith("    ") else 0
        )))
    story.append(PageBreak())

    # ---- 1. OBJETIVO ----
    story.append(Paragraph("1. Objetivo del Proyecto", styles['CustomH1']))
    story.append(Paragraph(
        "MiTurno Salud PRO es un sistema SaaS (Software as a Service) disenado para digitalizar "
        "la gestion completa de turnos medicos en clinicas, consultorios y veterinarias. "
        "El objetivo principal es reemplazar las agendas en papel y los sistemas telefónicos "
        "por una plataforma web moderna, accesible desde cualquier dispositivo.",
        styles['CustomBody']
    ))
    story.append(Paragraph("<b>Objetivos especificos:</b>", styles['CustomBody']))
    objectives = [
        "Permitir a los pacientes reservar turnos online las 24 horas sin necesidad de llamar.",
        "Brindar a los medicos una herramienta para gestionar su agenda, notas clinicas y recetas.",
        "Ofrecer al administrador un panel de control con estadisticas, reportes y gestion completa.",
        "Implementar seguridad de nivel empresarial (JWT, 2FA, rate limiting, auditoría).",
        "Funcionar como PWA instalable en celulares sin necesidad de App Store.",
        "Ser desplegable con Docker en cualquier servidor por menos de $12/mes.",
    ]
    for obj in objectives:
        story.append(Paragraph(f"• {obj}", ParagraphStyle(
            'ListItem', parent=styles['CustomBody'], leftIndent=20, bulletIndent=10
        )))
    story.append(PageBreak())

    # ---- 2. ARQUITECTURA ----
    story.append(Paragraph("2. Arquitectura del Sistema", styles['CustomH1']))
    story.append(Paragraph(
        "El sistema utiliza una arquitectura cliente-servidor con separacion total entre frontend y backend, "
        "comunicandose exclusivamente a traves de una API REST + WebSocket.",
        styles['CustomBody']
    ))

    arch_data = [
        ["Capa", "Tecnologia", "Funcion"],
        ["Frontend", "React 19 + Vite 8 + Tailwind CSS 4", "Interfaz de usuario (SPA)"],
        ["Backend", "Python 3.12 + FastAPI", "API REST, logica de negocio"],
        ["Base de datos", "PostgreSQL 15 (SQLAlchemy 2.0)", "Almacenamiento persistente"],
        ["Autenticacion", "JWT + bcrypt + TOTP", "Tokens, hashing, 2FA"],
        ["Real-time", "WebSocket (FastAPI)", "Actualizaciones en vivo"],
        ["Email", "SMTP SSL (smtplib)", "Notificaciones y confirmaciones"],
        ["PDFs", "ReportLab", "Recetas, comprobantes, reportes"],
        ["Deploy", "Docker Compose + Nginx", "Contenedores + reverse proxy"],
        ["CI/CD", "GitHub Actions", "Tests y builds automaticos"],
    ]
    arch_table = Table(arch_data, colWidths=[3.5 * cm, 6 * cm, 6.5 * cm])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (0, -1), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(arch_table)

    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph(
        "<b>Flujo de comunicacion:</b> El navegador del usuario (React) hace peticiones HTTP al backend (FastAPI) "
        "en /api/*. El backend consulta PostgreSQL, procesa la logica y responde en JSON. "
        "Para actualizaciones en tiempo real (ej: sala de espera), se usa WebSocket en /ws/turnos. "
        "Los archivos se almacenan en disco con nombres UUID para evitar colisiones.",
        styles['CustomBody']
    ))
    story.append(PageBreak())

    # ---- 3. MODELO DE DATOS ----
    story.append(Paragraph("3. Modelo de Datos", styles['CustomH1']))
    story.append(Paragraph(
        "El sistema cuenta con 15 tablas organizadas en 4 dominios. "
        "Ver el diagrama entidad-relacion completo en el archivo <b>diagrama_entidad_relacion.pdf</b>.",
        styles['CustomBody']
    ))

    models_data = [
        ["Tabla", "Dominio", "Descripcion"],
        ["Administrador", "Auth", "Usuarios con acceso total al sistema"],
        ["Medico", "Core", "Profesionales de salud con agenda propia"],
        ["Paciente", "Core", "Personas que solicitan turnos"],
        ["Turno", "Core", "Cita medica con fecha, hora, estado y notas"],
        ["Tarifa", "Financiero", "Precio base por especialidad"],
        ["Pago", "Financiero", "Registro de cobros por turno"],
        ["ObraSocial", "Financiero", "Obras sociales/prepagos aceptados"],
        ["Receta", "Soporte", "Prescripcion medica con medicamentos"],
        ["Archivo", "Soporte", "Estudios, radiografias subidas por paciente"],
        ["Notificacion", "Soporte", "Alertas internas del sistema"],
        ["AuditLog", "Seguridad", "Registro de todas las acciones"],
        ["RefreshToken", "Auth", "Tokens de refresco para sesiones"],
        ["PasswordResetToken", "Auth", "Tokens temporales para recuperar password"],
        ["Mascota", "Veterinaria", "Mascotas vinculadas a pacientes (modo vet)"],
    ]
    models_table = Table(models_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
    models_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(models_table)
    story.append(PageBreak())

    # ---- 4. ROLES Y PERMISOS ----
    story.append(Paragraph("4. Roles y Permisos", styles['CustomH1']))

    roles_data = [
        ["Rol", "Acceso", "Restricciones"],
        ["Administrador", "Dashboard, CRUD medicos/pacientes,\nturnos, pagos, reportes,\nobras sociales, archivos, backups", "Acceso total sin restricciones"],
        ["Medico", "Turnos del dia, agenda,\nmis pacientes, historial,\nrecetas, perfil", "Solo ve sus propios turnos\ny pacientes atendidos"],
        ["Paciente", "Mis turnos, solicitar turno,\nmedicos disponibles, perfil", "Solo ve sus propios datos\ny turnos"],
        ["Publico", "Landing, reservar turno,\nsala de espera", "Sin autenticacion,\nacceso limitado"],
    ]
    roles_table = Table(roles_data, colWidths=[3 * cm, 6 * cm, 5 * cm])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(roles_table)
    story.append(PageBreak())

    # ---- 5. MANUAL DE USO ----
    story.append(Paragraph("5. Manual de Uso por Rol", styles['CustomH1']))

    story.append(Paragraph("5.1 Administrador", styles['CustomH2']))
    admin_steps = [
        ("<b>Iniciar sesion:</b> Ir a /login, seleccionar 'Admin', ingresar email y contrasena.",
         "Si tiene 2FA activado, se le pedira el codigo de Google Authenticator."),
        ("<b>Dashboard:</b> Muestra estadisticas del dia: turnos programados, completados, ingresos y pacientes.",
         "Incluye graficos de barras (turnos/mes) y lineas (ingresos semanales)."),
        ("<b>Recepcion:</b> Crear turnos presenciales rapidamente. Buscar paciente, seleccionar medico y horario.",
         ""),
        ("<b>Gestionar Medicos:</b> Crear, editar, activar/desactivar medicos. Asignar especialidad y duracion de consulta.",
         ""),
        ("<b>Gestionar Pacientes:</b> Crear, editar pacientes. Vincular obra social y numero de afiliado.",
         ""),
        ("<b>Turnos:</b> Ver todos los turnos con filtros por fecha, medico y estado. Reprogramar o cancelar.",
         ""),
        ("<b>Tarifas:</b> Configurar precio base por especialidad. Se muestra en comprobantes.",
         ""),
        ("<b>Reportes:</b> Estadisticas por especialidad y rango de fechas. Boton 'Exportar Excel' para descargar.",
         ""),
        ("<b>Pagos:</b> Registrar cobros por turno (monto, metodo, obra social). Ver historial de pagos.",
         ""),
        ("<b>Obras Sociales:</b> CRUD de obras sociales aceptadas (nombre, codigo).",
         ""),
        ("<b>Archivos:</b> Ver y gestionar archivos subidos por paciente (estudios, radiografias).",
         ""),
        ("<b>Backups:</b> Crear backup de la base de datos. Restaurar desde backup anterior.",
         ""),
    ]
    for step, detail in admin_steps:
        story.append(Paragraph(step, styles['CustomBody']))
        if detail:
            story.append(Paragraph(detail, ParagraphStyle(
                'Detail', parent=styles['CustomSmall'], leftIndent=20, spaceAfter=4
            )))

    story.append(Paragraph("5.2 Medico", styles['CustomH2']))
    medico_steps = [
        ("<b>Turnos de Hoy:</b> Lista de todos los turnos del dia ordenados por hora.",
         "Acciones: Completar (tick verde), Ausente (X roja), Nota medica (lapiz), Seguimiento (bandera), Recetar (pastilla)."),
        ("<b>Recetar:</b> Abre un modal para crear una receta. Agregar medicamentos (nombre, dosis, frecuencia).",
         "Al guardar, se genera automaticamente un PDF descargable con la receta."),
        ("<b>Mi Agenda:</b> Calendario con vista mensual/semanal de todos los turnos.",
         ""),
        ("<b>Mis Pacientes:</b> Lista de pacientes que ha atendido. Seleccionar uno para ver/editar notas clinicas.",
         "Boton 'Ver historial' abre la linea de tiempo completa del paciente."),
        ("<b>Historial Clinico:</b> Timeline visual con todos los turnos, notas, archivos y recetas del paciente.",
         "Muestra estadisticas: total consultas, completados, ausencias, archivos."),
        ("<b>Mi Perfil:</b> Editar datos personales. Cambiar contrasena. Activar/desactivar 2FA.",
         ""),
    ]
    for step, detail in medico_steps:
        story.append(Paragraph(step, styles['CustomBody']))
        if detail:
            story.append(Paragraph(detail, ParagraphStyle(
                'Detail', parent=styles['CustomSmall'], leftIndent=20, spaceAfter=4
            )))

    story.append(PageBreak())
    story.append(Paragraph("5.3 Paciente", styles['CustomH2']))
    paciente_steps = [
        ("<b>Mis Turnos:</b> Lista de turnos proximos y pasados con estado (badge de color).",
         ""),
        ("<b>Solicitar Turno:</b> Wizard de 4 pasos: elegir especialidad, medico, fecha/hora, confirmar.",
         "Al completar, recibe email de confirmacion automatico."),
        ("<b>Medicos Disponibles:</b> Grid de cards con medicos activos, especialidad y disponibilidad.",
         ""),
        ("<b>Mi Perfil:</b> Editar datos personales, cambiar contrasena, activar 2FA.",
         ""),
    ]
    for step, detail in paciente_steps:
        story.append(Paragraph(step, styles['CustomBody']))
        if detail:
            story.append(Paragraph(detail, ParagraphStyle(
                'Detail', parent=styles['CustomSmall'], leftIndent=20, spaceAfter=4
            )))

    story.append(Paragraph("5.4 Portal Publico", styles['CustomH2']))
    story.append(Paragraph(
        "El portal publico permite a cualquier persona reservar un turno sin necesidad de crear una cuenta. "
        "Accesible desde la landing page en la ruta /reservar.",
        styles['CustomBody']
    ))
    portal_steps = [
        "1. Seleccionar especialidad medica",
        "2. Elegir medico de la lista",
        "3. Seleccionar fecha y hora disponible",
        "4. Completar datos personales (nombre, email, telefono, DNI opcional)",
        "5. Confirmar reserva -> Se crea cuenta automatica con password temporal",
        "6. Recibe email de confirmacion con los datos del turno",
    ]
    for ps in portal_steps:
        story.append(Paragraph(ps, ParagraphStyle(
            'Step', parent=styles['CustomBody'], leftIndent=15
        )))

    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "<b>Sala de Espera (/sala-de-espera):</b> Pantalla disenada para TV en la recepcion. "
        "Muestra los turnos del dia en tiempo real con nombre parcial del paciente (privacidad), "
        "medico, hora y estado. Se actualiza automaticamente cada 30 segundos y por WebSocket.",
        styles['CustomBody']
    ))
    story.append(PageBreak())

    # ---- 6. FUNCIONALIDADES ----
    story.append(Paragraph("6. Funcionalidades Implementadas", styles['CustomH1']))

    features = [
        ["Funcionalidad", "Estado", "Descripcion"],
        ["Gestion de turnos completa", "Hecho", "CRUD, estados, filtros, reprogramacion"],
        ["Portal publico de reservas", "Hecho", "Wizard 4 pasos sin login"],
        ["Sistema de notificaciones", "Hecho", "Bell con badge, marcar leidas"],
        ["Recetas medicas en PDF", "Hecho", "Medicamentos dinamicos, descarga PDF"],
        ["Historial clinico visual", "Hecho", "Timeline con turnos, notas, archivos"],
        ["2FA con Google Authenticator", "Hecho", "QR code, verificacion TOTP"],
        ["Recuperar contrasena", "Hecho", "Email con token temporal (1h)"],
        ["Exportar reportes a Excel", "Hecho", "Archivo .xlsx con filtros de fecha"],
        ["Comprobantes de pago PDF", "Hecho", "Generacion automatica con reportlab"],
        ["Gestion de archivos", "Hecho", "Upload/download con UUID, por paciente"],
        ["Obras sociales", "Hecho", "CRUD, vinculacion a pacientes"],
        ["Sala de espera TV", "Hecho", "Pantalla publica con WebSocket"],
        ["Dark mode", "Hecho", "Toggle sol/luna, persiste en localStorage"],
        ["PWA instalable", "Hecho", "manifest.json + service worker"],
        ["Rate limiting", "Hecho", "10 req/min en login (slowapi)"],
        ["Audit log", "Hecho", "Registro de acciones en BD"],
        ["Docker + CI/CD", "Hecho", "Docker Compose + GitHub Actions"],
        ["Sidebar navy + logo palpitante", "Hecho", "Diseno profesional con heartbeat CSS"],
    ]
    feat_table = Table(features, colWidths=[5.5 * cm, 2 * cm, 8.5 * cm])
    feat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 1), (1, -1), GREEN),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(feat_table)
    story.append(PageBreak())

    # ---- 7. SEGURIDAD ----
    story.append(Paragraph("7. Seguridad", styles['CustomH1']))
    security_items = [
        ("<b>Autenticacion JWT:</b> Access token (2 horas) + Refresh token (7 dias) con rotacion automatica.",
         "Los tokens se almacenan en localStorage. Al expirar el access token, se renueva automaticamente."),
        ("<b>Hashing de contrasenas:</b> bcrypt con salt automatico. Las contrasenas nunca se guardan en texto plano.",
         ""),
        ("<b>2FA (TOTP):</b> Autenticacion de dos factores opcional con Google Authenticator.",
         "Se genera un QR code unico por usuario. El codigo cambia cada 30 segundos."),
        ("<b>Rate limiting:</b> 10 intentos de login por minuto por IP (slowapi/limits).",
         "Previene ataques de fuerza bruta."),
        ("<b>Validacion de contrasenas:</b> Minimo 8 caracteres. Se valida al crear cuenta y al cambiar.",
         ""),
        ("<b>Reset seguro:</b> Token aleatorio de 32 bytes hex, expira en 1 hora, un solo uso.",
         ""),
        ("<b>Audit log:</b> Todas las acciones criticas quedan registradas (quien, que, cuando).",
         ""),
        ("<b>CORS configurado:</b> Solo permite origenes autorizados en produccion.",
         ""),
    ]
    for item, detail in security_items:
        story.append(Paragraph(item, styles['CustomBody']))
        if detail:
            story.append(Paragraph(detail, ParagraphStyle(
                'Detail', parent=styles['CustomSmall'], leftIndent=20, spaceAfter=4
            )))
    story.append(PageBreak())

    # ---- 8. CREDENCIALES ----
    story.append(Paragraph("8. Credenciales de Acceso (Demo)", styles['CustomH1']))
    story.append(Paragraph(
        "Las siguientes credenciales estan disponibles en el entorno de desarrollo con datos de prueba (SEED_DATA=true):",
        styles['CustomBody']
    ))

    creds_data = [
        ["Rol", "Email", "Contrasena"],
        ["Administrador", "admin@miturnosalud.com", "admin123"],
        ["Medico 1", "garcia@miturnosalud.com", "medico123"],
        ["Medico 2", "lopez@miturnosalud.com", "medico123"],
        ["Paciente 1", "juan.perez@email.com", "paciente123"],
        ["Paciente 2", "maria.gomez@email.com", "paciente123"],
    ]
    creds_table = Table(creds_data, colWidths=[4 * cm, 6.5 * cm, 4.5 * cm])
    creds_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 1), (2, -1), 'Courier'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(creds_table)

    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "<b>URLs de acceso:</b>", styles['CustomBody']
    ))
    urls = [
        "Frontend: http://localhost:5173",
        "Backend API: http://localhost:8000/api/docs (Swagger)",
        "Portal publico: http://localhost:5173/reservar",
        "Sala de espera: http://localhost:5173/sala-de-espera",
    ]
    for u in urls:
        story.append(Paragraph(f"• {u}", ParagraphStyle(
            'URL', parent=styles['CustomBody'], fontName='Courier', fontSize=9, leftIndent=15
        )))
    story.append(PageBreak())

    # ---- 9. ROADMAP ----
    story.append(Paragraph("9. Roadmap: Mejoras Pendientes", styles['CustomH1']))
    story.append(Paragraph(
        "Las siguientes mejoras estan planificadas para futuras versiones del sistema:",
        styles['CustomBody']
    ))

    roadmap_data = [
        ["Mejora", "Prioridad", "Descripcion"],
        ["Calendario drag-and-drop", "Alta", "Vista semanal con react-big-calendar para reprogramar turnos"],
        ["Graficos en Dashboard", "Alta", "Charts con recharts (barras, lineas, tortas)"],
        ["Toast notifications", "Alta", "Mensajes flotantes de exito/error (no alerts)"],
        ["Skeleton loaders", "Alta", "Placeholders animados mientras carga"],
        ["Busqueda global Ctrl+K", "Alta", "Buscar pacientes/turnos/medicos desde cualquier pantalla"],
        ["WhatsApp reminders", "Media", "Recordatorios 24h antes via Twilio/WhatsApp"],
        ["Email automatico dia previo", "Media", "Cron job con recordatorio del turno"],
        ["Agenda configurable", "Media", "Medico define sus horarios (lunes 8-12, etc.)"],
        ["Feriados", "Media", "Configurar dias no laborables"],
        ["Motivos de cancelacion", "Media", "Dropdown obligatorio al cancelar turno"],
        ["Firma digital del medico", "Media", "Canvas para firmar recetas"],
        ["Imprimir ticket turno", "Media", "Formato termico/A4 para recepcion"],
        ["Duplicar turno rapido", "Media", "Agendar siguiente consulta desde turno completado"],
        ["Auto-registro pacientes", "Baja", "Crear cuenta propia desde login"],
        ["Multi-sucursal", "Baja", "Selector de sede en el header"],
        ["MercadoPago/Stripe", "Baja", "Pago online desde portal publico"],
        ["Multi-idioma (i18n)", "Baja", "Soporte ingles/espanol"],
        ["Session timeout", "Baja", "Aviso 'tu sesion expira' con renovacion"],
        ["Exportar datos paciente", "Baja", "Compliance GDPR, boton 'descargar mis datos'"],
    ]
    road_table = Table(roadmap_data, colWidths=[5 * cm, 2.5 * cm, 8.5 * cm])
    road_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 7.5),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1, 1), (1, 5), RED),
        ('TEXTCOLOR', (1, 6), (1, 13), AMBER),
        ('TEXTCOLOR', (1, 14), (1, -1), GREEN),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(road_table)
    story.append(PageBreak())

    # ---- 10. MODELO DE NEGOCIO ----
    story.append(Paragraph("10. Modelo de Negocio", styles['CustomH1']))
    story.append(Paragraph(
        "MiTurno Salud PRO esta disenado como un producto SaaS (Software as a Service) "
        "que no requiere inversion inicial significativa para comenzar a operar.",
        styles['CustomBody']
    ))

    story.append(Paragraph("<b>Costos operativos:</b>", styles['CustomBody']))
    costs = [
        "Servidor VPS (DigitalOcean/Hetzner): $6-12 USD/mes",
        "Dominio .com: ~$12 USD/ano",
        "Email transaccional (Resend/Brevo): gratis hasta 300 emails/dia",
        "SSL: gratis con Let's Encrypt",
        "Total: ~$10 USD/mes para arrancar",
    ]
    for cost in costs:
        story.append(Paragraph(f"• {cost}", ParagraphStyle(
            'Cost', parent=styles['CustomBody'], leftIndent=15
        )))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("<b>Planes de precio sugeridos:</b>", styles['CustomBody']))
    pricing_data = [
        ["Plan", "Precio/mes", "Incluye"],
        ["Basico", "$25 USD", "2 profesionales, turnos, email, soporte basico"],
        ["Profesional", "$60 USD", "8 profesionales, portal reservas, WhatsApp, reportes, obras sociales"],
        ["Clinica", "$120 USD", "Ilimitado, multi-sucursal, soporte 24/7, API, backups"],
    ]
    pricing_table = Table(pricing_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
    pricing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 2), (-1, 2), LIGHT_BLUE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BLUE, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(pricing_table)
    story.append(PageBreak())

    # ---- 11. TECNOLOGIAS ----
    story.append(Paragraph("11. Tecnologias Utilizadas", styles['CustomH1']))

    tech_data = [
        ["Tecnologia", "Version", "Uso"],
        ["Python", "3.12", "Lenguaje backend"],
        ["FastAPI", "0.115+", "Framework API REST"],
        ["SQLAlchemy", "2.0", "ORM para base de datos"],
        ["PostgreSQL", "15", "Base de datos relacional"],
        ["React", "19", "Libreria frontend"],
        ["Vite", "8", "Build tool y dev server"],
        ["Tailwind CSS", "4", "Framework de estilos utilitarios"],
        ["React Router", "6", "Navegacion SPA"],
        ["React Query", "5", "Cache y estado del servidor"],
        ["Axios", "1.7", "Cliente HTTP"],
        ["Lucide React", "1.7", "Iconos SVG"],
        ["ReportLab", "4.2", "Generacion de PDFs"],
        ["openpyxl", "3.1", "Generacion de Excel"],
        ["bcrypt", "4.2", "Hashing de contrasenas"],
        ["PyJWT", "2.9", "Tokens JWT"],
        ["pyotp + qrcode", "2.9 / 8.0", "2FA con TOTP"],
        ["slowapi", "0.1", "Rate limiting"],
        ["Docker", "24+", "Contenedores"],
        ["GitHub Actions", "-", "CI/CD automatizado"],
    ]
    tech_table = Table(tech_data, colWidths=[4 * cm, 2.5 * cm, 9.5 * cm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tech_table)

    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph(
        "Documento generado automaticamente por MiTurno Salud PRO v2.0.0 — Mayo 2026",
        ParagraphStyle('Footer', parent=styles['CustomSmall'], alignment=TA_CENTER)
    ))

    doc = SimpleDocTemplate(
        path, pagesize=A4,
        topMargin=2 * cm, bottomMargin=1.5 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
        title="MiTurno Salud PRO - Informe",
        author="Javier Ituarte"
    )
    doc.build(story)
    print(f"  -> {path}")


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("Generando PDFs...")
    generar_er()
    generar_flujo()
    generar_informe()
    print("\nListo! Los 3 PDFs estan en la carpeta docs/")
