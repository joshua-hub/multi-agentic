from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
import logging

from app.models.schemas import PromptTemplateRequest, PromptTemplateResponse
from app.services import prompt_template_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/prompt_template", response_model=PromptTemplateResponse)
async def update_prompt_template(request: PromptTemplateRequest):
    """
    Update the prompt template
    
    Args:
        request: The prompt template request
        
    Returns:
        The prompt template response
    """
    try:
        logger.info("Updating prompt template")
        
        # Validate the template
        if not request.template or len(request.template.strip()) == 0:
            raise ValueError("Template cannot be empty")
        
        # Update the template
        prompt_template_service.update_template(request.template)
        
        return PromptTemplateResponse(
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except ValueError as e:
        logger.error(f"Invalid template: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid template: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error updating template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}") 