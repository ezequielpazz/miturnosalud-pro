# MiTurno Salud PRO

Sistema de gestión de turnos médicos con roles diferenciados para administradores, médicos y pacientes. Proyecto de tesis universitaria.

## Tecnologías

**Backend**
- Python 3.12 · FastAPI · SQLAlchemy 2.0 · Alembic
- Autenticación JWT · PostgreSQL (prod) / SQLite (dev)

**Frontend**
- React 19 · Vite · Tailwind CSS 4
- React Query · React Router DOM 6 · Axios

**Infraestructura**
- Docker · Docker Compose · Nginx

## Características

- Roles: Administrador, Médico, Paciente
- Gestión de turnos con estados: Programado, Completado, Cancelado, Ausente
- Agenda médica con disponibilidad por especialidad
- Reportes y estadísticas
- Sistema de backups
- Audit log de acciones

## Inicio rápido

### Con Docker (recomendado)

```bash
git clone https://github.com/tu-usuario/miturnosalud-pro.git
cd miturnosalud-pro
docker compose up --build
```

Acceder en `http://localhost`

### Desarrollo local

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000` · Docs en `http://localhost:8000/docs`

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

App disponible en `http://localhost:5173`

## Variables de entorno

Copiar `backend/.env.example` como `backend/.env` y completar los valores.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a la base de datos |
| `SECRET_KEY` | Clave secreta para firmar JWT |
| `CORS_ORIGINS` | Orígenes permitidos (JSON array) |

## Estructura del proyecto

```
miturnosalud-pro/
├── backend/
│   ├── app/
│   │   ├── main.py         # Inicialización FastAPI
│   │   ├── models.py       # Modelos SQLAlchemy
│   │   ├── schemas.py      # Schemas Pydantic
│   │   ├── auth.py         # Lógica de autenticación
│   │   └── routers/        # Endpoints por dominio
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/          # Vistas por rol
│   │   ├── components/     # Componentes reutilizables
│   │   ├── context/        # AuthContext
│   │   └── lib/            # Cliente Axios
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Usuarios de prueba (seed)

Al iniciar la app por primera vez se crean usuarios de ejemplo. Ver `backend/app/seed.py` para credenciales.

## Licencia

Proyecto académico — Universidad [nombre de tu facultad].
