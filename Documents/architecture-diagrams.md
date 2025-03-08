# Architecture and Data Flow Diagrams

This document provides visual representations of the multi-agentic system's architecture and data flows.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Container Interaction](#container-interaction)
3. [Data Flow Overview](#data-flow-overview)
4. [Message Processing Flow](#message-processing-flow)
5. [Conversation History Management](#conversation-history-management)

## System Architecture

```mermaid
graph TD
    subgraph "User Interface"
        UI[Frontend Container]
    end
    
    subgraph "Backend Services"
        Middle[Middle Container]
        Ollama[Ollama Container]
    end
    
    UI <--> |"JSON Messages/Responses"| Middle
    Middle <--> |"Prompts/Completions"| Ollama
    
    subgraph "Storage"
        Memory[In-Memory History]
        Files[JSON Export/Import]
    end
    
    Middle <--> Memory
    UI <--> Files
    
    style UI fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style Middle fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style Ollama fill:#FBBC05,stroke:#333,stroke-width:2px,color:white
    style Memory fill:#EA4335,stroke:#333,stroke-width:2px,color:white
    style Files fill:#4285F4,stroke:#333,stroke-width:2px,color:white,opacity:0.7
```

## Container Interaction

```mermaid
flowchart LR
    subgraph "Frontend Container"
        React[React App]
        MaterialUI[Material UI]
        StateManagement[State Management]
        APIClient[API Client]
    end
    
    subgraph "Middle Container"
        FastAPI[FastAPI Backend]
        TemplateEngine[Template Engine]
        HistoryManager[History Manager]
        OllamaClient[Ollama Client]
    end
    
    subgraph "Ollama Container"
        LLM[Language Model]
        ModelAPI[Ollama API]
    end
    
    React --> MaterialUI
    React --> StateManagement
    React --> APIClient
    
    APIClient <--> FastAPI
    
    FastAPI --> TemplateEngine
    FastAPI --> HistoryManager
    FastAPI --> OllamaClient
    
    OllamaClient <--> ModelAPI
    ModelAPI --> LLM
    
    style React fill:#61DAFB,stroke:#333,stroke-width:2px
    style MaterialUI fill:#0081CB,stroke:#333,stroke-width:2px,color:white
    style StateManagement fill:#764ABC,stroke:#333,stroke-width:2px,color:white
    style APIClient fill:#61DAFB,stroke:#333,stroke-width:2px,opacity:0.7
    
    style FastAPI fill:#009688,stroke:#333,stroke-width:2px,color:white
    style TemplateEngine fill:#4CAF50,stroke:#333,stroke-width:2px,color:white
    style HistoryManager fill:#8BC34A,stroke:#333,stroke-width:2px
    style OllamaClient fill:#CDDC39,stroke:#333,stroke-width:2px
    
    style LLM fill:#FF9800,stroke:#333,stroke-width:2px
    style ModelAPI fill:#FF5722,stroke:#333,stroke-width:2px,color:white
```

## Data Flow Overview

```mermaid
graph LR
    User((User)) --> |"Composes Message"| Frontend
    Frontend --> |"POST /api/message"| Middle
    Middle --> |"Constructs Prompt"| Middle
    Middle --> |"Sends Prompt"| Ollama
    Ollama --> |"Returns Raw Response"| Middle
    Middle --> |"Returns Message ID & Raw Response"| Frontend
    Frontend --> |"Displays for Editing"| User
    User --> |"Edits & Approves"| Frontend
    Frontend --> |"POST /api/message with raw_text"| Middle
    Middle --> |"Logs Message"| InMemory[(In-Memory History)]
    Middle --> |"Constructs Next Prompt"| Middle
    Middle --> |"Sends Prompt"| Ollama
    Ollama --> |"Returns Raw Response"| Middle
    Middle --> |"Returns Message ID & Raw Response"| Frontend
    Frontend --> |"Updates UI"| User
    
    style User fill:#E1BEE7,stroke:#333,stroke-width:2px
    style Frontend fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style Middle fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style Ollama fill:#FBBC05,stroke:#333,stroke-width:2px,color:white
    style InMemory fill:#EA4335,stroke:#333,stroke-width:2px,color:white
```

## Message Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle
    participant Ollama
    participant Memory as In-Memory History
    
    User->>Frontend: Composes message
    Frontend->>Middle: POST /api/message
    Middle->>Memory: Logs initial message
    Middle->>Middle: Constructs prompt using template
    Middle->>Ollama: Sends prompt
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    Frontend->>User: Displays raw response for editing
    
    User->>Frontend: Edits response
    User->>Frontend: Clicks "Approve/Send"
    Frontend->>Middle: POST /api/message (with raw_text)
    Middle->>Memory: Logs message with raw and edited text
    Middle->>Middle: Constructs prompt for next response
    Middle->>Ollama: Sends prompt
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    Frontend->>User: Updates UI with both messages
```

## Conversation History Management

```mermaid
graph TD
    subgraph "Frontend"
        FE_State[Local State]
        FE_UI[UI Components]
        FE_Export[Export to JSON]
        FE_Import[Import from JSON]
    end
    
    subgraph "Middle Container"
        API_Message["/api/message Endpoint"]
        API_History["/api/history Endpoint"]
        Memory[In-Memory History Array]
        ContextBuilder[Context Builder]
        PromptTemplate[Prompt Template]
    end
    
    FE_State --> FE_UI
    FE_UI --> FE_Export
    FE_Import --> FE_State
    
    API_Message --> Memory
    Memory --> API_History
    API_History --> FE_State
    
    Memory --> ContextBuilder
    PromptTemplate --> ContextBuilder
    ContextBuilder --> API_Message
    
    FE_Export --> |"Save to File"| JSON_File[(JSON File)]
    JSON_File --> |"Load from File"| FE_Import
    
    style FE_State fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style FE_UI fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style FE_Export fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style FE_Import fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    
    style API_Message fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style API_History fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style Memory fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style ContextBuilder fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style PromptTemplate fill:#34A853,stroke:#333,stroke-width:2px,color:white
    
    style JSON_File fill:#FBBC05,stroke:#333,stroke-width:2px
```

## Message Structure and Transformation

```mermaid
graph TD
    subgraph "Frontend Message"
        FE_Message[Message Object]
        FE_Timestamp[timestamp]
        FE_PersonaSettings[persona_settings]
        FE_MessageContent[message]
    end
    
    subgraph "Middle Container Processing"
        Template[Prompt Template]
        History[Previous Messages]
        Prompt[Constructed Prompt]
    end
    
    subgraph "Ollama Interaction"
        OllamaAPI[Ollama API]
        ModelOutput[Raw Model Output]
    end
    
    subgraph "Response to Frontend"
        Response[Response Object]
        MessageID[message_id]
        Status[status]
        ResponseTimestamp[timestamp]
        RawText[raw_text]
    end
    
    FE_Message --> |"POST /api/message"| Template
    FE_PersonaSettings --> Template
    History --> Template
    
    Template --> Prompt
    Prompt --> OllamaAPI
    OllamaAPI --> ModelOutput
    
    ModelOutput --> RawText
    FE_Timestamp --> MessageID
    
    MessageID --> Response
    Status --> Response
    ResponseTimestamp --> Response
    RawText --> Response
    
    Response --> |"Returned to Frontend"| FE_Message
    
    style FE_Message fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style Template fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style History fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style Prompt fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style OllamaAPI fill:#FBBC05,stroke:#333,stroke-width:2px,color:white
    style ModelOutput fill:#FBBC05,stroke:#333,stroke-width:2px,color:white
    style Response fill:#EA4335,stroke:#333,stroke-width:2px,color:white
```

## Docker Deployment Architecture

```mermaid
graph TD
    subgraph "Docker Host"
        subgraph "Docker Network"
            Frontend[Frontend Container]
            Middle[Middle Container]
            Ollama[Ollama Container]
        end
        
        BindMount["$HOME/docker-data/ollama/"]
    end
    
    User((User)) <--> |"Browser"| Frontend
    Frontend <--> |"HTTP API"| Middle
    Middle <--> |"HTTP API"| Ollama
    Ollama <--> BindMount
    
    style Frontend fill:#4285F4,stroke:#333,stroke-width:2px,color:white
    style Middle fill:#34A853,stroke:#333,stroke-width:2px,color:white
    style Ollama fill:#FBBC05,stroke:#333,stroke-width:2px,color:white
    style BindMount fill:#EA4335,stroke:#333,stroke-width:2px,color:white
    style User fill:#E1BEE7,stroke:#333,stroke-width:2px
``` 
