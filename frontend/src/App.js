import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Typography,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Import pages
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';

// Import context
import { AppContextProvider } from './utils/AppContext';

// Create theme based on mode
const createAppTheme = (mode) => {
  if (mode === 'dark') {
    // Nord Dark theme
    return createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#88C0D0', // Nord blue
          light: '#8FBCBB',
          dark: '#81A1C1',
          contrastText: '#2E3440',
        },
        secondary: {
          main: '#B48EAD', // Nord purple
          light: '#D8DEE9',
          dark: '#5E81AC',
          contrastText: '#ECEFF4',
        },
        background: {
          default: '#2E3440', // Nord dark background
          paper: '#3B4252',   // Nord darker paper
        },
        text: {
          primary: '#ECEFF4',
          secondary: '#E5E9F0',
          disabled: '#D8DEE9',
        },
        error: {
          main: '#BF616A', // Nord red
        },
        warning: {
          main: '#EBCB8B', // Nord yellow
        },
        info: {
          main: '#81A1C1', // Nord light blue
        },
        success: {
          main: '#A3BE8C', // Nord green
        },
        divider: '#4C566A',
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 500,
        },
        h2: {
          fontWeight: 500,
        },
        h3: {
          fontWeight: 500,
        },
        h4: {
          fontWeight: 500,
        },
        h5: {
          fontWeight: 500,
        },
        h6: {
          fontWeight: 500,
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    });
  } else {
    // Light theme
    return createTheme({
      palette: {
        mode: 'light',
        primary: {
          main: '#5E81AC', // Nord blue for light mode
          light: '#81A1C1',
          dark: '#4C566A',
        },
        secondary: {
          main: '#B48EAD', // Nord purple
          light: '#D8B9D3',
          dark: '#9C6B98',
        },
        background: {
          default: '#ECEFF4',
          paper: '#E5E9F0',
        },
        text: {
          primary: '#2E3440',
          secondary: '#3B4252',
        },
        error: {
          main: '#BF616A', // Nord red
        },
        warning: {
          main: '#D08770', // Nord orange
        },
        info: {
          main: '#5E81AC', // Nord blue
        },
        success: {
          main: '#A3BE8C', // Nord green
        },
        divider: '#D8DEE9',
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    });
  }
};

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}
    >
      {value === index && (
        <Box p={3} height="100%">
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [mode, setMode] = useState(() => {
    // Get saved theme preference from localStorage or default to 'dark'
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  // Create theme based on current mode
  const theme = createAppTheme(mode);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContextProvider showNotification={showNotification}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Paper elevation={3} sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                aria-label="app tabs"
                sx={{ flexGrow: 1 }}
              >
                <Tab 
                  icon={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ChatIcon sx={{ mr: 1 }} />
                      <span>Chat</span>
                    </Box>
                  } 
                  id="tab-0" 
                  aria-controls="tabpanel-0" 
                />
                <Tab 
                  icon={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SettingsIcon sx={{ mr: 1 }} />
                      <span>Settings</span>
                    </Box>
                  } 
                  id="tab-1" 
                  aria-controls="tabpanel-1" 
                />
                <Tab 
                  icon={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HistoryIcon sx={{ mr: 1 }} />
                      <span>History</span>
                    </Box>
                  } 
                  id="tab-2" 
                  aria-controls="tabpanel-2" 
                />
              </Tabs>
              <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton 
                  onClick={toggleColorMode} 
                  color="inherit"
                  sx={{ mr: 2 }}
                >
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <TabPanel value={tabValue} index={0}>
              <ChatPage />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <SettingsPage />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <HistoryPage />
            </TabPanel>
          </Box>
        </Box>

        <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
      </AppContextProvider>
    </ThemeProvider>
  );
}

export default App;
