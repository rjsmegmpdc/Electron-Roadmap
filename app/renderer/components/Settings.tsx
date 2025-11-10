import React, { useState, useEffect } from 'react';

interface SettingsData {
  timelineEndDate: string; // DD-MM-YYYY format
  darkMode: boolean;
  useSystemTheme: boolean;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    timelineEndDate: '',
    darkMode: false,
    useSystemTheme: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    applyTheme();
  }, []);

  // Apply theme when settings change
  useEffect(() => {
    applyTheme();
  }, [settings.darkMode, settings.useSystemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!settings.useSystemTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.useSystemTheme) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.useSystemTheme]);

  const applyTheme = () => {
    if (settings.useSystemTheme) {
      // Use system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      // Use manual preference
      document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    }
  };

  const loadSettings = async () => {
    try {
      // Load from database via Electron API
      if (window.electronAPI?.getSettings) {
        const loadedSettings = await window.electronAPI.getSettings();
        console.log('Settings component: Loaded from database:', loadedSettings);
        if (loadedSettings && Object.keys(loadedSettings).length > 0) {
          setSettings({
            timelineEndDate: loadedSettings.timelineEndDate || '',
            darkMode: loadedSettings.darkMode ?? false,
            useSystemTheme: loadedSettings.useSystemTheme ?? true
          });
          // Also sync to localStorage for GanttChart access
          localStorage.setItem('appSettings', JSON.stringify(loadedSettings));
        } else {
          console.log('Settings component: No settings found in database');
        }
      } else {
        // Fallback to localStorage if Electron API not available
        const localSettings = localStorage.getItem('appSettings');
        console.log('Settings component: Electron API not available, loading from localStorage:', localSettings);
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setSettings({
            timelineEndDate: parsed.timelineEndDate || '',
            darkMode: parsed.darkMode ?? false,
            useSystemTheme: parsed.useSystemTheme ?? true
          });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    // Validate date format
    if (settings.timelineEndDate && !isValidNZDate(settings.timelineEndDate)) {
      setSaveMessage({ type: 'error', text: 'Invalid date format. Please use DD-MM-YYYY format.' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      // Save to database via Electron API
      if (window.electronAPI?.saveSettings) {
        const result = await window.electronAPI.saveSettings(settings);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save settings to database');
        }
        console.log('Settings saved to database successfully');
      }
      
      // Also save to localStorage for GanttChart access
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('settingsUpdated'));
      
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const isValidNZDate = (dateStr: string): boolean => {
    if (!dateStr) return true; // Empty is valid (uses default)
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    // Check ranges
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 2000 || year > 2100) return false;
    
    // Check if date is valid (e.g., not 31-02-2025)
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const handleDateChange = (value: string) => {
    const updatedSettings = { ...settings, timelineEndDate: value };
    console.log('Settings component: Date changed to:', value, 'Full settings:', updatedSettings);
    setSettings(updatedSettings);
    // Auto-save to localStorage on change for immediate persistence
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    console.log('Settings component: Saved to localStorage:', JSON.stringify(updatedSettings));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('settingsUpdated'));
  };
  
  // Convert DD-MM-YYYY to YYYY-MM-DD for input[type="date"]
  const toInputDate = (nzDate: string): string => {
    if (!nzDate) return '';
    const [day, month, year] = nzDate.split('-');
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  // Convert YYYY-MM-DD to DD-MM-YYYY
  const fromInputDate = (inputDate: string): string => {
    if (!inputDate) return '';
    const [year, month, day] = inputDate.split('-');
    if (!year || !month || !day) return '';
    return `${day}-${month}-${year}`;
  };

  const getTodayPlusTwoYears = (): string => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    const day = futureDate.getDate().toString().padStart(2, '0');
    const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
    const year = futureDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSetTwoYears = () => {
    handleDateChange(getTodayPlusTwoYears());
  };

  const handleThemeToggle = async (darkMode: boolean) => {
    const updatedSettings = { ...settings, darkMode, useSystemTheme: false };
    setSettings(updatedSettings);
    // Auto-save to localStorage on change for immediate persistence
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    // Auto-save to database as well
    try {
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(updatedSettings);
        console.log('Theme settings auto-saved to database');
      }
    } catch (error) {
      console.error('Failed to auto-save theme settings:', error);
    }
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('settingsUpdated'));
  };

  const handleSystemThemeToggle = async (useSystemTheme: boolean) => {
    const updatedSettings = { ...settings, useSystemTheme };
    setSettings(updatedSettings);
    // Auto-save to localStorage on change for immediate persistence
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    // Auto-save to database as well
    try {
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(updatedSettings);
        console.log('System theme preference auto-saved to database');
      }
    } catch (error) {
      console.error('Failed to auto-save system theme preference:', error);
    }
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('settingsUpdated'));
  };

  return (
    <div style={{
      padding: 'var(--spacing-xl)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Theme Settings Section */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h2 style={{
          margin: '0 0 var(--spacing-md) 0',
          color: 'var(--text-primary)',
          fontSize: 'var(--font-size-xl)'
        }}>
          Appearance
        </h2>
        
        {/* Use System Theme Toggle */}
        <div style={{
          marginBottom: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-sm)'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: 'var(--font-size-md)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Use System Theme
              </label>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                margin: 0,
                lineHeight: 1.6
              }}>
                Automatically switch between light and dark mode based on your system settings.
              </p>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '28px',
              flexShrink: 0,
              marginLeft: 'var(--spacing-md)'
            }}>
              <input
                type="checkbox"
                checked={settings.useSystemTheme}
                onChange={(e) => handleSystemThemeToggle(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.useSystemTheme ? 'var(--color-primary)' : 'var(--border-color)',
                transition: '0.3s',
                borderRadius: '28px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '20px',
                  width: '20px',
                  left: settings.useSystemTheme ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Dark Mode Toggle (only shown when not using system theme) */}
        {!settings.useSystemTheme && (
          <div style={{
            marginBottom: 'var(--spacing-lg)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: 'var(--font-size-md)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Dark Mode
                </label>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  Toggle between light and dark theme manually.
                </p>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '28px',
                flexShrink: 0,
                marginLeft: 'var(--spacing-md)'
              }}>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleThemeToggle(e.target.checked)}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0
                  }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings.darkMode ? 'var(--color-primary)' : 'var(--border-color)',
                  transition: '0.3s',
                  borderRadius: '28px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '20px',
                    width: '20px',
                    left: settings.darkMode ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.3s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>
        )}

        {settings.useSystemTheme && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontStyle: 'italic',
            margin: 0
          }}>
            Currently following system theme: {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}
          </p>
        )}
      </div>

      {/* Gantt Chart Settings Section */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-lg)'
      }}>
        <h2 style={{
          margin: '0 0 var(--spacing-md) 0',
          color: 'var(--text-primary)',
          fontSize: 'var(--font-size-xl)'
        }}>
          Gantt Chart Settings
        </h2>
        
        <div style={{
          marginBottom: 'var(--spacing-xl)'
        }}>
          <label style={{
            display: 'block',
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--text-primary)',
            fontWeight: '600',
            fontSize: 'var(--font-size-md)'
          }}>
            Timeline End Date
          </label>
          
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--spacing-md)',
            lineHeight: 1.6
          }}>
            Set the end date for the Gantt chart timeline. If left empty, the timeline will automatically extend 12 months past the last project end date. This setting applies to all zoom levels (Week, Fortnight, Month, Quarter, FY Year).
          </p>
          
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            alignItems: 'flex-start',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              alignItems: 'center',
              width: '100%'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={toInputDate(settings.timelineEndDate)}
                  onChange={(e) => handleDateChange(fromInputDate(e.target.value))}
                  min="2000-01-01"
                  max="2100-12-31"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  Or Type Date (DD-MM-YYYY)
                </label>
                <input
                  type="text"
                  value={settings.timelineEndDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="DD-MM-YYYY (e.g., 31-12-2026)"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleSetTwoYears}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition-colors)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Set +2 Years
              </button>
              
              <button
                onClick={() => handleDateChange('')}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition-colors)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-color-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                Clear Date (Use Auto)
              </button>
            </div>
          </div>
          
          {settings.timelineEndDate && !isValidNZDate(settings.timelineEndDate) && (
            <p style={{
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--spacing-sm)'
            }}>
              ⚠️ Invalid date format. Please use DD-MM-YYYY.
            </p>
          )}
          
          {!settings.timelineEndDate && (
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--font-size-xs)',
              marginTop: 'var(--spacing-sm)',
              fontStyle: 'italic'
            }}>
              Currently using automatic calculation (last project + 12 months)
            </p>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center'
        }}>
          <button
            onClick={handleSave}
            disabled={isSaving || (!!settings.timelineEndDate && !isValidNZDate(settings.timelineEndDate))}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: 'var(--color-info)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              opacity: isSaving ? 0.6 : 1,
              transition: 'var(--transition-colors)'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = 'var(--color-info-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = 'var(--color-info)';
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <span style={{
              color: saveMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500'
            }}>
              {saveMessage.type === 'success' ? '✓' : '✗'} {saveMessage.text}
            </span>
          )}
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'var(--color-warning-light)',
        border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        color: 'var(--color-warning-dark)'
      }}>
        <strong>💡 Tip:</strong> Leave the timeline end date empty to let the system automatically calculate it based on your projects. This is recommended for most use cases.
      </div>
    </div>
  );
};
