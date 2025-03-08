import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAppContext } from '../utils/AppContext';

const ChatPage = () => {
  const { 
    personaSettings, 
    sendMessage,
    loading 
  } = useAppContext();
  
  const theme = useTheme();
  
  // State for message composition
  const [persona1Message, setPersona1Message] = useState('');
  const [persona2Message, setPersona2Message] = useState('');
  
  // State for response editing
  const [pendingResponse, setPendingResponse] = useState(null);
  
  // Refs for text fields
  const persona1InputRef = useRef(null);
  const persona2InputRef = useRef(null);
  
  // Handle sending a message from persona1 to persona2
  const handleSendFromPersona1 = async () => {
    if (!persona1Message.trim()) return;
    
    try {
      // Include raw_text if this is a response to a previous message
      const messageData = pendingResponse ? {
        sender: 'persona1',
        recipient: 'persona2',
        text: persona1Message,
        raw_text: pendingResponse.rawText
      } : {
        sender: 'persona1',
        recipient: 'persona2',
        text: persona1Message
      };

      const response = await sendMessage(
        messageData.sender,
        messageData.recipient,
        messageData.text,
        messageData.raw_text
      );
      
      setPersona1Message('');
      setPendingResponse(null);
      
      // Set up the response for editing
      setPendingResponse({
        sender: 'persona2',
        recipient: 'persona1',
        rawText: response.response.raw_text
      });
      
      // Set the raw response in the persona2 message field for editing
      setPersona2Message(response.response.raw_text);
      
      // Focus the persona2 input for editing
      setTimeout(() => {
        if (persona2InputRef.current) {
          persona2InputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message from persona1:', error);
    }
  };
  
  // Handle sending a message from persona2 to persona1
  const handleSendFromPersona2 = async () => {
    if (!persona2Message.trim()) return;
    
    try {
      // Include raw_text if this is a response to a previous message
      const messageData = pendingResponse ? {
        sender: 'persona2',
        recipient: 'persona1',
        text: persona2Message,
        raw_text: pendingResponse.rawText
      } : {
        sender: 'persona2',
        recipient: 'persona1',
        text: persona2Message
      };

      const response = await sendMessage(
        messageData.sender,
        messageData.recipient,
        messageData.text,
        messageData.raw_text
      );
      
      setPersona2Message('');
      setPendingResponse(null);
      
      // Set up the response for editing
      setPendingResponse({
        sender: 'persona1',
        recipient: 'persona2',
        rawText: response.response.raw_text
      });
      
      // Set the raw response in the persona1 message field for editing
      setPersona1Message(response.response.raw_text);
      
      // Focus the persona1 input for editing
      setTimeout(() => {
        if (persona1InputRef.current) {
          persona1InputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message from persona2:', error);
    }
  };
  
  // Handle key press events for sending messages
  const handleKeyPress = (event, sendFunction) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendFunction();
    }
  };
  
  return (
    <Box sx={{ height: '100%' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Persona 1 Panel */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: pendingResponse?.sender === 'persona1' 
                ? theme.palette.background.paper 
                : theme.palette.background.default,
              borderLeft: pendingResponse?.sender === 'persona1' 
                ? `4px solid ${theme.palette.primary.main}` 
                : 'none'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {personaSettings.persona1.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Compose message:
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <TextField
                inputRef={persona1InputRef}
                label={`Message from ${personaSettings.persona1.name} to ${personaSettings.persona2.name}`}
                multiline
                rows={12}
                fullWidth
                variant="outlined"
                value={persona1Message}
                onChange={(e) => setPersona1Message(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendFromPersona1)}
                disabled={loading || (pendingResponse && pendingResponse.sender !== 'persona1')}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '100%',
                    '& textarea': {
                      height: '100% !important',
                    },
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSendFromPersona1}
                disabled={!persona1Message.trim() || loading || (pendingResponse && pendingResponse.sender !== 'persona1')}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Persona 2 Panel */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              bgcolor: pendingResponse?.sender === 'persona2' 
                ? theme.palette.background.paper 
                : theme.palette.background.default,
              borderLeft: pendingResponse?.sender === 'persona2' 
                ? `4px solid ${theme.palette.secondary.main}` 
                : 'none'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {personaSettings.persona2.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Compose message:
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <TextField
                inputRef={persona2InputRef}
                label={`Message from ${personaSettings.persona2.name} to ${personaSettings.persona1.name}`}
                multiline
                rows={12}
                fullWidth
                variant="outlined"
                value={persona2Message}
                onChange={(e) => setPersona2Message(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendFromPersona2)}
                disabled={loading || (pendingResponse && pendingResponse.sender !== 'persona2')}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '100%',
                    '& textarea': {
                      height: '100% !important',
                    },
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSendFromPersona2}
                disabled={!persona2Message.trim() || loading || (pendingResponse && pendingResponse.sender !== 'persona2')}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatPage; 