import httpx
import logging
import json
import os
from typing import Dict, List, Any, Optional
from app.models.schemas import OllamaRequest, OllamaResponse

logger = logging.getLogger(__name__)

# Get Ollama API URL from environment variable or use default
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://ollama:11434/api")

async def generate_response(model: str, prompt: str, temperature: float = 0.7) -> str:
    """
    Generate a response from Ollama
    
    Args:
        model: The model to use
        prompt: The prompt to send to the model
        temperature: The temperature to use for generation
        
    Returns:
        The generated response text
    """
    try:
        logger.info(f"Generating response with model: {model}")
        
        request_data = OllamaRequest(
            model=model,
            prompt=prompt,
            temperature=temperature,
            stream=False
        )
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_API_URL}/generate",
                json=request_data.model_dump()
            )
            
            if response.status_code != 200:
                logger.error(f"Error from Ollama API: {response.text}")
                return f"Error: Failed to generate response. Status code: {response.status_code}"
            
            response_data = response.json()
            return response_data.get("response", "")
    
    except httpx.RequestError as e:
        logger.error(f"Request error when calling Ollama API: {str(e)}")
        return "Error: Failed to connect to Ollama API"
    
    except Exception as e:
        logger.error(f"Unexpected error when generating response: {str(e)}")
        return f"Error: {str(e)}"

async def get_available_models() -> List[Dict[str, str]]:
    """
    Get a list of available models from Ollama
    
    Returns:
        A list of model information dictionaries
    """
    try:
        logger.info("Getting available models from Ollama")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_API_URL}/tags")
            
            if response.status_code == 200:
                models = response.json().get("models", [])
                return models
            else:
                logger.error(f"Failed to get models from Ollama: {response.text}")
                return []
    except Exception as e:
        logger.error(f"Error getting models from Ollama: {str(e)}")
        return []

async def get_running_models() -> List[Dict[str, Any]]:
    """
    Get a list of models currently loaded in memory
    
    Returns:
        A list of running model information
    """
    try:
        logger.info("Getting running models from Ollama")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_API_URL}/ps")
            
            if response.status_code == 200:
                models = response.json().get("models", [])
                return models
            else:
                logger.error(f"Failed to get running models from Ollama: {response.text}")
                return []
    except Exception as e:
        logger.error(f"Error getting running models from Ollama: {str(e)}")
        return []

async def unload_model(model_name: str) -> bool:
    """
    Unload a model from memory
    
    Args:
        model_name: The name of the model to unload
        
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info(f"Unloading model {model_name} from memory")
        
        payload = {
            "model": model_name,
            "prompt": "",
            "keep_alive": 0
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{OLLAMA_API_URL}/generate", json=payload)
            
            if response.status_code == 200:
                logger.info(f"Successfully unloaded model {model_name}")
                return True
            else:
                logger.error(f"Failed to unload model {model_name}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error unloading model {model_name}: {str(e)}")
        return False 