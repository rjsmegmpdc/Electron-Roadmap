export interface ElectronAPI {
  // Basic functionality
  ping: () => Promise<string>;
  getAppPath: (name: string) => Promise<string>;
  
  // Database operations
  dbQuery: (sql: string, params?: any) => Promise<any[]>;
  dbGet: (sql: string, params?: any) => Promise<any>;
  
  // Mutations
  applyMutation: (mutation: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  
  // Data fetching
  getProjects: () => Promise<any[]>;
  getDependencies: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};