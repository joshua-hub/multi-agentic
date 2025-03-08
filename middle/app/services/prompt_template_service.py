import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Default prompt template
DEFAULT_TEMPLATE = """System: {recipient_system_prompt}

You are {recipient_name} having a conversation with {sender_name}.

Previous conversation:
{conversation_history}

{sender_name}: {message_text}

{recipient_name}:"""

# Current prompt template
current_template = DEFAULT_TEMPLATE

def get_template() -> str:
    """
    Get the current prompt template
    
    Returns:
        The current prompt template
    """
    return current_template

def update_template(template: str) -> bool:
    """
    Update the prompt template
    
    Args:
        template: The new template
        
    Returns:
        True if the template was updated successfully
    """
    global current_template
    current_template = template
    logger.info("Prompt template updated")
    return True

def format_conversation_history(context: List[Dict[str, Any]]) -> str:
    """
    Format the conversation history for inclusion in a prompt
    
    Args:
        context: The conversation context
        
    Returns:
        A formatted string representation of the conversation history
    """
    if not context:
        return "No previous conversation."
    
    formatted_history = ""
    for msg in context:
        formatted_history += f"{msg['sender']}: {msg['text']}\n\n"
    
    return formatted_history.strip()

def construct_prompt(
    sender_persona: Dict[str, Any],
    recipient_persona: Dict[str, Any],
    message_text: str,
    conversation_context: List[Dict[str, Any]]
) -> str:
    """
    Construct a prompt using the template
    
    Args:
        sender_persona: The sender's persona settings
        recipient_persona: The recipient's persona settings
        message_text: The message text
        conversation_context: The conversation context
        
    Returns:
        The constructed prompt
    """
    try:
        # Extract values from persona dictionaries
        sender_name = sender_persona.get('name', 'Unknown')
        recipient_name = recipient_persona.get('name', 'Unknown')
        recipient_system_prompt = recipient_persona.get('system_prompt', 'You are an AI assistant.')
        
        # Format conversation history
        conversation_history = format_conversation_history(conversation_context)
        
        # Apply the template with flattened variables
        prompt = current_template.format(
            sender_name=sender_name,
            recipient_name=recipient_name,
            recipient_system_prompt=recipient_system_prompt,
            message_text=message_text,
            conversation_history=conversation_history
        )
        
        return prompt
    except KeyError as e:
        logger.error(f"Error formatting prompt template: {str(e)}")
        # Fall back to a simple prompt if template formatting fails
        return f"You are {recipient_persona.get('name', 'an AI')}. Respond to: {message_text}"
    except Exception as e:
        logger.error(f"Unexpected error formatting prompt: {str(e)}")
        return f"You are {recipient_persona.get('name', 'an AI')}. Respond to: {message_text}" 