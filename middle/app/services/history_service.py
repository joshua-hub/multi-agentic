import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import json
from app.models.schemas import HistoryEntry, Message, PersonaSettings

logger = logging.getLogger(__name__)

# In-memory history storage
message_history: List[Dict[str, Any]] = []

def generate_message_id() -> str:
    """
    Generate a unique message ID using timestamp and UUID
    
    Returns:
        A unique message ID
    """
    timestamp = datetime.utcnow().isoformat().replace(":", "-").split(".")[0] + "Z"
    random_string = str(uuid.uuid4())[:8]
    return f"{timestamp}-{random_string}"

def add_message(
    timestamp: str,
    persona_settings: Dict[str, PersonaSettings],
    message: Message
) -> str:
    """
    Add a message to the history
    
    Args:
        timestamp: The timestamp of the message
        persona_settings: The persona settings at the time of the message
        message: The message object
        
    Returns:
        The generated message ID
    """
    message_id = generate_message_id()
    
    entry = {
        "message_id": message_id,
        "timestamp": timestamp,
        "persona_settings": {
            k: v.model_dump() for k, v in persona_settings.items()
        },
        "message": message.model_dump()
    }
    
    message_history.append(entry)
    logger.info(f"Added message to history with ID: {message_id}")
    
    return message_id

def get_history() -> List[Dict[str, Any]]:
    """
    Get the complete message history
    
    Returns:
        The complete message history
    """
    return message_history

def import_history(history: List[Dict[str, Any]]) -> int:
    """
    Import a history from an external source
    
    Args:
        history: The history to import
        
    Returns:
        The number of messages imported
    """
    global message_history
    message_history = history
    logger.info(f"Imported {len(history)} messages into history")
    return len(history)

def get_conversation_context(
    current_message: Dict[str, Any],
    num_previous_messages: int = 2
) -> List[Dict[str, Any]]:
    """
    Get the conversation context for a message
    
    Args:
        current_message: The current message
        num_previous_messages: The number of previous messages to include
        
    Returns:
        A list of messages representing the conversation context
    """
    # Get the most recent messages, limited by num_previous_messages
    recent_messages = message_history[-num_previous_messages:] if message_history else []
    
    # Format the messages for the context
    context = []
    
    for msg in recent_messages:
        message_data = msg["message"]
        context.append({
            "sender": message_data["sender"],
            "text": message_data["text"]
        })
    
    return context 