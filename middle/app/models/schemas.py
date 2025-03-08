from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class PersonaSettings(BaseModel):
    name: str
    system_prompt: str
    model: str
    temperature: float = Field(ge=0.0, le=1.0)

class Message(BaseModel):
    sender: str
    recipients: str
    text: str
    raw_text: Optional[str] = None

class MessageRequest(BaseModel):
    timestamp: str
    persona_settings: Dict[str, PersonaSettings]
    message: Message

class MessageResponse(BaseModel):
    message_id: str
    status: str
    timestamp: str
    response: Dict[str, Any]

class HistoryEntry(BaseModel):
    message_id: str
    timestamp: str
    persona_settings: Dict[str, PersonaSettings]
    message: Message

class HistoryResponse(BaseModel):
    history: List[HistoryEntry]
    status: str
    timestamp: str

class HistoryImportRequest(BaseModel):
    history: List[HistoryEntry]

class HistoryImportResponse(BaseModel):
    status: str
    message: str
    timestamp: str

class PromptTemplateRequest(BaseModel):
    template: str

class PromptTemplateResponse(BaseModel):
    status: str
    timestamp: str

class ModelInfo(BaseModel):
    name: str
    size: Optional[str] = "unknown"
    quantization: Optional[str] = "unknown"
    family: Optional[str] = "unknown"

class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    status: str
    timestamp: str

class OllamaRequest(BaseModel):
    model: str
    prompt: str
    temperature: float = 0.7
    stream: bool = False

class OllamaResponse(BaseModel):
    model: str
    created_at: str
    response: str
    done: bool 