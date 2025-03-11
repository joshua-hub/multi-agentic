from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import httpx

from app.models.schemas import HistoryResponse, HistoryImportRequest, HistoryImportResponse
from app.services import history_service, ollama_service

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
    Import conversation history
    
    Args:
        request: The history import request containing the history to import
        
    Returns:
        A success or error message
    """
    try:
        logger.info("Importing history")
        
        # Check if this is a clear history request (empty history)
        is_clearing_history = len(request.history) == 0
        
        # Import the history (or clear it if empty)
        count = history_service.import_history(request.history)
        
        # If clearing history, also unload all models
        if is_clearing_history:
            logger.info("Clearing history detected, unloading all models")
            try:
                # Get all running models
                running_models = await ollama_service.get_running_models()
                
                # Track successful unloads
                successful_unloads = 0
                failed_unloads = 0
                
                # Unload each model
                for model in running_models:
                    model_name = model.get("model")
                    if model_name:
                        success = await ollama_service.unload_model(model_name)
                        if success:
                            successful_unloads += 1
                        else:
                            failed_unloads += 1
                
                logger.info(f"Unloaded {successful_unloads} models, {failed_unloads} failed")
            except Exception as e:
                logger.error(f"Error unloading models during history clear: {str(e)}")
                # Continue even if model unloading fails
        
        return HistoryImportResponse(
            status="success",
            message=f"Imported {count} history entries" + 
                    (f" and unloaded models from memory" if is_clearing_history else ""),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    except Exception as e:
        logger.error(f"Error importing history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to import history: {str(e)}") 