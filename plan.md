This is a proof of concept plan for a human in the loop agentic system where two agents converse to meet a common goal. Being a proof of concept, it is not meant to be a production ready system. This means that the system is not meant to be secure, scalable, or reliable. It is meant to be a proof of concept that can be used to build a production ready system. There is no logging, all the messsges and settings are captured in json structure in the middle container with the front end giving options to save and load the json structure. I don't need deployment or CI/CD. I just need to be able to run the system locally and have a way to test the system. I don't need and security considerations. No backup, recover, or data persistence is needed as any conversations whated to be saved can be saved from the json structure in the middle container.


1. Overall System Architecture

• Frontend Container  
 – A dynamic web UI built with React using material design elements. (i just like the look of it)
  ○ Lets you select models and adjust settings (e.g., temperature, system prompt, and persona name for each agent).
  ○ Displays incoming messages in an editable message box.
  ○ Provides buttons for "Approve/Send" so that you can review and modify generated responses before forwarding them.
  ○ Contains a chat history view (similar to Mattermost or Slack) that displays all message exchanges along with just the approved messages from the JSON log.
  ○ Includes features to import/export the complete conversation history as JSON. This allows persistence of the conversation history between sessions.
  ○ Maintains local state of current settings and sends them with each message payload.

• Middle Container (FastAPI Backend)  
 – The central hub that:
  ○ Accepts incoming messages together with snapshots of persona settings.
  ○ Constructs dynamic prompts by merging the relevant persona settings into a templated string.
  ○ Sends the prompt to the LLM (in the Ollama container) and receives the raw output.
  ○ Returns the unaccepted/raw response to the frontend for manual review.
  ○ Accepts the human-edited, final version of a response and logs that along with the raw version.
  ○ Maintains a complete JSON log for every message exchange in a structured format.
  ○ Future-proofs communication by including a "recipient" field so that later, private or broadcast messages can be easily implemented.
  ○ Stores all conversation history in memory (no database required) - the system has ample RAM and this is text-only data.

• Ollama Container  
 – Runs the LLM backend (ollama:latest) that receives prompts, generates responses, and returns text to the Middle container. This should not be streaming to keep the system simple.
 – I already have ollama container available on my machine with default settings and defaul port 11434 and models downloaded.
 – GPU support is available through nvidia-docker and nvidia-container-toolkit.

──────────────────────────────
2. Data Flow and JSON Logging

a. Two-Phase Message Processing

 1. Sending Phase:  
  – When Persona1 sends a message, the frontend immediately packages a JSON object that includes:
   {
    "timestamp": <timestamp>,
    "persona_settings": {
     "persona1": { "name": ..., "system_prompt": ..., "temperature": ... },
     "persona2": { "name": ..., "system_prompt": ..., "temperature": ... }
    },
    "message": { "sender": "persona1", "recipients": "persona2", "text": "message text", … }
   }  
  – This complete snapshot is sent to the middle container and logged immediately.

 2. Response and Approval Phase:  
  – The middle container uses the above data (along with dynamic templating) to construct a prompt for Persona2.
  – The prompt is sent to the Ollama container which returns the raw/generated output. This is not streamed.
  – The middle container sends this raw response back to the frontend WITHOUT capturing it in the log yet.
  – On the frontend, this response appears in an editable message box so that you (the operator) may review and modify it.
  – Once approved, a separate API call (e.g., POST to /approve_response) is made to the middle container that logs the response. The JSON log entry now gets updated to include both the raw response and the approved version.

b. Updated JSON Structure

Each message exchange is logged with a structure like:

 {
  "timestamp": <timestamp>,
  "persona_settings": {
   "persona1": { "name": ..., "system_prompt": ..., "temperature": ... },
   "persona2": { "name": ..., "system_prompt": ..., "temperature": ... }
  },
  "message": {
   "sender": "persona1",
   "recipients": "persona2",
   "text": "message text", … 
  },
  "response": {
   "original_output": "raw model response text",
   "approved_output": "final approved text"
  }
 }

Note: Including the recipients field prepares the system for future iterations that may support multiple recipients and private messages. The context that gets sent to a model must be restricted to the personas listed in the recipients field.

