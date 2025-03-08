# Multi-Agentic: Human-in-the-Loop Conversational System

A proof-of-concept system demonstrating a human-in-the-loop approach to multi-agent conversations, where two AI personas interact with human oversight and editing capabilities.

## Overview

Multi-Agentic is a containerized application that enables two AI personas to converse with each other while allowing a human operator to review, edit, and approve each response before it's sent to the other persona. This creates a semi-autonomous conversation system where the human maintains control over the quality and direction of the dialogue.

The system is designed as a proof of concept and prioritizes functionality and flexibility over production-ready features like security, scalability, or persistent storage.

## Key Features

- **Human-in-the-Loop Design**: Review and edit AI responses before they're sent
- **Dual Persona System**: Configure two distinct AI personas with different characteristics
- **Customizable Prompts**: Edit the template used to construct prompts for the models
- **Conversation History**: View, export, and import conversation histories
- **Material Design UI**: Clean, modern interface with intuitive controls
- **Docker Containerization**: Easy deployment with Docker Compose

## Architecture

The system consists of three main containers:

1. **Frontend Container**: React-based UI with Material Design components
   - Tabbed interface (Chat, Settings, History)
   - Dual-pane chat interface for both personas
   - Settings for personas and prompt templates
   - Conversation history viewing and export/import

2. **Middle Container**: FastAPI backend that manages:
   - Message processing and routing
   - Prompt template management
   - In-memory conversation history
   - Communication with the LLM

3. **Ollama Container**: Provides access to large language models
   - Runs locally using Ollama
   - Supports various open-source models
   - GPU acceleration via NVIDIA Docker

## Data Flow

1. User composes a message from Persona A to Persona B
2. Message is sent to the middle container with persona settings
3. Middle container constructs a prompt and sends it to Ollama
4. Ollama generates a response which is returned to the frontend
5. User reviews, potentially edits, and approves the response
6. Edited response is sent back to the middle container
7. Process repeats with roles reversed

For detailed data flow diagrams, see [architecture-diagrams.md](architecture-diagrams.md).

## API Endpoints

The system exposes several API endpoints:

- `POST /api/message`: Send a message and generate a model response
- `GET /api/history`: Retrieve conversation history
- `POST /api/history`: Import conversation history
- `POST /api/prompt_template`: Update the prompt template
- `GET /api/models`: List available models from Ollama

For detailed API specifications, see [data-schema.md](data-schema.md).

## Getting Started

### Prerequisites

- Docker and Docker Compose
- NVIDIA Docker (for GPU acceleration)
- Ollama with pre-downloaded models

### Running the System

1. Clone this repository
2. Configure the Docker Compose file if needed
3. Run `docker compose up --build`
4. Access the UI at http://localhost:3000

### Configuration

The system uses sensible defaults but can be customized:

- **Persona Settings**: Configure name, system prompt, model, and temperature
- **Prompt Template**: Customize how prompts are constructed
- **Conversation Context**: By default, includes current message + previous 2 messages

## Project Structure

```
multi-agentic/
├── docker-compose.yml        # Docker Compose configuration
├── frontend/                 # React frontend
│   ├── Dockerfile            # Frontend container build instructions
│   ├── package.json          # Node.js dependencies
│   ├── public/               # Static assets
│   └── src/                  # React source code
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page components
│       ├── utils/            # Utility functions and context
│       └── App.js            # Main application component
├── middle/                   # FastAPI backend
│   ├── Dockerfile            # Middle container build instructions
│   ├── requirements.txt      # Python dependencies
│   └── app/                  # Application code
│       ├── api/              # API endpoints
│       ├── models/           # Data models
│       ├── services/         # Business logic
│       └── utils/            # Utility functions
└── pip.conf                  # Custom pip configuration
```

## Documentation

- [plan.md](plan.md): Detailed project plan and specifications
- [data-schema.md](data-schema.md): API and data structure documentation
- [sequence-diagrams.md](sequence-diagrams.md): Message flow sequence diagrams
- [architecture-diagrams.md](architecture-diagrams.md): System architecture diagrams

## License

This project is open source and available under the MIT License. 