# Adding OpenAI Compatibility to Multi-Agentic System

## Overview

This document outlines a comprehensive approach to extend the Multi-Agentic system to support OpenAI models alongside the existing Ollama integration. The implementation will maintain the system's modular architecture while adding the flexibility to switch between model backends.

## Table of Contents

1. [Architecture Changes](#architecture-changes)
2. [Backend Implementation](#backend-implementation)
   - [Schema Updates](#schema-updates)
   - [Service Layer Implementation](#service-layer-implementation)
   - [API Endpoint Additions](#api-endpoint-additions)
3. [Frontend Implementation](#frontend-implementation)
   - [Context Updates](#context-updates)
   - [Settings UI Changes](#settings-ui-changes)
   - [Model Selection Component](#model-selection-component)
4. [Configuration Management](#configuration-management)
5. [Implementation Steps](#implementation-steps)
6. [Testing Strategy](#testing-strategy)
7. [Appendix: Code Samples](#appendix-code-samples)

## Architecture Changes

The current architecture will be extended with:

1. A new abstraction layer for model providers
2. A model provider factory to select the appropriate service
3. New API endpoints for model provider management
4. Updated UI components for model provider selection

## Backend Implementation

### Schema Updates

#### 1. Add Model Provider Schemas (`app/models/schemas.py`)

```python
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime

# Existing schemas...

class ModelProvider(BaseModel):
    """Model provider configuration"""
    id: str
    name: str
    description: str
    is_active: bool = True

class ModelProviderList(BaseModel):
    """List of available model providers"""
    providers: List[ModelProvider]
    default_provider: str
    status: str
    timestamp: str

class OpenAIRequest(BaseModel):
    """OpenAI API request format"""
    model: str
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    frequency_penalty: Optional[float] = None
    presence_penalty: Optional[float] = None

class OpenAIMessage(BaseModel):
    """OpenAI message format"""
    role: Literal["system", "user", "assistant"]
    content: str

class OpenAIChoice(BaseModel):
    """OpenAI API response choice"""
    index: int
    message: Dict[str, str]
    finish_reason: str

class OpenAIResponse(BaseModel):
    """OpenAI API response format"""
    id: str
    object: str
    created: int
    model: str
    choices: List[OpenAIChoice]
    usage: Dict[str, int]

class ProviderSelectionRequest(BaseModel):
    """Request to change the active model provider"""
    provider_id: str

class ProviderSelectionResponse(BaseModel):
    """Response after changing the model provider"""
    status: str
    provider: ModelProvider
    timestamp: str
```

#### 2. Update PersonaSettings Schema

```python
class PersonaSettings(BaseModel):
    name: str
    system_prompt: str
    model: str
    provider: str = "ollama"  # Default to ollama
    temperature: float = Field(ge=0.0, le=1.0)
```

### Service Layer Implementation

#### 1. Create Model Provider Factory (`app/services/model_factory.py`)

```python
import logging
import os
from typing import Dict, List, Any, Optional
from app.services import ollama_service, openai_service
from app.models.schemas import ModelProvider

logger = logging.getLogger(__name__)

# Available model providers
MODEL_PROVIDERS = {
    "ollama": {
        "id": "ollama",
        "name": "Ollama",
        "description": "Local models via Ollama"
    },
    "openai": {
        "id": "openai",
        "name": "OpenAI",
        "description": "OpenAI API (requires API key)"
    }
}

# Default provider
DEFAULT_PROVIDER = os.getenv("DEFAULT_MODEL_PROVIDER", "ollama")

async def get_providers() -> List[ModelProvider]:
    """
    Get list of available model providers
    
    Returns:
        List of model providers
    """
    return [ModelProvider(**provider) for provider in MODEL_PROVIDERS.values()]

async def get_provider(provider_id: str) -> Optional[ModelProvider]:
    """
    Get a specific provider by ID
    
    Args:
        provider_id: The provider ID
        
    Returns:
        The provider or None if not found
    """
    if provider_id in MODEL_PROVIDERS:
        return ModelProvider(**MODEL_PROVIDERS[provider_id])
    return None

async def generate_response(
    provider: str,
    model: str, 
    prompt: str, 
    temperature: float = 0.7,
    system_prompt: Optional[str] = None
) -> str:
    """
    Generate a response using the specified provider
    
    Args:
        provider: The provider to use (ollama, openai)
        model: The model to use
        prompt: The prompt to send to the model
        temperature: The temperature to use for generation
        system_prompt: Optional system prompt for providers that support it
        
    Returns:
        The generated response text
    """
    logger.info(f"Generating response with provider: {provider}, model: {model}")
    
    if provider == "openai":
        return await openai_service.generate_response(model, prompt, temperature, system_prompt)
    else:
        # Default to Ollama
        return await ollama_service.generate_response(model, prompt, temperature)
```

#### 2. Create OpenAI Service (`app/services/openai_service.py`)

```python
import httpx
import logging
import os
import json
from typing import Dict, List, Any, Optional
from app.models.schemas import OpenAIRequest, OpenAIResponse, OpenAIMessage

logger = logging.getLogger(__name__)

# Get OpenAI API URL and key from environment variables
OPENAI_API_URL = os.getenv("OPENAI_API_URL", "https://api.openai.com/v1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

async def generate_response(
    model: str, 
    prompt: str, 
    temperature: float = 0.7,
    system_prompt: Optional[str] = None
) -> str:
    """
    Generate a response from OpenAI
    
    Args:
        model: The model to use (e.g., "gpt-3.5-turbo", "gpt-4")
        prompt: The prompt to send to the model
        temperature: The temperature to use for generation
        system_prompt: Optional system prompt
        
    Returns:
        The generated response text
    """
    try:
        logger.info(f"Generating response with OpenAI model: {model}")
        
        # Format messages for ChatCompletion API
        messages = []
        
        # Add system message if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        # Add user message
        messages.append({"role": "user", "content": prompt})
        
        request_data = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OPENAI_API_URL}/chat/completions",
                json=request_data,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Error from OpenAI API: {response.text}")
                return f"Error: Failed to generate response. Status code: {response.status_code}"
            
            response_data = response.json()
            return response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    except httpx.RequestError as e:
        logger.error(f"Request error when calling OpenAI API: {str(e)}")
        return "Error: Failed to connect to OpenAI API"
    
    except Exception as e:
        logger.error(f"Unexpected error when generating response: {str(e)}")
        return f"Error: {str(e)}"

async def get_available_models() -> List[Dict[str, str]]:
    """
    Get a list of available models from OpenAI
    
    Returns:
        A list of model information dictionaries
    """
    try:
        logger.info("Getting available models from OpenAI")
        
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OPENAI_API_URL}/models",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                models = []
                
                # Filter for chat models
                for model in data.get("data", []):
                    model_id = model.get("id", "")
                    if any(model_id.startswith(prefix) for prefix in ["gpt-", "text-davinci-"]):
                        models.append({
                            "name": model_id,
                            "size": "unknown",
                            "family": "GPT",
                            "quantization": "unknown"
                        })
                
                return models
            else:
                logger.error(f"Failed to get models from OpenAI: {response.text}")
                return []
    except Exception as e:
        logger.error(f"Error getting models from OpenAI: {str(e)}")
        return []
```

#### 3. Update Ollama Service (`app/services/ollama_service.py`)

```python
# Add system_prompt parameter for consistency with OpenAI service
async def generate_response(
    model: str, 
    prompt: str, 
    temperature: float = 0.7,
    system_prompt: Optional[str] = None
) -> str:
    """
    Generate a response from Ollama
    
    Args:
        model: The model to use
        prompt: The prompt to send to the model
        temperature: The temperature to use for generation
        system_prompt: Optional system prompt (ignored for Ollama)
        
    Returns:
        The generated response text
    """
    # Existing implementation...
    # Note: Ollama doesn't use system_prompt directly, so we ignore it
```

### API Endpoint Additions

#### 1. Create Model Providers API (`app/api/providers.py`)

```python
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from datetime import datetime
import logging

from app.models.schemas import ModelProviderList, ProviderSelectionRequest, ProviderSelectionResponse
from app.services import model_factory

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/providers", response_model=ModelProviderList)
async def get_providers():
    """
    Get available model providers
    
    Returns:
        List of available model providers
    """
    try:
        logger.info("Getting available model providers")
        
        providers = await model_factory.get_providers()
        
        return ModelProviderList(
            providers=providers,
            default_provider=model_factory.DEFAULT_PROVIDER,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except Exception as e:
        logger.error(f"Error getting model providers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting model providers: {str(e)}")

@router.post("/provider", response_model=ProviderSelectionResponse)
async def select_provider(request: ProviderSelectionRequest):
    """
    Select a model provider
    
    Args:
        request: The provider selection request
        
    Returns:
        The selected provider
    """
    try:
        logger.info(f"Selecting model provider: {request.provider_id}")
        
        provider = await model_factory.get_provider(request.provider_id)
        
        if not provider:
            raise HTTPException(status_code=404, detail=f"Provider {request.provider_id} not found")
        
        return ProviderSelectionResponse(
            status="success",
            provider=provider,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error selecting model provider: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error selecting model provider: {str(e)}")
```

#### 2. Update Message API (`app/api/message.py`)

```python
# Modify the process_message function to use the model factory
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
        # Existing code...
        
        # Determine sender and recipient personas
        sender_id = request.message.sender
        recipient_id = request.message.recipients
        
        sender_persona = request.persona_settings[sender_id].model_dump()
        recipient_persona = request.persona_settings[recipient_id].model_dump()
        
        # Construct prompt
        prompt = prompt_template_service.construct_prompt(
            sender_persona=sender_persona,
            recipient_persona=recipient_persona,
            message_text=request.message.text,
            conversation_context=conversation_context
        )
        
        # Update timestamp in latest payload
        prompt_template_service.latest_payload["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        # Generate response using the model factory
        raw_response = await model_factory.generate_response(
            provider=recipient_persona.get("provider", "ollama"),  # Get provider from persona settings
            model=recipient_persona["model"],
            prompt=prompt,
            temperature=recipient_persona["temperature"],
            system_prompt=recipient_persona.get("system_prompt")
        )
        
        # Return the response
        return MessageResponse(
            message_id=message_id,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z",
            response={"raw_text": raw_response}
        )
    
    except Exception as e:
        # Existing error handling...
```

#### 3. Update Models API (`app/api/models.py`)

```python
# Add a function to get models from the selected provider
@router.get("/models/{provider_id}", response_model=ModelsResponse)
async def get_models_by_provider(provider_id: str):
    """
    Get available models from a specific provider
    
    Args:
        provider_id: The provider ID
        
    Returns:
        A list of available models
    """
    try:
        logger.info(f"Getting available models from provider: {provider_id}")
        
        if provider_id == "openai":
            models = await openai_service.get_available_models()
        else:
            # Default to Ollama
            models = await ollama_service.get_available_models()
        
        # Convert to ModelInfo objects
        model_info_list = []
        for model in models:
            try:
                model_info = ModelInfo(name=model["name"])
                
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
            if provider_id == "openai":
                model_info_list.append(ModelInfo(name="gpt-3.5-turbo", family="GPT"))
            else:
                model_info_list.append(ModelInfo(name="dolphin-phi"))
        
        return ModelsResponse(
            models=model_info_list,
            status="success",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
    
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting models: {str(e)}")
```

#### 4. Update Main Application (`app/main.py`)

```python
# Import the new router
from app.api.providers import router as providers_router

# Include the new router
app.include_router(providers_router, prefix="/api", tags=["providers"])
```

## Frontend Implementation

### Context Updates

#### 1. Update AppContext.js

```javascript
// Add provider state and functions
const [modelProviders, setModelProviders] = useState([]);
const [selectedProvider, setSelectedProvider] = useState('ollama');

// Add to DEFAULT_PERSONA_SETTINGS
const DEFAULT_PERSONA_SETTINGS = {
  persona1: {
    name: "Bob",
    system_prompt: "You are a creative technical AI assistant",
    model: "dolphin-phi",
    provider: "ollama",  // Add provider
    temperature: 0.7
  },
  persona2: {
    name: "Alice",
    system_prompt: "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
    model: "dolphin-phi",
    provider: "ollama",  // Add provider
    temperature: 0.5
  }
};

// Add function to fetch providers
const fetchModelProviders = async () => {
  try {
    const response = await axios.get('/api/providers');
    setModelProviders(response.data.providers);
    
    // Set the default provider
    if (response.data.default_provider) {
      setSelectedProvider(response.data.default_provider);
    }
  } catch (error) {
    console.error('Error fetching model providers:', error);
    showNotification('Failed to fetch model providers', 'error');
  }
};

// Add function to select provider
const selectModelProvider = async (providerId) => {
  try {
    const response = await axios.post('/api/provider', {
      provider_id: providerId
    });
    
    setSelectedProvider(providerId);
    showNotification(`Switched to ${response.data.provider.name} provider`, 'success');
    
    // Fetch models for the new provider
    await fetchModelsForProvider(providerId);
    
    return response.data;
  } catch (error) {
    console.error('Error selecting model provider:', error);
    showNotification('Failed to select model provider', 'error');
    throw error;
  }
};

// Modify fetchAvailableModels to use the selected provider
const fetchAvailableModels = async () => {
  try {
    const response = await axios.get(`/api/models/${selectedProvider}`);
    setAvailableModels(response.data.models);
  } catch (error) {
    console.error('Error fetching models:', error);
    showNotification('Failed to fetch available models', 'error');
  }
};

// Add function to fetch models for a specific provider
const fetchModelsForProvider = async (providerId) => {
  try {
    const response = await axios.get(`/api/models/${providerId}`);
    setAvailableModels(response.data.models);
  } catch (error) {
    console.error(`Error fetching models for provider ${providerId}:`, error);
    showNotification(`Failed to fetch models for ${providerId}`, 'error');
  }
};

// Add to useEffect
useEffect(() => {
  fetchModelProviders();
}, []);

// Add to context value
const contextValue = {
  // Existing values...
  modelProviders,
  selectedProvider,
  selectModelProvider,
  fetchModelsForProvider
};
```

### Settings UI Changes

#### 1. Update SettingsPage.js

```javascript
// Add provider selection component
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// In the SettingsPage component
const { 
  personaSettings, 
  promptTemplate, 
  availableModels,
  modelProviders,          // Add these
  selectedProvider,        // Add these
  selectModelProvider,     // Add these
  fetchModelsForProvider,  // Add these
  updatePersonaSettings, 
  updatePromptTemplate, 
  resetToDefaults,
  clearAllData
} = useAppContext();

// Add state for tracking provider changes
const [localProvider, setLocalProvider] = useState(selectedProvider);

// Update useEffect to set localProvider when selectedProvider changes
useEffect(() => {
  setLocalProvider(selectedProvider);
}, [selectedProvider]);

// Add handler for provider changes
const handleProviderChange = async (event) => {
  const newProvider = event.target.value;
  setLocalProvider(newProvider);
  
  try {
    await selectModelProvider(newProvider);
    
    // Update persona settings to use default models for the new provider
    const updatedSettings = { ...localPersonaSettings };
    
    // Get the first available model for the new provider
    const models = await fetchModelsForProvider(newProvider);
    const defaultModel = models?.length > 0 ? models[0].name : 
      (newProvider === 'openai' ? 'gpt-3.5-turbo' : 'dolphin-phi');
    
    // Update both personas to use the new provider and default model
    updatedSettings.persona1 = {
      ...updatedSettings.persona1,
      provider: newProvider,
      model: defaultModel
    };
    
    updatedSettings.persona2 = {
      ...updatedSettings.persona2,
      provider: newProvider,
      model: defaultModel
    };
    
    setLocalPersonaSettings(updatedSettings);
  } catch (error) {
    console.error('Error changing provider:', error);
  }
};

// Add provider selection UI
// Add this before the Persona Settings section
<Grid item xs={12}>
  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Model Provider
    </Typography>
    <Divider sx={{ mb: 2 }} />
    
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      <InputLabel>Provider</InputLabel>
      <Select
        value={localProvider}
        onChange={handleProviderChange}
        label="Provider"
      >
        {modelProviders.map((provider) => (
          <MenuItem key={provider.id} value={provider.id}>
            {provider.name} - {provider.description}
          </MenuItem>
        ))}
        {modelProviders.length === 0 && (
          <MenuItem value="ollama">Ollama (default)</MenuItem>
        )}
      </Select>
    </FormControl>
    
    <Typography variant="body2" color="text.secondary">
      Select the model provider to use for both personas. Changing the provider will update the available models.
    </Typography>
  </Paper>
</Grid>

// Update the persona settings sections to include provider
<FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
  <InputLabel>Provider</InputLabel>
  <Select
    value={localPersonaSettings.persona1.provider}
    onChange={(e) => handlePersonaChange('persona1', 'provider', e.target.value)}
    label="Provider"
  >
    {modelProviders.map((provider) => (
      <MenuItem key={provider.id} value={provider.id}>
        {provider.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>

// Do the same for persona2
```

## Configuration Management

### 1. Update Environment Variables

Add the following to your `.env` file:

```
# OpenAI Configuration
OPENAI_API_KEY=your_api_key_here
OPENAI_API_URL=https://api.openai.com/v1

# Default Model Provider
DEFAULT_MODEL_PROVIDER=ollama
```

### 2. Update Docker Compose

Update the `docker-compose.yml` file to include the new environment variables:

```yaml
services:
  middle:
    build:
      context: .
      dockerfile: middle/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - OPENAI_API_URL=${OPENAI_API_URL:-https://api.openai.com/v1}
      - DEFAULT_MODEL_PROVIDER=${DEFAULT_MODEL_PROVIDER:-ollama}
    depends_on:
      - ollama
    networks:
      - multi-agentic-network
    restart: unless-stopped
```

## Implementation Steps

Follow these steps to implement the OpenAI integration:

1. **Backend Changes**:
   - Create the new schema models in `app/models/schemas.py`
   - Create the `model_factory.py` service
   - Create the `openai_service.py` service
   - Update the `ollama_service.py` service
   - Create the `providers.py` API endpoints
   - Update the `message.py` and `models.py` API endpoints
   - Update the `main.py` file to include the new router

2. **Frontend Changes**:
   - Update `AppContext.js` with provider state and functions
   - Update `SettingsPage.js` with provider selection UI
   - Update persona settings UI to include provider selection

3. **Configuration**:
   - Add OpenAI environment variables to `.env`
   - Update `docker-compose.yml` to include the new environment variables

4. **Testing**:
   - Test the provider selection UI
   - Test model fetching for each provider
   - Test message sending with each provider
   - Test error handling for invalid API keys or unavailable services

## Testing Strategy

### 1. Unit Tests

- Test the `model_factory.py` service
- Test the `openai_service.py` service
- Test the provider selection API endpoints

### 2. Integration Tests

- Test the end-to-end flow of selecting a provider and sending messages
- Test error handling for invalid API keys or unavailable services

### 3. UI Tests

- Test the provider selection UI
- Test model selection for each provider
- Test persona settings updates when changing providers

## Appendix: Code Samples

### 1. Example OpenAI API Request

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7
}
```

### 2. Example OpenAI API Response

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 18,
    "completion_tokens": 20,
    "total_tokens": 38
  }
}
``` 