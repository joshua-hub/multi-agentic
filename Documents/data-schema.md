# Data Schema Document

This document defines the data structures used in the multi-agentic system, including API request/response formats and the chat history schema.

## Table of Contents

1. [Common Data Types](#common-data-types)
2. [API Endpoints](#api-endpoints)
   - [POST /api/message](#post-apimessage)
   - [GET /api/history](#get-apihistory)
   - [POST /api/history](#post-apihistory)
   - [POST /api/prompt_template](#post-apiprompt_template)
   - [GET /api/models](#get-apimodels)
   - [GET /api/running-models](#get-apirunning-models)
   - [POST /api/unload-model/{model_name}](#post-apiunload-modelmodel_name)
   - [POST /api/unload-all-models](#post-apiunload-all-models)
3. [In-Memory Data Structures](#in-memory-data-structures)
   - [Message History](#message-history)
   - [Conversation Context](#conversation-context)

## Common Data Types

### Timestamp
ISO 8601 format string: `YYYY-MM-DDThh:mm:ssZ`

Example: `"2023-06-15T14:22:31Z"`

### PersonaSettings
```json
{
  "name": "string",
  "system_prompt": "string",
  "model": "string",
  "temperature": "number (0.0-1.0)"
}
```

Example:
```json
{
  "name": "Bob",
  "system_prompt": "You are a creative technical AI assistant",
  "model": "dolphin-phi",
  "temperature": 0.7
}
```

### Message
```json
{
  "sender": "string",
  "recipients": "string",
  "text": "string",
  "raw_text": "string (optional)"
}
```

Example:
```json
{
  "sender": "persona1",
  "recipients": "persona2",
  "text": "I'm doing well! I'm particularly interested in discussing the technical aspects of your project.",
  "raw_text": "I'm doing well, thank you for asking! How can I assist you today?"
}
```

### MessageID
String format: `<timestamp>-<random_string>`

Example: `"2023-06-15T14:22:31Z-a1b2c3d4"`

## API Endpoints

### POST /api/message

**Purpose**: Send a message from one persona to another and generate a model response

**Request Body**:
```json
{
  "timestamp": "string (ISO 8601)",
  "persona_settings": {
    "persona1": {
      "name": "string",
      "system_prompt": "string",
      "model": "string",
      "temperature": "number (0.0-1.0)"
    },
    "persona2": {
      "name": "string",
      "system_prompt": "string",
      "model": "string",
      "temperature": "number (0.0-1.0)"
    }
  },
  "message": {
    "sender": "string",
    "recipients": "string",
    "text": "string",
    "raw_text": "string (optional)"
  }
}
```

**Response**:
```json
{
  "message_id": "string",
  "status": "string",
  "timestamp": "string (ISO 8601)",
  "response": {
    "raw_text": "string"
  }
}
```

**Example Request (Sending a Human Message)**:
```json
{
  "timestamp": "2023-06-15T14:22:31Z",
  "persona_settings": {
    "persona1": {
      "name": "Bob",
      "system_prompt": "You are a creative technical AI assistant",
      "model": "dolphin-phi",
      "temperature": 0.7
    },
    "persona2": {
      "name": "Alice",
      "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
      "model": "dolphin-phi",
      "temperature": 0.5
    }
  },
  "message": {
    "sender": "persona1",
    "recipients": "persona2",
    "text": "Hello, how can I help you today?"
  }
}
```

**Example Response**:
```json
{
  "message_id": "2023-06-15T14:22:31Z-a1b2c3d4",
  "status": "success",
  "timestamp": "2023-06-15T14:22:35Z",
  "response": {
    "raw_text": "I'm doing well, thank you for asking! How can I assist you today?"
  }
}
```

**Example Request (Sending an Edited AI Response)**:
```json
{
  "timestamp": "2023-06-15T14:22:40Z",
  "persona_settings": {
    "persona1": {
      "name": "Bob",
      "system_prompt": "You are a creative technical AI assistant",
      "model": "dolphin-phi",
      "temperature": 0.7
    },
    "persona2": {
      "name": "Alice",
      "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
      "model": "dolphin-phi",
      "temperature": 0.5
    }
  },
  "message": {
    "sender": "persona2",
    "recipients": "persona1",
    "text": "I'm doing well! I'm particularly interested in discussing the technical aspects of your project.",
    "raw_text": "I'm doing well, thank you for asking! How can I assist you today?"
  }
}
```

**Example Response**:
```json
{
  "message_id": "2023-06-15T14:22:40Z-b5d6e7f8",
  "status": "success",
  "timestamp": "2023-06-15T14:22:41Z",
  "response": {
    "raw_text": "Great! I'd be happy to discuss the technical aspects of the project. What specific areas are you interested in exploring?"
  }
}
```

### GET /api/history

**Purpose**: Retrieve the complete conversation history

**Query Parameters**:
- `start_time` (optional): ISO 8601 timestamp
- `end_time` (optional): ISO 8601 timestamp
- `persona` (optional): Persona name to filter by

**Response**:
```json
{
  "history": [
    {
      "message_id": "string",
      "timestamp": "string (ISO 8601)",
      "persona_settings": {
        "persona1": { ... },
        "persona2": { ... }
      },
      "message": {
        "sender": "string",
        "recipients": "string",
        "text": "string",
        "raw_text": "string (if available)"
      }
    },
    ...
  ],
  "status": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response**:
```json
{
  "history": [
    {
      "message_id": "2023-06-15T14:22:31Z-a1b2c3d4",
      "timestamp": "2023-06-15T14:22:31Z",
      "persona_settings": {
        "persona1": {
          "name": "Bob",
          "system_prompt": "You are a creative technical AI assistant",
          "model": "dolphin-phi",
          "temperature": 0.7
        },
        "persona2": {
          "name": "Alice",
          "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
          "model": "dolphin-phi",
          "temperature": 0.5
        }
      },
      "message": {
        "sender": "persona1",
        "recipients": "persona2",
        "text": "Hello, how can I help you today?"
      }
    },
    {
      "message_id": "2023-06-15T14:22:40Z-b5d6e7f8",
      "timestamp": "2023-06-15T14:22:40Z",
      "persona_settings": {
        "persona1": {
          "name": "Bob",
          "system_prompt": "You are a creative technical AI assistant",
          "model": "dolphin-phi",
          "temperature": 0.7
        },
        "persona2": {
          "name": "Alice",
          "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
          "model": "dolphin-phi",
          "temperature": 0.5
        }
      },
      "message": {
        "sender": "persona2",
        "recipients": "persona1",
        "text": "I'm doing well! I'm particularly interested in discussing the technical aspects of your project.",
        "raw_text": "I'm doing well, thank you for asking! How can I assist you today?"
      }
    }
  ],
  "status": "success",
  "timestamp": "2023-06-15T14:22:45Z"
}
```

### POST /api/history

**Purpose**: Import a previously saved conversation history or clear history and unload models

**Request Body**:
```json
{
  "history": [
    {
      "message_id": "string",
      "timestamp": "string (ISO 8601)",
      "persona_settings": {
        "persona1": { ... },
        "persona2": { ... }
      },
      "message": {
        "sender": "string",
        "recipients": "string",
        "text": "string",
        "raw_text": "string (optional)"
      }
    },
    ...
  ]
}
```

**Notes**:
- Sending an empty history array (`"history": []`) will clear all conversation history and unload all models from memory
- This is the endpoint used by the "Clear History" button in the UI

**Response**:
```json
{
  "status": "string",
  "message": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response (Import History)**:
```json
{
  "status": "success",
  "message": "Imported 10 history entries",
  "timestamp": "2023-06-15T14:23:00Z"
}
```

**Example Response (Clear History)**:
```json
{
  "status": "success",
  "message": "Imported 0 history entries and unloaded models from memory",
  "timestamp": "2023-06-15T14:23:00Z"
}
```

### POST /api/prompt_template

**Purpose**: Define or update the template used to construct prompts for the models

**Request Body**:
```json
{
  "template": "string"
}
```

**Response**:
```json
{
  "status": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Request**:
```json
{
  "template": "System: {recipient.system_prompt}\n\nYou are {recipient.name} having a conversation with {sender.name}.\n\nPrevious conversation:\n{conversation_history}\n\n{sender.name}: {message.text}\n\n{recipient.name}:"
}
```

**Example Response**:
```json
{
  "status": "success",
  "timestamp": "2023-06-15T14:23:15Z"
}
```

### GET /api/models

**Purpose**: Retrieve available models from Ollama

**Response**:
```json
{
  "models": [
    {
      "name": "string",
      "size": "string",
      "quantization": "string",
      "family": "string"
    },
    ...
  ],
  "status": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response**:
```json
{
  "models": [
    {
      "name": "dolphin-phi",
      "size": "2.7B",
      "quantization": "Q4_K_M",
      "family": "Phi"
    },
    {
      "name": "llama3",
      "size": "8B",
      "quantization": "Q4_K_M",
      "family": "Llama"
    }
  ],
  "status": "success",
  "timestamp": "2023-06-15T14:23:30Z"
}
```

### GET /api/running-models

**Purpose**: Retrieve models currently loaded in memory

**Response**:
```json
{
  "models": [
    {
      "name": "string",
      "model": "string",
      "size": "number",
      "digest": "string",
      "details": {
        "parent_model": "string",
        "format": "string",
        "family": "string",
        "families": ["string"],
        "parameter_size": "string",
        "quantization_level": "string"
      },
      "expires_at": "string (ISO 8601)",
      "size_vram": "number"
    },
    ...
  ],
  "status": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response**:
```json
{
  "models": [
    {
      "name": "mistral:latest",
      "model": "mistral:latest",
      "size": 5137025024,
      "digest": "2ae6f6dd7a3dd734790bbbf58b8909a606e0e7e97e94b7604e0aa7ae4490e6d8",
      "details": {
        "parent_model": "",
        "format": "gguf",
        "family": "llama",
        "families": [
          "llama"
        ],
        "parameter_size": "7.2B",
        "quantization_level": "Q4_0"
      },
      "expires_at": "2024-06-04T14:38:31.83753-07:00",
      "size_vram": 5137025024
    }
  ],
  "status": "success",
  "timestamp": "2023-06-15T14:24:00Z"
}
```

### POST /api/unload-model/{model_name}

**Purpose**: Unload a specific model from memory

**Path Parameters**:
- `model_name`: Name of the model to unload

**Response**:
```json
{
  "status": "string",
  "message": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response**:
```json
{
  "status": "success",
  "message": "Model mistral:latest unloaded successfully",
  "timestamp": "2023-06-15T14:24:15Z"
}
```

### POST /api/unload-all-models

**Purpose**: Unload all models currently loaded in memory

**Response**:
```json
{
  "status": "string",
  "message": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Example Response**:
```json
{
  "status": "success",
  "message": "Unloaded 2 models, 0 failed",
  "timestamp": "2023-06-15T14:24:30Z"
}
```

## In-Memory Data Structures

### Message History

The in-memory message history is stored as an array of message objects:

```json
[
  {
    "message_id": "string",
    "timestamp": "string (ISO 8601)",
    "persona_settings": {
      "persona1": {
        "name": "string",
        "system_prompt": "string",
        "model": "string",
        "temperature": "number (0.0-1.0)"
      },
      "persona2": {
        "name": "string",
        "system_prompt": "string",
        "model": "string",
        "temperature": "number (0.0-1.0)"
      }
    },
    "message": {
      "sender": "string",
      "recipients": "string",
      "text": "string",
      "raw_text": "string (optional)"
    }
  },
  ...
]
```

### Conversation Context

For constructing prompts, the conversation context is initially built using the current message and the previous 2 messages. The structure is flexible to allow for future enhancements like token counting or summarization.

**Example Context Structure**:
```json
{
  "current_message": {
    "sender": "persona1",
    "text": "What do you think about the proposed architecture?"
  },
  "previous_messages": [
    {
      "sender": "persona2",
      "text": "I'm interested in hearing more about your project requirements."
    },
    {
      "sender": "persona1",
      "text": "I'm working on a distributed system for real-time data processing."
    }
  ],
  "sender_persona": {
    "name": "Bob",
    "system_prompt": "You are a creative technical AI assistant",
    "model": "dolphin-phi",
    "temperature": 0.7
  },
  "recipient_persona": {
    "name": "Alice",
    "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts",
    "model": "dolphin-phi",
    "temperature": 0.5
  }
}
```

This context is then used with the prompt template to generate the final prompt sent to the Ollama API. Note that only the `text` field (not `raw_text`) is used when building conversation history for prompts. 