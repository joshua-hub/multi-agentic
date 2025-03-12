import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Default persona settings
const DEFAULT_PERSONA_SETTINGS = {
  persona1: {
    name: "Bob",
    system_prompt: "You are a creative technical AI assistant",
    model: "dolphin-phi",
    provider: "ollama",
    temperature: 0.7
  },
  persona2: {
    name: "Alice",
    system_prompt: "You are a technical AI assistant who critically assesses ideas",
    model: "dolphin-phi",
    provider: "ollama",
    temperature: 0.5
  }
};

// Default prompt template
const DEFAULT_PROMPT_TEMPLATE = `System: {recipient.system_prompt}

You are {recipient.name} having a conversation with {sender.name}.

Previous conversation:
{conversation_history}

{sender.name}: {message.text}

{recipient.name}:`;

// Default chat state
const DEFAULT_CHAT_STATE = {
  pendingResponse: null
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppContextProvider = ({ children, showNotification }) => {
  // State
  const [personaSettings, setPersonaSettings] = useState(DEFAULT_PERSONA_SETTINGS);
  
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE);
  
  const [chatState, setChatState] = useState(DEFAULT_CHAT_STATE);
  
  const [history, setHistory] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Remove localStorage loading until after component mounts
  useEffect(() => {
    const savedSettings = localStorage.getItem('personaSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPersonaSettings(parsed);
      } catch (e) {
        console.error('Error parsing saved settings:', e);
        localStorage.removeItem('personaSettings');
      }
    }
  }, []);
  
  useEffect(() => {
    const savedTemplate = localStorage.getItem('promptTemplate');
    if (savedTemplate) {
      try {
        setPromptTemplate(savedTemplate);
      } catch (e) {
        console.error('Error loading saved template:', e);
        localStorage.removeItem('promptTemplate');
      }
    }
  }, []);
  
  useEffect(() => {
    const savedChatState = localStorage.getItem('chatState');
    if (savedChatState) {
      try {
        const parsed = JSON.parse(savedChatState);
        setChatState(parsed);
      } catch (e) {
        console.error('Error parsing saved chat state:', e);
        localStorage.removeItem('chatState');
      }
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('personaSettings', JSON.stringify(personaSettings));
  }, [personaSettings]);
  
  useEffect(() => {
    localStorage.setItem('promptTemplate', promptTemplate);
  }, [promptTemplate]);
  
  // Save chat state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatState', JSON.stringify(chatState));
  }, [chatState]);
  
  // Fetch history on component mount and periodically
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Fetch available models on component mount
  useEffect(() => {
    fetchAvailableModels();
  }, []);
  
  // Function to update chat state
  const updateChatState = (updates) => {
    setChatState(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // API functions
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };
  
  const fetchAvailableModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setAvailableModels(response.data.models);
    } catch (error) {
      console.error('Error fetching models:', error);
      showNotification('Failed to fetch available models', 'error');
    }
  };
  
  const sendMessage = async (sender, recipient, text, raw_text = null) => {
    setLoading(true);
    
    try {
      const timestamp = new Date().toISOString();
      
      const response = await axios.post('/api/message', {
        timestamp,
        persona_settings: personaSettings,
        message: {
          sender,
          recipients: recipient,
          text,
          raw_text
        }
      });
      
      setLoading(false);
      await fetchHistory();
      
      return response.data;
    } catch (error) {
      setLoading(false);
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
      throw error;
    }
  };
  
  const updatePromptTemplate = async (template) => {
    try {
      const response = await axios.post('/api/prompt_template', {
        template
      });
      
      setPromptTemplate(template);
      showNotification('Prompt template updated successfully', 'success');
      
      return response.data;
    } catch (error) {
      console.error('Error updating prompt template:', error);
      showNotification('Failed to update prompt template', 'error');
      throw error;
    }
  };
  
  const importHistory = async (historyData) => {
    try {
      const response = await axios.post('/api/history', {
        history: historyData
      });
      
      await fetchHistory();
      showNotification('History imported successfully', 'success');
      
      return response.data;
    } catch (error) {
      console.error('Error importing history:', error);
      showNotification('Failed to import history', 'error');
      throw error;
    }
  };
  
  const updatePersonaSettings = (newSettings) => {
    setPersonaSettings(newSettings);
    showNotification('Persona settings updated', 'success');
  };
  
  const resetToDefaults = () => {
    setPersonaSettings(DEFAULT_PERSONA_SETTINGS);
    setPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
    showNotification('Settings reset to defaults', 'info');
  };
  
  const clearAllData = async () => {
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Reset all state to defaults
      setPersonaSettings(DEFAULT_PERSONA_SETTINGS);
      setPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
      setChatState(DEFAULT_CHAT_STATE);
      
      // Clear history on the server
      await importHistory([]);
      
      showNotification('All data cleared and reset to defaults', 'info');
    } catch (error) {
      console.error('Error clearing data:', error);
      showNotification('Error clearing data', 'error');
    }
  };
  
  // Context value
  const contextValue = {
    personaSettings,
    promptTemplate,
    history,
    availableModels,
    loading,
    chatState,
    updateChatState,
    sendMessage,
    updatePromptTemplate,
    importHistory,
    updatePersonaSettings,
    resetToDefaults,
    clearAllData,
    fetchHistory
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}; 