c. Conversation History Management

 – All conversation history is stored in-memory in the middle container.
 – No database is required as this is a proof of concept with text-only data and the system has ample RAM.
 – For context in prompts, initially include the current message and previous 2 messages.
 – The conversation history management is designed to be flexible:
   ○ Initially simple (fixed number of previous messages)
   ○ Can be extended later to support token counting, summarization, or other approaches
   ○ No hard-coded limits on history size - the entire conversation remains in memory

d. Message ID Generation and Management

 – Message IDs are generated using a combination of timestamp and a random string.
 – These IDs link initial messages with their responses and are used in the approval process.
 – The frontend references these IDs when approving edited responses.

──────────────────────────────
3. Development Roadmap and Milestones

Phase 1: Project Setup and Specification  
 • Write detailed requirements/specifications—including exactly what must be logged and how the two-phase message process will work.
 • Set up a Git repository with a clear project structure (frontend, middle, and integration with Ollama).
 • Prepare initial documentation and draft API contracts (endpoints for message submission, approval, and history import/export).

Phase 2: Build the Middle Container (FastAPI Backend)

a. Core API Endpoints  
 – Implement POST /api/message
   ○ Purpose: Send a message from one persona to another and generate a model response
   ○ Request Body: JSON containing message text, sender info, recipient(s), and complete persona settings snapshot
   ○ Response: 200 OK with message ID and raw model response, appropriate error codes (400, 500) on failure
   ○ Example Request (Sending a Human Message):
     ```json
     {
       "timestamp": "2023-06-15T14:22:31Z",
       "persona_settings": {
         "persona1": { "name": "Bob", "system_prompt": "You are a creative technical AI assistant", "model": "dolphin-phi", "temperature": 0.7 },
         "persona2": { "name": "Alice", "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts", "model": "dolphin-phi", "temperature": 0.5 }
       },
       "message": {
         "sender": "persona1",
         "recipients": "persona2",
         "text": "Hello, how can I help you today?"
       }
     }
     ```
   ○ Example Response:
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
   ○ Example Request (Sending an Edited AI Response):
     ```json
     {
       "timestamp": "2023-06-15T14:22:40Z",
       "persona_settings": {
         "persona1": { "name": "Bob", "system_prompt": "You are a creative technical AI assistant", "model": "dolphin-phi", "temperature": 0.7 },
         "persona2": { "name": "Alice", "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts", "model": "dolphin-phi", "temperature": 0.5 }
       },
       "message": {
         "sender": "persona2",
         "recipients": "persona1",
         "text": "I'm doing well! I'm particularly interested in discussing the technical aspects of your project.",
         "raw_text": "I'm doing well, thank you for asking! How can I assist you today?"
       }
     }
     ```
   ○ Example Response:
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
   ○ The persona settings are all input fields in the front end. Where model is a menu of models that are available in the ollama container.
   ○ Every message sent to the middleware is transformed into a prompt for Ollama
   ○ When a message includes raw_text, both the edited text and raw model output are stored in the history
   ○ The response always includes the raw model output from Ollama

 – Implement GET /api/history
   ○ Purpose: Retrieve the complete conversation history
   ○ Query Parameters: Optional filters (time range, personas)
   ○ Response: 200 OK with JSON array of all message exchanges
   ○ This endpoint returns the complete in-memory history

 – Implement POST /api/history
   ○ Purpose: Import a previously saved conversation history
   ○ Request Body: Complete JSON history
   ○ Response: 200 OK on success, 400 on invalid format
   ○ This replaces the current in-memory history with the imported one

 – Implement POST /api/prompt_template
   ○ Purpose: Define or update the template used to construct prompts for the models
   ○ Request Body: Template string with placeholders for persona settings and message content
   ○ Response: 200 OK on success
   ○ Example Template:
     ```
     System: {recipient.system_prompt}
     
     You are {recipient.name} having a conversation with {sender.name}.
     
     Previous conversation:
     {conversation_history}
     
     {sender.name}: {message.text}
     
     {recipient.name}:
     ```

 – Implement GET /api/models
   ○ Purpose: Retrieve available models from Ollama
   ○ Response: 200 OK with list of available models and their details

