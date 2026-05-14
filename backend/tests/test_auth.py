def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_invalid_credentials(client):
    r = client.post("/api/auth/login", json={"email": "nonexistent@test.com", "password": "wrong", "rol": "admin"})
    assert r.status_code == 401


def test_login_invalid_rol(client):
    r = client.post("/api/auth/login", json={"email": "test@test.com", "password": "test", "rol": "superadmin"})
    assert r.status_code == 400


def test_me_unauthorized(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def _create_admin(db):
    from app.auth import hash_password
    from app import models
    admin = models.Administrador(nombre="Test Admin", email="admin@test.com", password_hash=hash_password("Admin123"))
    db.add(admin)
    db.commit()
    return admin


def test_login_success(client, db):
    _create_admin(db)
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123", "rol": "admin"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["rol"] == "admin"


def test_me_with_token(client, db):
    _create_admin(db)
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123", "rol": "admin"})
    token = r.json()["access_token"]
    r2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "admin@test.com"


def test_password_policy_weak(client, db):
    _create_admin(db)
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123", "rol": "admin"})
    token = r.json()["access_token"]
    r2 = client.put("/api/auth/cambiar-password", json={"password_actual": "Admin123", "password_nueva": "weak"}, headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 400


def test_refresh_token(client, db):
    _create_admin(db)
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin123", "rol": "admin"})
    rt = r.json()["refresh_token"]
    r2 = client.post("/api/auth/refresh", json={"refresh_token": rt})
    assert r2.status_code == 200
    assert "access_token" in r2.json()
