"""Carga datos iniciales de prueba en la base de datos."""
from datetime import date, time, timedelta
from sqlalchemy.orm import Session
from app import models
from app.auth import hash_password


def seed_database(db: Session):
    """Carga datos solo si la DB está vacía."""
    if db.query(models.Administrador).count() > 0:
        return

    # ── Admin ──
    admin = models.Administrador(
        nombre="Admin Principal",
        email="admin@miturnosalud.com",
        password_hash=hash_password("admin123"),
    )
    db.add(admin)

    # ── Médicos ──
    medicos_data = [
        ("Dr. Carlos Fernández", "fernandez@miturnosalud.com", "+54 11 5555-0001", "Cardiología"),
        ("Dra. María García", "garcia@miturnosalud.com", "+54 11 5555-0002", "Pediatría"),
        ("Dr. Alejandro Martínez", "martinez@miturnosalud.com", "+54 11 5555-0003", "Traumatología"),
        ("Dra. Laura Sánchez", "sanchez@miturnosalud.com", "+54 11 5555-0004", "Dermatología"),
        ("Dr. Pablo Gutiérrez", "gutierrez@miturnosalud.com", "+54 11 5555-0005", "Clínica Médica"),
        ("Dra. Valentina Romero", "romero@miturnosalud.com", "+54 11 5555-0006", "Neurología"),
    ]
    medicos = []
    for nombre, email, tel, esp in medicos_data:
        m = models.Medico(
            nombre=nombre, email=email, telefono=tel, especialidad=esp,
            password_hash=hash_password("medico123"),
        )
        db.add(m)
        medicos.append(m)

    # ── Pacientes ──
    pacientes_data = [
        ("María López", "28456789", "mlopez@email.com", "+54 11 4444-1111", date(1985, 3, 15), "Av. Corrientes 1234"),
        ("Carlos Ruiz", "35123456", "cruiz@email.com", "+54 11 4444-2222", date(1990, 7, 22), "Calle Rivadavia 567"),
        ("Ana Torres", "30789012", "atorres@email.com", "+54 11 4444-3333", date(1988, 11, 8), "Av. Santa Fe 890"),
        ("Roberto Díaz", "42345678", "rdiaz@email.com", "+54 11 4444-4444", date(1995, 1, 30), "Calle Florida 234"),
    ]
    pacientes = []
    for nombre, dni, email, tel, nacimiento, dire in pacientes_data:
        p = models.Paciente(
            nombre=nombre, dni=dni, email=email, telefono=tel,
            fecha_nacimiento=nacimiento, direccion=dire,
            password_hash=hash_password("paciente123"),
        )
        db.add(p)
        pacientes.append(p)

    db.flush()  # Get IDs

    # ── Tarifas ──
    tarifas = [
        ("Clínica Médica", 25000), ("Cardiología", 40000), ("Pediatría", 28000),
        ("Traumatología", 35000), ("Dermatología", 30000), ("Ginecología", 32000),
        ("Neurología", 45000), ("Oftalmología", 38000),
    ]
    for esp, precio in tarifas:
        db.add(models.Tarifa(especialidad=esp, precio_base=precio))

    # ── Turnos de ejemplo (hoy y próximos días) ──
    hoy = date.today()
    turnos_data = [
        (pacientes[0], medicos[0], hoy, time(8, 0), "Control cardiológico", "completado"),
        (pacientes[1], medicos[1], hoy, time(8, 30), "Control pediátrico", "completado"),
        (pacientes[2], medicos[2], hoy, time(9, 0), "Dolor de espalda", "programado"),
        (pacientes[3], medicos[3], hoy, time(9, 30), "Consulta dermatológica", "programado"),
        (pacientes[0], medicos[0], hoy, time(10, 0), "Seguimiento", "programado"),
        (pacientes[1], medicos[2], hoy, time(10, 30), "Dolor cervical", "programado"),
        (pacientes[2], medicos[1], hoy, time(11, 0), "Vacunación", "programado"),
        (pacientes[3], medicos[4], hoy, time(11, 30), "Chequeo general", "programado"),
        # Próximos días
        (pacientes[0], medicos[2], hoy + timedelta(days=1), time(9, 0), "Control post-op", "programado"),
        (pacientes[1], medicos[0], hoy + timedelta(days=1), time(10, 0), "Electrocardiograma", "programado"),
        (pacientes[2], medicos[5], hoy + timedelta(days=2), time(8, 30), "Consulta neurológica", "programado"),
        (pacientes[3], medicos[1], hoy + timedelta(days=2), time(9, 30), "Control", "programado"),
    ]
    for pac, med, fecha, hora, motivo, estado in turnos_data:
        t = models.Turno(
            id_paciente=pac.id, id_medico=med.id,
            fecha=fecha, hora=hora, motivo=motivo, estado=estado,
            telefono_paciente=pac.telefono, creado_por="admin",
        )
        if estado == "completado":
            t.nota_medica = "Paciente evoluciona bien."
        db.add(t)

    # ── Obras Sociales ──
    obras_sociales_data = [
        ("OSDE", "OSDE"),
        ("Swiss Medical", "SWMD"),
        ("Galeno", "GALE"),
        ("Medife", "MDFE"),
        ("IOMA", "IOMA"),
        ("PAMI", "PAMI"),
        ("Particular", "PART"),
    ]
    for nombre, codigo in obras_sociales_data:
        db.add(models.ObraSocial(nombre=nombre, codigo=codigo))

    db.commit()
    print("Datos de prueba cargados correctamente.")
