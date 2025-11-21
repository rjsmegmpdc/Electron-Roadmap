import { ipcMain } from 'electron';
import type { DB } from '../db';

export function registerSettingsHandlers(db: DB) {
  // Save settings
  ipcMain.handle('settings:save', async (_event, settings: Record<string, any>) => {
    try {
      console.log('Saving settings to database:', settings);
      
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `);
      
      // Save each setting as a key-value pair
      const tx = db.transaction((settingsObj: Record<string, any>) => {
        for (const [key, value] of Object.entries(settingsObj)) {
          stmt.run(key, JSON.stringify(value), now);
        }
      });
      
      tx(settings);
      
      console.log('Settings saved successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Load settings
  ipcMain.handle('settings:load', async () => {
    try {
      console.log('Loading settings from database');
      
      const rows = db.prepare('SELECT key, value FROM app_settings').all() as Array<{
        key: string;
        value: string;
      }>;
      
      const settings: Record<string, any> = {};
      for (const row of rows) {
        try {
          settings[row.key] = JSON.parse(row.value);
        } catch (error) {
          console.error(`Failed to parse setting ${row.key}:`, error);
          settings[row.key] = row.value; // Fallback to raw string
        }
      }
      
      console.log('Settings loaded:', settings);
      return settings;
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      return {};
    }
  });
  
  // Get a specific setting
  ipcMain.handle('settings:get', async (_event, key: string) => {
    try {
      const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as {
        value: string;
      } | undefined;
      
      if (row) {
        try {
          return JSON.parse(row.value);
        } catch (error) {
          return row.value;
        }
      }
      
      return null;
    } catch (error: any) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  });
}
