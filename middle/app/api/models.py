from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from datetime import datetime
import logging

from app.models.schemas import ModelsResponse, ModelInfo
from app.services import ollama_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """
    Get available models from Ollama
    
    Returns:
        A list of available models
    """
    try:
        logger.info("Getting available models")
        
        # Get models from Ollama
        models = await ollama_service.get_available_models()
        
        # Convert to ModelInfo objects
        model_info_list = []
        for model in models:
            try:
                # Create ModelInfo with required name field
                model_info = ModelInfo(name=model["name"])
                
                # Add optional fields if they exist
                if "size" in model:
                    model_info.size = model["size"]
                
                if "quantization" in model:
                    model_info.quantization = model["quantization"]
                
                if "family" in model:
                    model_info.family = model["family"]
                
                model_info_list.append(model_info)
            except Exception as e:
                logger.warning(f"Error creating ModelInfo for {model}: {str(e)}")
                # Continue with next model if there's an error
                continue
        
        # If no models were successfully created, add a default one
        if not model_info_list:
            model_info_list.append(ModelInfo(name="dolphin-phi"))
        
        return ModelsResponse(
            models=model_info_list,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting models: {str(e)}") 