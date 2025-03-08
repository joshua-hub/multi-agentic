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
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_API_URL}/tags")
            
            if response.status_code != 200:
                logger.error(f"Error from Ollama API: {response.text}")
                return []
            
            response_data = response.json()
            models = []
            
            # Log the raw response for debugging
            logger.debug(f"Ollama API response: {json.dumps(response_data)}")
            
            # Handle different response formats
            model_list = response_data.get("models", [])
            if not model_list and "name" in response_data:
                # Handle case where response is a single model
                model_list = [response_data]
            
            for model in model_list:
                # Create model info with defaults for missing fields
                model_info = {
                    "name": model.get("name", "unknown")
                }
                
                # Add optional fields if they exist
                if "size" in model:
                    model_info["size"] = str(model["size"])
                
                if "quantization" in model:
                    model_info["quantization"] = model["quantization"]
                
                if "family" in model:
                    model_info["family"] = model["family"]
                
                models.append(model_info)
            
            # If no models were found, add a default model
            if not models:
                models.append({"name": "dolphin-phi"})
            
            return models
    
    except httpx.RequestError as e:
        logger.error(f"Request error when calling Ollama API: {str(e)}")
        # Return a default model if we can't connect to Ollama
        return [{"name": "dolphin-phi"}]
    
    except Exception as e:
        logger.error(f"Unexpected error when getting models: {str(e)}")
        # Return a default model on any error
        return [{"name": "dolphin-phi"}] 