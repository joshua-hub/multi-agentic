# Auto-Response Feature Implementation

## Overview

This document outlines how to implement a simple "auto-response" feature for the multi-agentic chat application. The feature allows each persona to automatically send a specified number of responses without requiring the user to manually click the send button.

## Implementation Plan

### 1. Add UI Elements

First, add UI elements to allow users to set the number of auto-responses for each persona:

```javascript
// In ChatPage.js
// Add inside each persona's panel, near the top
<TextField
  type="number"
  size="small"
  label="Auto-responses"
  value={personaAutoResponseCount}
  onChange={(e) => setPersonaAutoResponseCount(e.target.value)}
  inputProps={{ min: 0, max: 20 }}
  sx={{ width: 120 }}
/>
```

### 2. Add State to AppContext

Add state variables to track the auto-response count for each persona:

```javascript
// In AppContext.js - DEFAULT_CHAT_STATE
const DEFAULT_CHAT_STATE = {
  persona1Message: '',
  persona2Message: '',
  pendingResponse: null,
  persona1AutoRespond: 0,  // Add this
  persona2AutoRespond: 0   // Add this
};
```

### 3. Add Function to Update Auto-Response Counts

```javascript
// In ChatPage.js
const handleAutoResponseChange = (persona, value) => {
  // Limit to 0-20 range
  const count = Math.max(0, Math.min(parseInt(value) || 0, 20));
  
  updateChatState({
    [`${persona}AutoRespond`]: count
  });
};
```

### 4. Modify the Send Button Handlers

The key to the auto-response feature is to:
1. Check if the recipient has auto-responses enabled
2. If yes, decrement their counter
3. Wait a short delay (so the user can see what's happening)
4. Then call the recipient's send function

```javascript
// In ChatPage.js - handleSendFromPersona1 function
const handleSendFromPersona1 = async () => {
  if (!chatState.persona1Message.trim()) return;
  
  try {
    // Get raw_text if applicable
    const raw_text = chatState.pendingResponse?.sender === 'persona1' 
      ? chatState.pendingResponse.rawText 
      : null;
    
    // Send the message
    await sendMessage('persona1', 'persona2', chatState.persona1Message, raw_text);
    
    // Check if persona2 has auto-responses set up
    const p2AutoCount = chatState.persona2AutoRespond;
    if (p2AutoCount > 0) {
      // Decrement the counter
      updateChatState({
        persona2AutoRespond: p2AutoCount - 1
      });
      
      // Wait 2 seconds, then auto-send persona2's response
      setTimeout(() => {
        // Only attempt to send if there's a message
        if (chatState.persona2Message) {
          handleSendFromPersona2();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error sending message from persona1:', error);
  }
};

// Similarly for handleSendFromPersona2 function
const handleSendFromPersona2 = async () => {
  if (!chatState.persona2Message.trim()) return;
  
  try {
    // Get raw_text if applicable
    const raw_text = chatState.pendingResponse?.sender === 'persona2' 
      ? chatState.pendingResponse.rawText 
      : null;
    
    // Send the message
    await sendMessage('persona2', 'persona1', chatState.persona2Message, raw_text);
    
    // Check if persona1 has auto-responses set up
    const p1AutoCount = chatState.persona1AutoRespond;
    if (p1AutoCount > 0) {
      // Decrement the counter
      updateChatState({
        persona1AutoRespond: p1AutoCount - 1
      });
      
      // Wait 2 seconds, then auto-send persona1's response
      setTimeout(() => {
        // Only attempt to send if there's a message
        if (chatState.persona1Message) {
          handleSendFromPersona1();
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error sending message from persona2:', error);
  }
};
```

## Key Points to Remember

1. **Simplicity**: The auto-response feature should simply simulate a "delayed button click" - nothing more complex.

2. **Visual Feedback**: Always decrement the counter BEFORE sending the auto-response, so the user sees the count change.

3. **Timeout**: Use a timeout to create a delay between receiving a message and auto-responding, so the user can see the conversation flow.

4. **Safety Check**: Only auto-respond if there's actually a message to send.

5. **Keep sendMessage Simple**: Don't try to handle auto-responses in the sendMessage function itself - keep that function focused on its core responsibility of sending a single message.

## Testing the Feature

1. Set an auto-response count of 3 for Persona1
2. Send a message from Persona2 to Persona1
3. Persona1 should auto-respond, and the counter should decrement to 2
4. Persona2 should receive the message
5. Repeat until the counter reaches 0
6. When the counter reaches 0, no more auto-responses should occur

## Potential Enhancements

- Add a visual indicator when auto-responses are active
- Add a way to cancel pending auto-responses
- Add a setting to control the delay between auto-responses 