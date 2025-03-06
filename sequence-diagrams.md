# Sequence Diagrams

This document contains sequence diagrams illustrating the message flow in the multi-agentic system.

## Table of Contents

1. [Basic Message Flow](#basic-message-flow)
2. [Message with Response Approval](#message-with-response-approval)
3. [Error Handling Flow](#error-handling-flow)
4. [History Import/Export Flow](#history-importexport-flow)
5. [Template Update Flow](#template-update-flow)

## Basic Message Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    participant Ollama
    
    User->>Frontend: Composes message from Persona1 to Persona2
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes message text, sender, recipient, and persona settings
    
    Middle->>Middle: Logs the initial message
    Middle->>Middle: Constructs prompt using template
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Displays raw response for review
    User->>Frontend: Edits response text
    User->>Frontend: Clicks "Approve/Send"
    
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes edited text as "text" and original as "raw_text"
    Middle->>Middle: Logs the message with both raw and edited text
    Middle->>Middle: Constructs prompt for next response
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Updates UI with approved message and new response
```

## Message with Response Approval

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    participant Ollama
    
    User->>Frontend: Composes message from Persona1 to Persona2
    Frontend->>Middle: POST /api/message
    
    Middle->>Middle: Logs the initial message
    Middle->>Middle: Constructs prompt using template
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Displays raw response in editable box
    User->>Frontend: Modifies response
    Note over User,Frontend: User can edit the text before approval
    User->>Frontend: Clicks "Approve/Send"
    
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes both raw_text and edited text
    Middle->>Middle: Logs the message with both versions
    Middle->>Middle: Constructs prompt for next response
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Updates UI with approved message and new response
    Frontend->>Middle: GET /api/history
    Middle-->>Frontend: Returns updated conversation history
    Frontend->>User: Updates history view
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    participant Ollama
    
    User->>Frontend: Composes message from Persona1 to Persona2
    Frontend->>Middle: POST /api/message
    Middle->>Middle: Logs the initial message
    
    Middle->>Ollama: Sends prompt to Ollama
    
    alt Ollama Error
        Ollama--xMiddle: Connection error or timeout
        Middle->>Ollama: Retry (up to 3 attempts)
        
        alt Retry Successful
            Ollama-->>Middle: Returns raw model output
            Middle-->>Frontend: Returns message_id and raw_response
        else Retry Failed
            Middle-->>Frontend: Returns error status and message
            Frontend->>User: Displays error toast notification
            Frontend->>User: Shows retry button
        end
    else Successful Response
        Ollama-->>Middle: Returns raw model output
        Middle-->>Frontend: Returns message_id and raw_response
    end
    
    opt User Retries
        User->>Frontend: Clicks retry button
        Frontend->>Middle: POST /api/message (retry)
        Middle->>Ollama: Sends prompt to Ollama again
        Ollama-->>Middle: Returns raw model output
        Middle-->>Frontend: Returns message_id and raw_response
    end
    
    User->>Frontend: Edits response text
    User->>Frontend: Clicks "Approve/Send"
    
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes both raw_text and edited text
    Middle->>Middle: Logs the message with both versions
    Middle->>Middle: Constructs prompt for next response
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
```

## History Import/Export Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    participant LocalFile as Local File System
    
    alt Export History
        User->>Frontend: Clicks "Download History"
        Frontend->>Middle: GET /api/history
        Middle-->>Frontend: Returns complete conversation history
        Frontend->>LocalFile: Saves JSON file
        Frontend->>User: Download complete notification
    else Import History
        User->>Frontend: Clicks "Upload History"
        Frontend->>LocalFile: Opens file picker
        User->>LocalFile: Selects JSON file
        LocalFile-->>Frontend: Loads file content
        Frontend->>Frontend: Validates JSON structure
        
        alt Valid JSON
            Frontend->>Middle: POST /api/history
            Note over Frontend,Middle: Includes complete history array
            Middle->>Middle: Replaces in-memory history
            Middle-->>Frontend: Confirms import success
            Frontend->>User: Shows success notification
            Frontend->>Middle: GET /api/history
            Middle-->>Frontend: Returns updated history
            Frontend->>User: Updates history view
        else Invalid JSON
            Frontend->>User: Shows error notification
        end
    end
```

## Template Update Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    
    User->>Frontend: Navigates to Settings tab
    Frontend->>User: Displays current template
    User->>Frontend: Edits prompt template
    User->>Frontend: Clicks "Save Template"
    
    Frontend->>Middle: POST /api/prompt_template
    Note over Frontend,Middle: Includes new template string
    Middle->>Middle: Updates template in memory
    Middle-->>Frontend: Confirms update
    
    Frontend->>Frontend: Saves template in local state
    Frontend->>User: Shows success notification
    
    Note over Frontend,User: Template will be used for future message responses
```

## Complete Message Exchange Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Middle as Middle Container
    participant Ollama
    
    User->>Frontend: Configures persona settings
    User->>Frontend: Composes message from Persona1 to Persona2
    
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes complete persona settings snapshot
    Middle->>Middle: Logs message with settings
    Middle->>Middle: Constructs prompt using template
    Note over Middle: Includes current message + previous 2 messages
    Middle->>Ollama: Sends prompt
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Displays raw response for review
    User->>Frontend: Edits response text
    User->>Frontend: Clicks "Approve/Send"
    
    Frontend->>Middle: POST /api/message
    Note over Frontend,Middle: Includes both raw_text and edited text
    Middle->>Middle: Logs the message with both versions
    Middle->>Middle: Constructs prompt for next response
    Middle->>Ollama: Sends prompt to Ollama
    Ollama-->>Middle: Returns raw model output
    Middle-->>Frontend: Returns message_id and raw_response
    
    Frontend->>User: Updates UI with approved message and new response
    Frontend->>Middle: GET /api/history (polling)
    Middle-->>Frontend: Returns updated conversation history
    Frontend->>User: Updates history view
    
    User->>Frontend: Continues conversation
    Note right of User: Conversation continues with roles alternating
``` 