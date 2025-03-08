import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Slider, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import { useAppContext } from '../utils/AppContext';

const SettingsPage = () => {
  const { 
    personaSettings, 
    promptTemplate, 
    availableModels,
    updatePersonaSettings, 
    updatePromptTemplate, 
    resetToDefaults 
  } = useAppContext();
  
  // Local state for editing
  const [localPersonaSettings, setLocalPersonaSettings] = useState({ ...personaSettings });
  const [localPromptTemplate, setLocalPromptTemplate] = useState(promptTemplate);
  
  // Update local state when context changes
  useEffect(() => {
    setLocalPersonaSettings({ ...personaSettings });
  }, [personaSettings]);
  
  useEffect(() => {
    setLocalPromptTemplate(promptTemplate);
  }, [promptTemplate]);
  
  // Handle persona settings changes
  const handlePersonaChange = (personaId, field, value) => {
    setLocalPersonaSettings(prev => ({
      ...prev,
      [personaId]: {
        ...prev[personaId],
        [field]: value
      }
    }));
  };
  
  // Handle saving persona settings
  const handleSavePersonaSettings = () => {
    updatePersonaSettings(localPersonaSettings);
  };
  
  // Handle saving prompt template
  const handleSavePromptTemplate = () => {
    updatePromptTemplate(localPromptTemplate);
  };
  
  // Handle reset to defaults
  const handleResetToDefaults = () => {
    resetToDefaults();
  };
  
  // Template help text
  const templateHelpText = `
Available variables:
- {sender.name} - Name of the sender
- {sender.system_prompt} - System prompt of the sender
- {recipient.name} - Name of the recipient
- {recipient.system_prompt} - System prompt of the recipient
- {message.text} - The message text
- {conversation_history} - Previous conversation history
  `;
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Prompt Template Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Prompt Template</Typography>
              <Tooltip title={templateHelpText} placement="right">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <TextField
              label="Template"
              multiline
              rows={8}
              fullWidth
              variant="outlined"
              value={localPromptTemplate}
              onChange={(e) => setLocalPromptTemplate(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Define how prompts are constructed for the models"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSavePromptTemplate}
                disabled={!localPromptTemplate.trim()}
              >
                Save Template
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Persona Settings Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {localPersonaSettings.persona1.name} Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              label="Name"
              fullWidth
              variant="outlined"
              value={localPersonaSettings.persona1.name}
              onChange={(e) => handlePersonaChange('persona1', 'name', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={localPersonaSettings.persona1.model}
                onChange={(e) => handlePersonaChange('persona1', 'model', e.target.value)}
                label="Model"
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.name} value={model.name}>
                    {model.name} ({model.size}, {model.family})
                  </MenuItem>
                ))}
                {availableModels.length === 0 && (
                  <MenuItem value="dolphin-phi">dolphin-phi (default)</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Temperature: {localPersonaSettings.persona1.temperature}</Typography>
              <Slider
                value={localPersonaSettings.persona1.temperature}
                onChange={(e, newValue) => handlePersonaChange('persona1', 'temperature', newValue)}
                step={0.1}
                marks
                min={0}
                max={1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <TextField
              label="System Prompt"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={localPersonaSettings.persona1.system_prompt}
              onChange={(e) => handlePersonaChange('persona1', 'system_prompt', e.target.value)}
              sx={{ mb: 2 }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {localPersonaSettings.persona2.name} Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              label="Name"
              fullWidth
              variant="outlined"
              value={localPersonaSettings.persona2.name}
              onChange={(e) => handlePersonaChange('persona2', 'name', e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={localPersonaSettings.persona2.model}
                onChange={(e) => handlePersonaChange('persona2', 'model', e.target.value)}
                label="Model"
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.name} value={model.name}>
                    {model.name} ({model.size}, {model.family})
                  </MenuItem>
                ))}
                {availableModels.length === 0 && (
                  <MenuItem value="dolphin-phi">dolphin-phi (default)</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Temperature: {localPersonaSettings.persona2.temperature}</Typography>
              <Slider
                value={localPersonaSettings.persona2.temperature}
                onChange={(e, newValue) => handlePersonaChange('persona2', 'temperature', newValue)}
                step={0.1}
                marks
                min={0}
                max={1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <TextField
              label="System Prompt"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={localPersonaSettings.persona2.system_prompt}
              onChange={(e) => handlePersonaChange('persona2', 'system_prompt', e.target.value)}
              sx={{ mb: 2 }}
            />
          </Paper>
        </Grid>
        
        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestartAltIcon />}
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSavePersonaSettings}
            >
              Save Settings
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage; 