from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    if not fecha_desde:
        fecha_desde = date.today().replace(day=1)
    if not fecha_hasta:
        fecha_hasta = date.today()

    turnos = db.query(models.Turno).filter(
        models.Turno.fecha >= fecha_desde,
        models.Turno.fecha <= fecha_hasta,
    )
    total = turnos.count()
    completados = turnos.filter(models.Turno.estado == "completado").count()
    cancelados = turnos.filter(models.Turno.estado == "cancelado").count()
    ausentes = turnos.filter(models.Turno.estado == "ausente").count()
    programados = turnos.filter(models.Turno.estado == "programado").count()

    # Ingresos estimados
    ingresos = (
        db.query(func.coalesce(func.sum(models.Tarifa.precio_base), 0))
        .select_from(models.Turno)
        .join(models.Medico, models.Turno.id_medico == models.Medico.id)
        .join(models.Tarifa, models.Tarifa.especialidad == models.Medico.especialidad, isouter=True)
        .filter(
            models.Turno.fecha >= fecha_desde,
            models.Turno.fecha <= fecha_hasta,
            models.Turno.estado == "completado",
        )
        .scalar()
    )

    atendidos = completados + ausentes
    tasa = (completados / atendidos * 100) if atendidos > 0 else 0

    return schemas.DashboardStats(
        total_turnos_mes=total,
        completados=completados,
        cancelados=cancelados,
        ausentes=ausentes,
        programados=programados,
        ingresos_estimados=Decimal(str(ingresos or 0)),
        tasa_asistencia=round(tasa, 1),
    )


@router.get("/por-especialidad", response_model=list[schemas.ReporteEspecialidad])
def reporte_por_especialidad(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    db: Session = Depends(get_db),
    _: tuple = Depends(require_admin),
):
    if not fecha_desde:
        fecha_desde = date.today().replace(day=1)
    if not fecha_hasta:
        fecha_hasta = date.today()

    results = (
        db.query(
            models.Medico.especialidad,
            func.sum(case((models.Turno.estado == "completado", 1), else_=0)).label("completados"),
            func.sum(case((models.Turno.estado == "ausente", 1), else_=0)).label("ausentes"),
            func.sum(case((models.Turno.estado == "cancelado", 1), else_=0)).label("cancelados"),
            func.coalesce(models.Tarifa.precio_base, 0).label("precio_base"),
        )
        .select_from(models.Turno)
        .join(models.Medico, models.Turno.id_medico == models.Medico.id)
        .join(models.Tarifa, models.Tarifa.especialidad == models.Medico.especialidad, isouter=True)
        .filter(
            models.Turno.fecha >= fecha_desde,
            models.Turno.fecha <= fecha_hasta,
        )
        .group_by(models.Medico.especialidad, models.Tarifa.precio_base)
        .all()
    )

    return [
        schemas.ReporteEspecialidad(
            especialidad=r.especialidad,
            completados=r.completados or 0,
            ausentes=r.ausentes or 0,
            cancelados=r.cancelados or 0,
            precio_base=Decimal(str(r.precio_base)),
            ingresos_estimados=Decimal(str((r.completados or 0) * float(r.precio_base))),
        )
        for r in results
    ]