b. Logging Module  
 – Develop the logging module to save each message with its complete state.
 – Ensure that an entry made on initial sending gets updated when the approved response is received.
 – Write unit tests to confirm that both raw and approved responses are captured.
 – All logs are kept in memory - no persistent storage required.

c. Dynamically Constructing Prompts  
 – Build a templating module that constructs prompts from the JSON state.
 – Use Python's f-string to manage variables like {persona1.name}, {persona2.system_prompt}, etc.
 – Include logic to eventually adapt to other recipient scenarios.
 – For conversation history, initially include the current message and previous 2 messages.
 – Design the history inclusion to be flexible for future enhancements (token counting, summarization).

d. Context Management  
 – Create helper functions to select and include prior messages (while managing context window limitations).  
 – Write unit tests that simulate long conversations and ensure the prompt is correctly trimmed or summarized.
 – Initially implement a simple approach (fixed number of previous messages).
 – Design for extensibility to support more sophisticated approaches later.

e. Error Handling Strategy
 – Implement basic error handling for Ollama API failures:
   ○ Retry logic for transient errors (up to 3 attempts)
   ○ Clear error messages returned to frontend
 – Handle message processing failures:
   ○ Log errors with message IDs
   ○ Return appropriate HTTP status codes with descriptive messages
 – Communicate errors to the user through the frontend:
   ○ Display toast notifications for errors
   ○ Provide retry options where appropriate

Phase 3: Develop the Model Interaction Module

a. Communicating with Ollama  
 – Build a module that takes the prepared prompt and sends a request to the Ollama container's API.
 – Ensure that the module properly handles errors and retry logic.
 – Write tests or use a dummy model response during early development.
 – Support GPU acceleration through nvidia-docker integration.

b. Integration with the API Endpoints  
 – Link the template generation, model interaction, and logging so that the raw model output is returned to the frontend for manual approval.

Phase 4: Build the Frontend UI

a. Overall UI Structure
 – Implement a tabbed interface with three main tabs:
   ○ Chat Interface (default tab)
   ○ Settings
   ○ Chat History
 – Use Material Design components for a clean, modern look
 – Ensure responsive design that works well on different screen sizes

b. Chat Interface Tab
 – Design a dual-pane chat interface showing both personas' perspectives
 – For each persona section, include:
   ○ Header displaying the persona name (dynamically pulled from settings)
   ○ Large message composition area
   ○ Send button to initiate message sending
 – When a message is sent from one persona:
   ○ Display a loading indicator in the recipient's pane
   ○ When response is generated, show it in the recipient's message box for editing before sending back to the other recipient.
   ○ when the user has accepted the response, the send button is clicked and the response is sent back to the other recipient.

