"""Carga datos completos de prueba — simula meses de actividad para clínica médica y veterinaria."""
import json
import random
from datetime import date, time, timedelta, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app import models
from app.auth import hash_password


def seed_database(db: Session):
    """Carga datos solo si la DB está vacía."""
    if db.query(models.Administrador).count() > 0:
        return

    random.seed(42)  # reproducible
    hoy = date.today()
    PASSWORD = hash_password("admin123")
    MED_PASS = hash_password("medico123")
    PAC_PASS = hash_password("paciente123")

    # ════════════════════════════════════════════
    # ADMINISTRADORES
    # ════════════════════════════════════════════
    admin = models.Administrador(
        nombre="Admin Principal",
        email="admin@miturnosalud.com",
        password_hash=PASSWORD,
    )
    db.add(admin)

    admin2 = models.Administrador(
        nombre="Recepcion Turno Mañana",
        email="recepcion@miturnosalud.com",
        password_hash=PASSWORD,
    )
    db.add(admin2)

    # ════════════════════════════════════════════
    # OBRAS SOCIALES
    # ════════════════════════════════════════════
    obras_data = [
        ("OSDE", "OSDE"), ("Swiss Medical", "SWMD"), ("Galeno", "GALE"),
        ("Medife", "MDFE"), ("IOMA", "IOMA"), ("PAMI", "PAMI"),
        ("Particular", "PART"), ("Sancor Salud", "SNCS"),
        ("Hospital Italiano", "HITA"), ("Medicus", "MEDI"),
    ]
    obras = []
    for nombre, codigo in obras_data:
        o = models.ObraSocial(nombre=nombre, codigo=codigo)
        db.add(o)
        obras.append(o)
    db.flush()

    # ════════════════════════════════════════════
    # MÉDICOS (clínica humana + veterinaria)
    # ════════════════════════════════════════════
    medicos_data = [
        # Clínica humana
        ("Dr. Carlos Fernández", "fernandez@miturnosalud.com", "+54 11 5555-0001", "Cardiología", 30),
        ("Dra. María García", "garcia@miturnosalud.com", "+54 11 5555-0002", "Pediatría", 20),
        ("Dr. Alejandro Martínez", "martinez@miturnosalud.com", "+54 11 5555-0003", "Traumatología", 30),
        ("Dra. Laura Sánchez", "sanchez@miturnosalud.com", "+54 11 5555-0004", "Dermatología", 20),
        ("Dr. Pablo Gutiérrez", "gutierrez@miturnosalud.com", "+54 11 5555-0005", "Clínica Médica", 30),
        ("Dra. Valentina Romero", "romero@miturnosalud.com", "+54 11 5555-0006", "Neurología", 45),
        ("Dr. Martín Herrera", "herrera@miturnosalud.com", "+54 11 5555-0007", "Ginecología", 30),
        ("Dra. Camila Morales", "morales@miturnosalud.com", "+54 11 5555-0008", "Oftalmología", 20),
        # Veterinaria
        ("Dr. Vet. Lucas Pereyra", "pereyra@miturnosalud.com", "+54 11 5555-0009", "Veterinaria General", 30),
        ("Dra. Vet. Sofía Álvarez", "alvarez@miturnosalud.com", "+54 11 5555-0010", "Cirugía Veterinaria", 45),
        ("Dr. Vet. Nicolás Castro", "castro@miturnosalud.com", "+54 11 5555-0011", "Dermatología Veterinaria", 30),
    ]
    medicos = []
    for nombre, email, tel, esp, dur in medicos_data:
        m = models.Medico(
            nombre=nombre, email=email, telefono=tel,
            especialidad=esp, password_hash=MED_PASS,
            duracion_consulta=dur,
        )
        db.add(m)
        medicos.append(m)
    db.flush()

    # ════════════════════════════════════════════
    # TARIFAS
    # ════════════════════════════════════════════
    tarifas_data = [
        ("Clínica Médica", 25000), ("Cardiología", 40000), ("Pediatría", 28000),
        ("Traumatología", 35000), ("Dermatología", 30000), ("Ginecología", 32000),
        ("Neurología", 45000), ("Oftalmología", 38000),
        ("Veterinaria General", 18000), ("Cirugía Veterinaria", 55000),
        ("Dermatología Veterinaria", 22000),
    ]
    for esp, precio in tarifas_data:
        db.add(models.Tarifa(especialidad=esp, precio_base=precio))

    # ════════════════════════════════════════════
    # PACIENTES (humanos + dueños de mascotas)
    # ════════════════════════════════════════════
    pacientes_humanos = [
        ("María López", "28456789", "mlopez@email.com", "+54 11 4444-1111", date(1985, 3, 15), "Av. Corrientes 1234, CABA"),
        ("Carlos Ruiz", "35123456", "cruiz@email.com", "+54 11 4444-2222", date(1990, 7, 22), "Calle Rivadavia 567, CABA"),
        ("Ana Torres", "30789012", "atorres@email.com", "+54 11 4444-3333", date(1988, 11, 8), "Av. Santa Fe 890, CABA"),
        ("Roberto Díaz", "42345678", "rdiaz@email.com", "+54 11 4444-4444", date(1995, 1, 30), "Calle Florida 234, CABA"),
        ("Luciana Mendoza", "33567890", "lmendoza@email.com", "+54 11 4444-5555", date(1992, 5, 12), "Av. Belgrano 456, CABA"),
        ("Diego Acosta", "29876543", "dacosta@email.com", "+54 11 4444-6666", date(1980, 9, 3), "Calle Lavalle 789, CABA"),
        ("Florencia Vega", "40123456", "fvega@email.com", "+54 11 4444-7777", date(1998, 2, 18), "Av. de Mayo 321, CABA"),
        ("Martín Sosa", "31456789", "msosa@email.com", "+54 11 4444-8888", date(1987, 12, 25), "Calle Callao 654, CABA"),
        ("Valentina Ríos", "36789012", "vrios@email.com", "+54 11 4444-9999", date(1993, 8, 7), "Av. Pueyrredón 987, CABA"),
        ("Javier Romero", "27345678", "jromero@email.com", "+54 11 4444-0000", date(1978, 4, 20), "Calle Junín 135, CABA"),
        ("Camila Herrera", "38901234", "cherrera@email.com", "+54 11 3333-1111", date(1996, 6, 14), "Av. Cabildo 246, CABA"),
        ("Sebastián Paz", "34567890", "spaz@email.com", "+54 11 3333-2222", date(1991, 10, 9), "Calle Arenales 579, CABA"),
        ("Julieta Navarro", "41234567", "jnavarro@email.com", "+54 11 3333-3333", date(1997, 1, 22), "Av. Córdoba 810, CABA"),
        ("Gonzalo Medina", "32678901", "gmedina@email.com", "+54 11 3333-4444", date(1989, 7, 5), "Calle Tucumán 147, CABA"),
        ("Agustina Ferrer", "37890123", "aferrer@email.com", "+54 11 3333-5555", date(1994, 3, 28), "Av. Las Heras 369, CABA"),
        ("Nicolás Luna", "43012345", "nluna@email.com", "+54 11 3333-6666", date(1999, 11, 16), "Calle Suipacha 480, CABA"),
        ("Daniela Giménez", "26234567", "dgimenez@email.com", "+54 11 3333-7777", date(1976, 8, 30), "Av. Independencia 612, CABA"),
        ("Tomás Figueroa", "39456789", "tfigueroa@email.com", "+54 11 3333-8888", date(1995, 5, 4), "Calle Maipú 753, CABA"),
        ("Carolina Peralta", "35678901", "cperalta@email.com", "+54 11 3333-9999", date(1990, 12, 11), "Av. San Juan 894, CABA"),
        ("Matías Ojeda", "30890123", "mojeda@email.com", "+54 11 3333-0000", date(1986, 2, 7), "Calle Viamonte 126, CABA"),
    ]
    pacientes = []
    for i, (nombre, dni, email, tel, nac, dire) in enumerate(pacientes_humanos):
        os_id = obras[i % len(obras)].id if i % 3 != 0 else None
        p = models.Paciente(
            nombre=nombre, dni=dni, email=email, telefono=tel,
            fecha_nacimiento=nac, direccion=dire,
            password_hash=PAC_PASS,
            obra_social_id=os_id,
            numero_afiliado=f"AF-{random.randint(100000, 999999)}" if os_id else None,
        )
        db.add(p)
        pacientes.append(p)
    db.flush()

    # ════════════════════════════════════════════
    # MASCOTAS (para la parte veterinaria)
    # ════════════════════════════════════════════
    mascotas_data = [
        ("Rocky", "Perro", "Labrador Retriever", 32.5, date(2019, 3, 10), pacientes[0]),
        ("Mia", "Gato", "Siamés", 4.2, date(2020, 8, 15), pacientes[0]),
        ("Thor", "Perro", "Pastor Alemán", 38.0, date(2018, 1, 20), pacientes[1]),
        ("Luna", "Gato", "Persa", 5.1, date(2021, 5, 3), pacientes[2]),
        ("Max", "Perro", "Golden Retriever", 30.0, date(2020, 11, 12), pacientes[3]),
        ("Coco", "Perro", "Caniche", 6.8, date(2019, 7, 8), pacientes[4]),
        ("Simba", "Gato", "Bengalí", 5.5, date(2021, 2, 14), pacientes[5]),
        ("Toby", "Perro", "Bulldog Francés", 12.3, date(2020, 4, 1), pacientes[6]),
        ("Nina", "Perro", "Beagle", 14.0, date(2019, 9, 22), pacientes[7]),
        ("Salem", "Gato", "Negro doméstico", 4.8, date(2022, 1, 5), pacientes[8]),
        ("Bruno", "Perro", "Rottweiler", 42.0, date(2018, 6, 18), pacientes[9]),
        ("Kira", "Perro", "Border Collie", 18.5, date(2020, 10, 30), pacientes[10]),
        ("Pelusa", "Conejo", "Holland Lop", 2.1, date(2022, 3, 15), pacientes[11]),
        ("Firulais", "Perro", "Mestizo", 15.0, date(2017, 12, 1), pacientes[12]),
        ("Nala", "Gato", "Maine Coon", 7.2, date(2021, 7, 9), pacientes[13]),
    ]
    mascotas = []
    for nombre, esp, raza, peso, nac, dueno in mascotas_data:
        m = models.Mascota(
            nombre=nombre, especie=esp, raza=raza,
            peso_kg=peso, fecha_nacimiento=nac,
            id_dueno=dueno.id,
            notas=random.choice([
                "", "Alergia a pollo", "Nervioso en consultorio",
                "Tratamiento crónico", "Vacunas al día", "",
            ]),
        )
        db.add(m)
        mascotas.append(m)
    db.flush()

    # ════════════════════════════════════════════
    # HORARIOS MÉDICOS
    # ════════════════════════════════════════════
    for med in medicos:
        for dia in range(0, 6):  # Lun-Sab
            if dia == 5 and random.random() > 0.4:
                continue  # muchos no trabajan sábados
            db.add(models.HorarioMedico(
                id_medico=med.id,
                dia_semana=dia,
                hora_inicio="08:00" if dia < 5 else "09:00",
                hora_fin="18:00" if dia < 5 else "13:00",
                intervalo_minutos=med.duracion_consulta,
                activo=True,
            ))

    # ════════════════════════════════════════════
    # TURNOS — últimos 6 meses de actividad
    # ════════════════════════════════════════════
    motivos_clinica = [
        "Control de rutina", "Dolor de cabeza persistente", "Control cardiológico",
        "Dolor lumbar", "Consulta dermatológica", "Chequeo general",
        "Control pediátrico", "Seguimiento tratamiento", "Consulta por alergia",
        "Dolor articular", "Control de presión", "Vacunación",
        "Control prenatal", "Revisión oftalmológica", "Dolor cervical",
        "Control de colesterol", "Consulta por mareos", "Control post-operatorio",
        "Estudio de rutina", "Consulta por erupción cutánea",
        "Dolor abdominal", "Control de diabetes", "Fiebre persistente",
        "Control neurológico", "Estudio pre-quirúrgico",
    ]
    motivos_vet = [
        "Vacunación anual", "Control general", "Desparasitación",
        "Castración/esterilización", "Problema dermatológico",
        "Vómitos frecuentes", "Cojera pata trasera", "Control post-cirugía",
        "Limpieza dental", "Otitis", "Control de peso",
        "Alergia alimentaria", "Consulta por bulto", "Radiografía",
        "Análisis de sangre", "Consulta por diarrea",
    ]
    notas_medicas = [
        "Paciente evoluciona favorablemente. Continuar tratamiento.",
        "Se solicitan estudios complementarios.",
        "Se indica reposo relativo por 7 días.",
        "Control en 30 días. Mantener medicación actual.",
        "Se ajusta dosis de medicación.",
        "Signos vitales normales. Sin novedades.",
        "Se deriva a especialista para evaluación.",
        "Mejoría notable respecto a consulta anterior.",
        "Se indica fisioterapia 3 veces por semana.",
        "Resultado de laboratorio dentro de parámetros normales.",
        "Se recomienda cambio de alimentación.",
        "Vacunas aplicadas correctamente. Próxima dosis en 1 año.",
        "",
    ]
    motivos_cancelacion_pool = [
        "Paciente solicitó cancelación", "Médico no disponible",
        "Reagendado para otra fecha", "Emergencia médica",
    ]

    medicos_clinica = medicos[:8]
    medicos_vet = medicos[8:]
    turnos = []

    # Generar 6 meses de turnos
    fecha_inicio = hoy - timedelta(days=180)
    fecha_actual = fecha_inicio

    while fecha_actual <= hoy + timedelta(days=14):
        dow = fecha_actual.weekday()  # 0=lun
        if dow == 6:  # domingo no
            fecha_actual += timedelta(days=1)
            continue

        # Turnos clínica humana (5-12 por día laboral)
        n_turnos_clinica = random.randint(5, 12) if dow < 5 else random.randint(2, 5)
        for _ in range(n_turnos_clinica):
            pac = random.choice(pacientes)
            med = random.choice(medicos_clinica)
            hora_h = random.randint(8, 18)
            hora_m = random.choice([0, 30])
            if hora_h == 18 and hora_m == 30:
                hora_m = 0

            if fecha_actual < hoy - timedelta(days=7):
                # Pasado: mayormente completados
                r = random.random()
                if r < 0.70:
                    estado = "completado"
                elif r < 0.85:
                    estado = "ausente"
                elif r < 0.95:
                    estado = "cancelado"
                else:
                    estado = "programado"
            elif fecha_actual < hoy:
                r = random.random()
                if r < 0.60:
                    estado = "completado"
                elif r < 0.80:
                    estado = "ausente"
                elif r < 0.90:
                    estado = "cancelado"
                else:
                    estado = "programado"
            else:
                estado = "programado"

            t = models.Turno(
                id_paciente=pac.id, id_medico=med.id,
                fecha=fecha_actual, hora=time(hora_h, hora_m),
                motivo=random.choice(motivos_clinica),
                estado=estado,
                telefono_paciente=pac.telefono,
                creado_por=random.choice(["admin", "paciente", "recepcion"]),
                nota_medica=random.choice(notas_medicas) if estado == "completado" else "",
                necesita_seguimiento=random.random() < 0.15 if estado == "completado" else False,
                motivo_cancelacion=random.choice(motivos_cancelacion_pool) if estado == "cancelado" else None,
            )
            db.add(t)
            turnos.append(t)

        # Turnos veterinaria (2-6 por día)
        n_turnos_vet = random.randint(2, 6) if dow < 5 else random.randint(1, 3)
        for _ in range(n_turnos_vet):
            # Dueños de mascotas
            pac_idx = random.randint(0, min(14, len(pacientes) - 1))
            pac = pacientes[pac_idx]
            med = random.choice(medicos_vet)
            hora_h = random.randint(9, 17)
            hora_m = random.choice([0, 30])

            if fecha_actual < hoy - timedelta(days=7):
                r = random.random()
                if r < 0.72:
                    estado = "completado"
                elif r < 0.85:
                    estado = "ausente"
                elif r < 0.93:
                    estado = "cancelado"
                else:
                    estado = "programado"
            elif fecha_actual < hoy:
                r = random.random()
                if r < 0.55:
                    estado = "completado"
                elif r < 0.75:
                    estado = "ausente"
                elif r < 0.88:
                    estado = "cancelado"
                else:
                    estado = "programado"
            else:
                estado = "programado"

            mascota_nombre = ""
            pac_mascotas = [m for m in mascotas if m.id_dueno == pac.id]
            if pac_mascotas:
                mascota_nombre = f" (mascota: {random.choice(pac_mascotas).nombre})"

            t = models.Turno(
                id_paciente=pac.id, id_medico=med.id,
                fecha=fecha_actual, hora=time(hora_h, hora_m),
                motivo=random.choice(motivos_vet) + mascota_nombre,
                estado=estado,
                telefono_paciente=pac.telefono,
                creado_por=random.choice(["admin", "paciente", "recepcion"]),
                nota_medica=random.choice(notas_medicas) if estado == "completado" else "",
                necesita_seguimiento=random.random() < 0.20 if estado == "completado" else False,
                motivo_cancelacion=random.choice(motivos_cancelacion_pool) if estado == "cancelado" else None,
            )
            db.add(t)
            turnos.append(t)

        fecha_actual += timedelta(days=1)

    db.flush()

    # ════════════════════════════════════════════
    # PAGOS (para turnos completados)
    # ════════════════════════════════════════════
    metodos_pago = ["Efectivo", "Tarjeta débito", "Tarjeta crédito", "Transferencia", "MercadoPago"]
    for t in turnos:
        if t.estado == "completado" and random.random() < 0.80:
            tarifa = db.query(models.Tarifa).filter(
                models.Tarifa.especialidad == t.medico.especialidad
            ).first()
            monto = float(tarifa.precio_base) if tarifa else 25000
            # variación de precio
            monto = monto * random.uniform(0.85, 1.15)
            db.add(models.Pago(
                id_turno=t.id,
                monto=round(monto, 2),
                metodo=random.choice(metodos_pago),
                estado="pagado",
                obra_social=t.paciente.obra_social.nombre if t.paciente.obra_social else "",
            ))

    # ════════════════════════════════════════════
    # RECETAS (para algunos turnos completados)
    # ════════════════════════════════════════════
    medicamentos_pool = [
        [{"nombre": "Ibuprofeno 400mg", "dosis": "1 comprimido cada 8 horas", "duracion": "5 días"}],
        [{"nombre": "Amoxicilina 500mg", "dosis": "1 cápsula cada 8 horas", "duracion": "7 días"},
         {"nombre": "Omeprazol 20mg", "dosis": "1 en ayunas", "duracion": "7 días"}],
        [{"nombre": "Enalapril 10mg", "dosis": "1 comprimido por día", "duracion": "30 días"},
         {"nombre": "Aspirina 100mg", "dosis": "1 con almuerzo", "duracion": "30 días"}],
        [{"nombre": "Paracetamol 500mg", "dosis": "1 cada 6 horas si hay dolor", "duracion": "3 días"}],
        [{"nombre": "Loratadina 10mg", "dosis": "1 por día", "duracion": "15 días"}],
        [{"nombre": "Prednisolona 5mg", "dosis": "1 cada 12 horas", "duracion": "10 días"},
         {"nombre": "Cetirizina 10mg", "dosis": "1 por la noche", "duracion": "10 días"}],
        [{"nombre": "Metformina 850mg", "dosis": "1 con desayuno y cena", "duracion": "30 días"}],
        [{"nombre": "Diclofenac 75mg", "dosis": "1 cada 12 horas", "duracion": "5 días"},
         {"nombre": "Misoprostol 200mcg", "dosis": "1 cada 12 horas", "duracion": "5 días"}],
    ]
    indicaciones_pool = [
        "Reposo relativo. Evitar esfuerzos físicos. Control en 7 días.",
        "Tomar con alimentos. No suspender tratamiento sin consultar.",
        "Dieta baja en sodio. Hidratación abundante. Control en 30 días.",
        "Aplicar frío local 3 veces al día. Evitar movimientos bruscos.",
        "Evitar exposición solar prolongada durante el tratamiento.",
        "Control de presión arterial diario. Anotar valores.",
        "Si presenta efectos adversos, suspender y consultar de inmediato.",
        "Mantener zona limpia y seca. Control en 10 días.",
    ]
    turnos_completados = [t for t in turnos if t.estado == "completado"]
    for t in random.sample(turnos_completados, min(len(turnos_completados) // 4, 200)):
        db.add(models.Receta(
            id_turno=t.id, id_medico=t.id_medico, id_paciente=t.id_paciente,
            medicamentos=json.dumps(random.choice(medicamentos_pool)),
            indicaciones=random.choice(indicaciones_pool),
            fecha=t.fecha,
        ))

    # ════════════════════════════════════════════
    # NOTIFICACIONES
    # ════════════════════════════════════════════
    notif_templates = [
        ("turno", "Nuevo turno asignado", "Turno programado con {pac} el {fecha}"),
        ("turno", "Turno confirmado", "Tu turno del {fecha} a las {hora} fue confirmado"),
        ("turno", "Turno cancelado", "El turno del {fecha} fue cancelado"),
        ("pago", "Pago registrado", "Se registró un pago de ${monto} por consulta del {fecha}"),
        ("info", "Recordatorio", "Recordá tu turno de mañana {fecha} a las {hora}"),
        ("turno", "Turno completado", "La consulta del {fecha} con {med} fue completada"),
    ]
    recent_turnos = [t for t in turnos if t.fecha >= hoy - timedelta(days=30)]
    for t in random.sample(recent_turnos, min(60, len(recent_turnos))):
        tmpl = random.choice(notif_templates)
        msg = tmpl[2].format(
            pac=t.paciente.nombre, med=t.medico.nombre,
            fecha=t.fecha.strftime("%d/%m/%Y"),
            hora=t.hora.strftime("%H:%M"),
            monto=random.randint(20000, 50000),
        )
        db.add(models.Notificacion(
            usuario_email=random.choice([t.medico.email, t.paciente.email, "admin@miturnosalud.com"]),
            usuario_rol=random.choice(["admin", "medico", "paciente"]),
            titulo=tmpl[1], mensaje=msg,
            leida=random.random() < 0.6,
            tipo=tmpl[0],
        ))

    # ════════════════════════════════════════════
    # AUDIT LOG
    # ════════════════════════════════════════════
    acciones = ["login", "crear_turno", "cancelar_turno", "completar_turno", "editar_paciente", "crear_pago", "exportar_excel"]
    for _ in range(100):
        user_email = random.choice([
            "admin@miturnosalud.com", "recepcion@miturnosalud.com",
        ] + [m.email for m in medicos[:5]])
        db.add(models.AuditLog(
            usuario_email=user_email,
            usuario_rol="admin" if "admin" in user_email or "recepcion" in user_email else "medico",
            accion=random.choice(acciones),
            detalle=f"Operación realizada sobre turno #{random.randint(1, len(turnos))}",
        ))

    db.commit()

    total_turnos = len(turnos)
    completados = sum(1 for t in turnos if t.estado == "completado")
    print(f"✅ Seed completo:")
    print(f"   • {len(medicos)} médicos ({len(medicos_clinica)} clínica + {len(medicos_vet)} veterinaria)")
    print(f"   • {len(pacientes)} pacientes")
    print(f"   • {len(mascotas)} mascotas")
    print(f"   • {total_turnos} turnos (6 meses de actividad)")
    print(f"   • {completados} completados, {sum(1 for t in turnos if t.estado == 'ausente')} ausentes, {sum(1 for t in turnos if t.estado == 'cancelado')} cancelados")
    print(f"   • Obras sociales, pagos, recetas, notificaciones cargados")
    print(f"   🔐 Credenciales: admin/admin123 | medico: fernandez@.../medico123 | paciente: mlopez@.../paciente123")
