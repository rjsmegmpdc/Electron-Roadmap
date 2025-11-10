import { ipcMain, BrowserWindow } from 'electron';

export class LocalStorageIpcHandlers {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    // Get item from localStorage in renderer
    ipcMain.handle('localStorage:getItem', async (event, key: string): Promise<string | null> => {
      try {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (!senderWindow) {
          return null;
        }

        // Execute script in renderer to get localStorage item
        const result = await senderWindow.webContents.executeJavaScript(
          `localStorage.getItem('${key.replace(/'/g, "\\'")}')`,
          true
        );

        return result;
      } catch (error: any) {
        console.error('Failed to get localStorage item:', error);
        return null;
      }
    });

    // Set item in localStorage in renderer
    ipcMain.handle('localStorage:setItem', async (event, key: string, value: string): Promise<void> => {
      try {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (!senderWindow) {
          throw new Error('No browser window found');
        }

        // Escape the value for safe injection
        const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        
        // Execute script in renderer to set localStorage item
        await senderWindow.webContents.executeJavaScript(
          `localStorage.setItem('${key.replace(/'/g, "\\'")}', '${escapedValue}')`,
          true
        );
      } catch (error: any) {
        console.error('Failed to set localStorage item:', error);
        throw error;
      }
    });

    console.log('LocalStorage IPC handlers registered successfully');
  }

  /**
   * Cleanup handlers when shutting down
   */
  cleanup() {
    const handlers = [
      'localStorage:getItem',
      'localStorage:setItem'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });

    console.log('LocalStorage IPC handlers cleaned up');
  }
}
