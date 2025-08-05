import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider, ThemeOptions } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const lightTheme: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: '#667eea',
        light: '#8fa7f0',
        dark: '#4f5bb7',
      },
      secondary: {
        main: '#764ba2',
        light: '#9b6bc9',
        dark: '#5a3681',
      },
      background: {
        default: '#f5f7fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#1a1a1a',
        secondary: '#666666',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
          },
        },
      },
    },
  };

  const darkTheme: ThemeOptions = {
    palette: {
      mode: 'dark',
      primary: {
        main: '#667eea',
        light: '#8fa7f0',
        dark: '#4f5bb7',
      },
      secondary: {
        main: '#764ba2',
        light: '#9b6bc9',
        dark: '#5a3681',
      },
      background: {
        default: '#0a0a0a',
        paper: '#1a1a1a',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            minHeight: '100vh',
          },
        },
      },
    },
  };

  const theme = createTheme(isDarkMode ? darkTheme : lightTheme);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
