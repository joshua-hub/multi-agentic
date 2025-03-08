import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import CodeIcon from '@mui/icons-material/Code';
import axios from 'axios';
import { useAppContext } from '../utils/AppContext';

// Generate a random color based on a string
const getColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

const HistoryPage = () => {
  const { history, importHistory, fetchHistory } = useAppContext();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latestPayload, setLatestPayload] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle downloading history
  const handleDownloadHistory = () => {
    if (history.length === 0) {
      setError('No history to download');
      return;
    }
    
    try {
      // Create a JSON blob
      const historyJson = JSON.stringify(history, null, 2);
      const blob = new Blob([historyJson], { type: 'application/json' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multi-agentic-history-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading history:', error);
      setError('Error downloading history');
    }
  };
  
  // Handle uploading history
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          const parsedHistory = JSON.parse(content);
          
          // Validate the history structure
          if (!Array.isArray(parsedHistory)) {
            throw new Error('Invalid history format: history must be an array');
          }
          
          // Import the history
          await importHistory(parsedHistory);
          await fetchHistory();
          
          setLoading(false);
        } catch (error) {
          console.error('Error parsing history file:', error);
          setError(`Error parsing history file: ${error.message}`);
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading history:', error);
      setError('Error uploading history');
      setLoading(false);
    }
    
    // Reset the file input
    event.target.value = null;
  };
  
  // Handle fetching latest payload
  const handleFetchPayload = async () => {
    try {
      const response = await axios.get('/api/latest-payload');
      if (response.data.prompt) {
        setLatestPayload(response.data);
      }
    } catch (error) {
      console.error('Error fetching payload:', error);
      setError('Failed to fetch latest payload');
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };
  
  // Format payload for tooltip
  const formatPayload = (payload) => {
    if (!payload) return 'No payload available';
    return `Model: ${payload.model}\nTemperature: ${payload.temperature}\nTimestamp: ${payload.timestamp}\n\nPrompt:\n${payload.prompt}`;
  };
  
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Conversation History</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              disabled={loading}
            >
              Import History
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadHistory}
              disabled={loading || history.length === 0}
            >
              Export History
            </Button>

            <Tooltip 
              title={formatPayload(latestPayload)}
              placement="bottom-start"
              enterDelay={200}
              leaveDelay={200}
              sx={{ 
                maxWidth: 'none',
                '& .MuiTooltip-tooltip': {
                  maxWidth: 'none',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }
              }}
            >
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                onClick={handleFetchPayload}
                disabled={loading}
              >
                Fetch Latest Payload
              </Button>
            </Tooltip>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
            {history.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                No conversation history yet. Start chatting to see messages here.
              </Typography>
            ) : (
              <List>
                {history.map((entry, index) => {
                  const senderColor = getColorFromString(entry.message.sender);
                  const isEdited = entry.message.raw_text && entry.message.raw_text !== entry.message.text;
                  
                  return (
                    <React.Fragment key={entry.message_id || index}>
                      <ListItem alignItems="flex-start" sx={{ bgcolor: 'background.paper' }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography 
                                component="span" 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  bgcolor: senderColor,
                                  px: 1,
                                  borderRadius: 1
                                }}
                              >
                                {entry.persona_settings[entry.message.sender]?.name || entry.message.sender} → {entry.persona_settings[entry.message.recipients]?.name || entry.message.recipients}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {formatTimestamp(entry.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography component="span" variant="body1" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                                {entry.message.text}
                              </Typography>
                              
                              {isEdited && (
                                <Typography 
                                  component="span" 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    display: 'block', 
                                    mt: 1, 
                                    fontStyle: 'italic',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  Original: {entry.message.raw_text}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < history.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default HistoryPage; 