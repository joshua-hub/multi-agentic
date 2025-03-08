# Model Memory Persistence Issue

## Problem Description
When clearing chat history in the multi-agentic application, the Ollama model retains its memory state in VRAM. This means that even after clearing the conversation history in our application, the model can still reference previous conversations in its responses.

## Current Limitations

### Ollama API
- No equivalent to CLI command `ollama stop <modelname>`
- No direct API endpoint to clear model state/context
- No "no history" option in `/api/generate` endpoint
- Each `/api/generate` request is independent, but model maintains internal state

### Container Management
- Restarting container would clear state but:
  - Requires elevated privileges (Docker socket access)
  - Not best practice for app to manage container lifecycle
  - Would affect all users in multi-user setup
  - Creates service downtime
  - Would need careful security consideration

## Potential Solutions

### 1. User Interface Solutions
- Add warning to users that clearing history doesn't clear model memory
- Implement manual "Reset Model" button that instructs users to use CLI
- Add documentation about model memory persistence

### 2. Technical Solutions
- Configure shorter TTL for model instances (default is 5 minutes)
  - Pros: Automatic cleanup
  - Cons: Affects all users, more cold starts
- Use different model instance per conversation
  - Pros: Clean separation
  - Cons: Resource intensive, more VRAM usage
- Contribute to Ollama to add state clearing endpoint
  - Pros: Best long-term solution
  - Cons: Requires upstream changes

### 3. Architectural Solutions
- Implement model pooling system
- Add container orchestration layer
- Create isolated model instances per user/conversation

## Next Steps
1. Decide priority of this issue
2. Choose approach based on:
   - Security requirements
   - Resource constraints
   - User experience needs
   - Development effort available
3. Consider contributing to Ollama project

## Related Links
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Ollama CLI Documentation](https://github.com/ollama/ollama/blob/main/docs/cli.md)
- [Model Memory Management Discussion](https://github.com/ollama/ollama/discussions)

## Questions to Consider
- How critical is model state isolation for our use case?
- Are we okay with users seeing remnants of previous conversations?
- What's our resource budget for potential solutions?
- Do we need immediate solution or can we wait for upstream changes? 