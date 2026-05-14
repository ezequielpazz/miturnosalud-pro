from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, medicos, pacientes, turnos, tarifas, reportes, backups

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — permite frontend en otro puerto
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(medicos.router)
app.include_router(pacientes.router)
app.include_router(turnos.router)
app.include_router(tarifas.router)
app.include_router(reportes.router)
app.include_router(backups.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    if settings.SEED_DATA:
        db = SessionLocal()
        try:
            from app.seed import seed_database
            seed_database(db)
        finally:
            db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
