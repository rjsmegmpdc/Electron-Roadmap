import React, { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Load theme settings from database
        if (window.electronAPI?.getSettings) {
          const settings = await window.electronAPI.getSettings();
          
          const useSystemTheme = settings.useSystemTheme ?? true;
          const darkMode = settings.darkMode ?? false;

          if (useSystemTheme) {
            // Use system theme preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            // Use manual preference
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
          }
        } else {
          // Fallback to localStorage
          const localSettings = localStorage.getItem('appSettings');
          if (localSettings) {
            const settings = JSON.parse(localSettings);
            const useSystemTheme = settings.useSystemTheme ?? true;
            const darkMode = settings.darkMode ?? false;

            if (useSystemTheme) {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
              document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
            }
          } else {
            // Default to system theme
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        // Default to system theme on error
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
      
      setIsInitialized(true);
    };

    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = async (e: MediaQueryListEvent) => {
      // Check if we should follow system theme
      try {
        if (window.electronAPI?.getSettings) {
          const settings = await window.electronAPI.getSettings();
          if (settings.useSystemTheme ?? true) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
          }
        } else {
          const localSettings = localStorage.getItem('appSettings');
          if (localSettings) {
            const settings = JSON.parse(localSettings);
            if (settings.useSystemTheme ?? true) {
              document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
          } else {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Failed to handle system theme change:', error);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Show children only after theme is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
};
