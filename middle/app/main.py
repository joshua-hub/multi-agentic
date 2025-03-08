from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
from datetime import datetime
import uuid
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from app.api.message import router as message_router
from app.api.history import router as history_router
from app.api.prompt_template import router as prompt_template_router
from app.api.models import router as models_router

# Setup logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Multi-Agentic API",
    description="API for the multi-agentic human-in-the-loop conversation system",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(message_router, prefix="/api", tags=["messages"])
app.include_router(history_router, prefix="/api", tags=["history"])
app.include_router(prompt_template_router, prefix="/api", tags=["prompt_template"])
app.include_router(models_router, prefix="/api", tags=["models"])

@app.get("/")
async def root():
    return {
        "message": "Multi-Agentic API is running",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "False").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port} (reload={reload})")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
