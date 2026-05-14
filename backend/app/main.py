from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.config import get_settings
from app.database import engine, Base, SessionLocal
from app.routers import auth, medicos, pacientes, turnos, tarifas, reportes, backups
from app.routers import publico, mascotas

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(publico.router)
app.include_router(mascotas.router)


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
