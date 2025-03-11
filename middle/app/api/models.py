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

@router.get("/running-models")
async def get_running_models():
    """
    Get a list of models currently loaded in memory
    
    Returns:
        A list of running models with their metadata
    """
    try:
        logger.info("Getting running models")
        
        models = await ollama_service.get_running_models()
        
        return {
            "models": models,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        logger.error(f"Error getting running models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get running models: {str(e)}")

@router.post("/unload-model/{model_name}")
async def unload_model(model_name: str):
    """
    Unload a model from memory
    
    Args:
        model_name: The name of the model to unload
        
    Returns:
        A success or error message
    """
    try:
        logger.info(f"Unloading model {model_name}")
        
        success = await ollama_service.unload_model(model_name)
        
        if success:
            return {
                "status": "success",
                "message": f"Model {model_name} unloaded successfully",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            raise HTTPException(status_code=500, detail=f"Failed to unload model {model_name}")
    except Exception as e:
        logger.error(f"Error unloading model {model_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to unload model {model_name}: {str(e)}")

@router.post("/unload-all-models")
async def unload_all_models():
    """
    Unload all models currently loaded in memory
    
    Returns:
        A success or error message with the number of models unloaded
    """
    try:
        logger.info("Unloading all models")
        
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
        
        return {
            "status": "success",
            "message": f"Unloaded {successful_unloads} models, {failed_unloads} failed",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        logger.error(f"Error unloading all models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to unload all models: {str(e)}") 