def test_especialidades_empty(client):
    r = client.get("/api/publico/especialidades")
    assert r.status_code == 200
    assert r.json() == []


def _seed_medico(db):
    from app.auth import hash_password
    from app import models
    m = models.Medico(nombre="Dr. Test", email="doc@test.com", telefono="123", especialidad="Cardio", password_hash=hash_password("Medico123"))
    db.add(m)
    db.commit()
    return m


def test_especialidades_with_medico(client, db):
    _seed_medico(db)
    r = client.get("/api/publico/especialidades")
    assert r.status_code == 200
    assert "Cardio" in r.json()


def test_medicos_by_especialidad(client, db):
    _seed_medico(db)
    r = client.get("/api/publico/medicos", params={"especialidad": "Cardio"})
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["nombre"] == "Dr. Test"


def test_disponibilidad(client, db):
    m = _seed_medico(db)
    from datetime import date, timedelta
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    r = client.get("/api/publico/disponibilidad", params={"id_medico": m.id, "fecha": tomorrow})
    assert r.status_code == 200
    assert len(r.json()) > 0
