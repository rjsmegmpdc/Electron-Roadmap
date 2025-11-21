// app/main/ipc/templateHandlers.ts
import { ipcMain, shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export function registerTemplateHandlers() {
  // Get list of available templates
  ipcMain.handle('template:list', async () => {
    try {
      // Use process.cwd() in development, which is the project root
      // In production, templates should be in the app's resource directory
      const isDev = process.env.NODE_ENV === 'development';
      const appRoot = isDev 
        ? process.cwd()  // Project root in development
        : app.getAppPath();  // App resources in production
      
      console.log('=== TEMPLATE SEARCH DEBUG ===');
      console.log('isDev:', isDev);
      console.log('process.cwd():', process.cwd());
      console.log('__dirname:', __dirname);
      console.log('app.getAppPath():', app.getAppPath());
      console.log('Template search path:', appRoot);
      
      if (!fs.existsSync(appRoot)) {
        console.error('Template directory does not exist:', appRoot);
        return {
          success: false,
          error: `Directory not found: ${appRoot}`,
          templates: []
        };
      }
      
      const allFiles = fs.readdirSync(appRoot);
      console.log('All files in directory:', allFiles.slice(0, 20)); // Show first 20
      
      const templateFiles = allFiles.filter(file => file.endsWith('-template.csv'));
      console.log('Template files found:', templateFiles);
      
      return {
        success: true,
        templates: templateFiles.map(file => ({
          filename: file,
          displayName: file.replace('-template.csv', '').split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          path: path.join(appRoot, file)
        }))
      };
    } catch (error: any) {
      console.error('Failed to list templates:', error);
      return {
        success: false,
        error: error.message,
        templates: []
      };
    }
  });

  // Open a specific template file
  ipcMain.handle('template:open', async (_, templateName: string) => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const appRoot = isDev 
        ? process.cwd()
        : app.getAppPath();
      
      const templatePath = path.join(appRoot, `${templateName}-template.csv`);
      
      console.log('=== OPENING TEMPLATE ===');
      console.log('Template path:', templatePath);
      console.log('File exists:', fs.existsSync(templatePath));
      
      // Check if file exists
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          error: `Template file not found: ${templateName}-template.csv`
        };
      }
      
      // Open the file with the default application
      await shell.openPath(templatePath);
      
      return {
        success: true,
        message: `Opened ${templateName}-template.csv`
      };
    } catch (error: any) {
      console.error('Failed to open template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  console.log('Template IPC handlers registered');
}