c. Settings Tab
 – Create two main sections:
   1. Prompt Template Configuration:
     ○ Large text area for editing the template
     ○ "Save Template" button to update the template on the server
     ○ "Help" button that displays a modal with available variables and syntax
     ○ Example variables tooltip: {persona1.name}, {persona2.name}, {message.text}, {conversation_history}, etc.
     ○ Preview section showing how a sample message would be formatted with the current template
     ○ Template changes are saved both to the middle container and in the frontend's local state

   2. Persona Settings:
     ○ Create panels for each persona (initially two personas)
     ○ For each persona, include form fields for:
       • Name (text input)
       • Model (dropdown populated from /api/models endpoint)
       • Temperature (slider from 0.0 to 1.0 with step 0.1)
       • System Prompt (large text area)
     ○ "Save Settings" button that saves all persona configurations at once ready for the next message exchange.
     ○ "Reset to Defaults" button to restore initial settings
     ○ Settings are stored in the frontend's local state and sent with each message payload
     ○ No hardcoded defaults - but use these as persona defaults 
        "persona_settings": {
         "persona1": { "name": "Bob", "system_prompt": "You are a creative technical AI assistant", "model": "dolphin-phi", "temperature": 0.7 },
         "persona2": { "name": "Alice", "system_prompt": "You are a technical AI assistant who specialises in critically assessing ideas and concepts", "model": "dolphin-phi", "temperature": 0.5 }
    ○ And use these as the default settings for the template.
    ```
     System: {recipient.system_prompt}
     
     You are {recipient.name} having a conversation with {sender.name}.
     
     Previous conversation:
     {conversation_history}
     
     {sender.name}: {message.text}
     
     {recipient.name}:
    ```

d. Chat History Tab
 – Implement a Mattermost/Slack-style conversation view:
   ○ Messages grouped by sender with clear visual separation
   ○ Format: "{persona.name} → {recipients}: {message_text}"
   ○ A color randomly assigned for each persona for visual separation
   ○ Automatic polling to refresh the complete conversation history from middleware (every 5 seconds)
   ○ Messages ordered by timestamp
 – Add export/import functionality:
   ○ "Download History" button to save the complete history JSON conversation to .json file
   ○ "Upload History" button to import a previously saved history JSON conversation from .json file
   ○ A strucure validation check is done on the uploaded history to ensure it is valid.
 – The history tab polls the GET /api/history endpoint and displays the processed response

e. State Management
 – Implement React Context or Redux for global state management
 – Store and manage:
   ○ Current persona settings
   ○ UI state (active tab, loading states, etc.)
   ○ Template configuration sent to the middle container on save and saved in the frontend
 – Ensure state persistence across page refreshes using localStorage
 – save current settings in the frontend and send current settings with each message payload to the backend

f. API Integration
 – Create a services layer to interact with the FastAPI backend
 – Implement functions for all API endpoints:
   ○ sendMessage()
   ○ generateResponse()
   ○ approveResponse()
   ○ getHistory()
   ○ importHistory()
   ○ updateTemplate()
   ○ getAvailableModels()
 – Add proper error handling and loading states for all API calls

g. User Experience Enhancements
 – Add keyboard shortcuts for common actions (send message, approve response)
 – Implement toast notifications for important events (message sent, response approved)
 – Add confirmation dialogs for destructive actions (clearing history, overwriting settings)
 – Include a "typing" indicator when responses are being generated
 – Implement dark/light mode toggle

Phase 5: Containerization and Orchestration

a. Dockerizing Each Component
 – I have docker build instructions for the pattern i want to use in docker-build-patterns.md in the root of this project.
 – I have a pip.conf file that is needed for the docker builds that i want to use in the root of this project.
 – Create Dockerfiles for the Frontend and Middle containers.
 – Prepare a Docker Compose file that orchestrates:
  ○ Frontend container
  ○ Middle container (FastAPI backend with all modules)
  ○ Ollama container (using the image ollama:latest)
 – Configure each container to communicate over defined networks.
 

b. End-to-End Testing with Docker Compose  
 – Run the complete system locally using Docker Compose.
 – I do not like docker volumes. i would prefer to use docker bind mounts to the host. Right now I think ollama is the only thing that needs to be persisted and i have mentioned that below.
 – Verify that the end-to-end flow (sending message → receiving raw response → editing & approving response → logging) works seamlessly.
 – For the docker compose, i already have ollama models downloaded and you volume mount /home/fox/docker-data/ollama/ to root/.ollama/ inside the ollama container.
 – Use nvidia-docker and nvidia-container-toolkit for GPU support in the Ollama container.
 – Iterate over built containers during development using `docker compose --build up` command.

Phase 6: Final Documentation and Presentation

a. Finalize User and Developer Documentation  
 – Update README and API documentation to explain the two-phase message process, JSON schema, and how to import/export conversation history.
 – Document the templating, logging, and context management modules for future maintainers.

b. Prepare a Demo  
 – Run through several message exchanges to illustrate both the raw model output and the human-approved output.
 – Showcase the future-proof aspects (e.g., the recipient field) for multi-recipient messages and private messaging scenarios.

──────────────────────────────
4. Tips for Working with the LLM During Development

• Use the LLM to generate boilerplate code for FastAPI endpoints, Dockerfiles, and JavaScript components.
• Ask the LLM for code reviews of your logging module or templating functions to ensure they handle both raw and approved text.
• Work iteratively: build and test one module at a time (e.g., start with the logging and API endpoints in the Middle container, then move to frontend integration).
• Use sample JSON payloads (like the one defined above) and ask the LLM for unit test examples to verify that your implementation meets the specification.