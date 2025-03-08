from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from app.models.schemas import HistoryResponse, HistoryImportRequest, HistoryImportResponse
from app.services import history_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/history", response_model=HistoryResponse)
async def get_history():
    """
    Get the complete conversation history
    
    Returns:
        The complete conversation history
    """
    try:
        logger.info("Getting conversation history")
        
        history = history_service.get_history()
        
        return HistoryResponse(
            history=history,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting history: {str(e)}")

@router.post("/history", response_model=HistoryImportResponse)
async def import_history(request: HistoryImportRequest):
    """
    Import a conversation history
    
    Args:
        request: The history import request
        
    Returns:
        The history import response
    """
    try:
        logger.info("Importing conversation history")
        
        # Validate the history structure
        if not isinstance(request.history, list):
            raise ValueError("History must be a list")
        
        # Import the history
        count = history_service.import_history(request.history)
        
        return HistoryImportResponse(
            status="success",
            message=f"History imported successfully. {count} messages loaded.",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except ValueError as e:
        logger.error(f"Invalid history format: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid history format: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error importing history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing history: {str(e)}") 