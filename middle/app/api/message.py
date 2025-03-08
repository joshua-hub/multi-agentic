from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from app.models.schemas import MessageRequest, MessageResponse, LatestPayloadResponse
from app.services import history_service, prompt_template_service, ollama_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/latest-payload", response_model=LatestPayloadResponse)
async def get_latest_payload():
    """
    Get the latest payload sent to the model
    
    Returns:
        The latest payload with prompt, model, temperature, and timestamp
    """
    try:
        logger.info("Getting latest payload")
        
        payload = prompt_template_service.get_latest_payload()
        
        return LatestPayloadResponse(
            prompt=payload["prompt"],
            model=payload["model"],
            temperature=payload["temperature"],
            timestamp=payload["timestamp"],
            status="success"
        )
    
    except Exception as e:
        logger.error(f"Error getting latest payload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting latest payload: {str(e)}")

@router.post("/message", response_model=MessageResponse)
async def process_message(request: MessageRequest):
    """
    Process a message from one persona to another and generate a model response
    
    Args:
        request: The message request
        
    Returns:
        The message response with the generated model output
    """
    try:
        logger.info(f"Processing message from {request.message.sender} to {request.message.recipients}")
        
        # Add the message to history
        message_id = history_service.add_message(
            timestamp=request.timestamp,
            persona_settings=request.persona_settings,
            message=request.message
        )
        
        # Get conversation context
        conversation_context = history_service.get_conversation_context(
            current_message=request.message.model_dump(),
            num_previous_messages=2
        )
        
        # Determine sender and recipient personas
        sender_id = request.message.sender
        recipient_id = request.message.recipients
        
        sender_persona = request.persona_settings[sender_id].model_dump()
        recipient_persona = request.persona_settings[recipient_id].model_dump()
        
        # If this is an edited AI response, log it but continue processing
        if request.message.raw_text is not None:
            logger.info(f"Message {message_id} is an edited AI response, continuing conversation")
        
        # Construct prompt
        prompt = prompt_template_service.construct_prompt(
            sender_persona=sender_persona,
            recipient_persona=recipient_persona,
            message_text=request.message.text,
            conversation_context=conversation_context
        )
        
        # Update timestamp in latest payload
        prompt_template_service.latest_payload["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        # Generate response from Ollama
        raw_response = await ollama_service.generate_response(
            model=recipient_persona["model"],
            prompt=prompt,
            temperature=recipient_persona["temperature"]
        )
        
        # Return the response
        return MessageResponse(
            message_id=message_id,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z",
            response={"raw_text": raw_response}
        )
    
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}") 