import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import init_directories
from backend.database import engine, Base
from backend.routers import auth, companies, knowledge_base, negotiations, revisions, compliance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing directories...")
    init_directories()
    
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    logger.info("Startup complete.")
    yield
    
    # Shutdown actions
    logger.info("Shutting down...")
    await engine.dispose()
    logger.info("Shutdown complete.")

app = FastAPI(
    title="Contract Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Allow frontend (typically localhost:5173 in Vite) to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(knowledge_base.router)
app.include_router(negotiations.router)
app.include_router(revisions.router)
app.include_router(compliance.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Contract Intelligence Platform API",
        "status": "healthy"
    }
