import https from 'https';
import { URL } from 'url';

export interface AdoConfig {
  orgUrl: string;
  projectName: string;
  authMode: 'PAT' | 'OAuth2';
  patToken?: string;
  clientId?: string;
  tenantId?: string;
  maxRetryAttempts: number;
  baseDelayMs: number;
}

export interface AdoApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface WorkItem {
  id: number;
  fields: Record<string, any>;
  relations?: WorkItemRelation[];
  _links?: Record<string, any>;
}

export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: Record<string, any>;
}

export class AdoApiService {
  private config: AdoConfig;

  constructor(config: AdoConfig) {
    this.config = config;
  }

  /**
   * Test connection to Azure DevOps API
   */
  async testConnection(): Promise<AdoApiResponse<boolean>> {
    try {
      const response = await this.makeRequest('GET', '/_apis/projects');
      
      if (response.success && response.data?.count >= 0) {
        return {
          success: true,
          data: true,
          statusCode: 200
        };
      }
      
      return {
        success: false,
        error: 'Failed to connect to Azure DevOps API',
        statusCode: response.statusCode
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Connection test failed: ${error.message}`,
        statusCode: 0
      };
    }
  }

  /**
   * Get work item by ID
   */
  async getWorkItem(id: number, expand?: string[]): Promise<AdoApiResponse<WorkItem>> {
    try {
      const expandParam = expand?.length ? `$expand=${expand.join(',')}` : '';
      const url = `/${this.config.projectName}/_apis/wit/workItems/${id}?api-version=7.0&${expandParam}`;
      
      return await this.makeRequest('GET', url);
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get work item ${id}: ${error.message}`
      };
    }
  }

  /**
   * Update work item using PATCH operation
   */
  async updateWorkItem(id: number, operations: any[]): Promise<AdoApiResponse<WorkItem>> {
    try {
      const url = `/${this.config.projectName}/_apis/wit/workItems/${id}?api-version=7.0`;
      
      return await this.makeRequest('PATCH', url, operations, {
        'Content-Type': 'application/json-patch+json'
      });
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update work item ${id}: ${error.message}`
      };
    }
  }

  /**
   * Execute WIQL query
   */
  async queryWorkItems(wiql: string): Promise<AdoApiResponse<any>> {
    try {
      const url = `/${this.config.projectName}/_apis/wit/wiql?api-version=7.0`;
      const body = { query: wiql };
      
      return await this.makeRequest('POST', url, body);
    } catch (error: any) {
      return {
        success: false,
        error: `WIQL query failed: ${error.message}`
      };
    }
  }

  /**
   * Get project information
   */
  async getProject(): Promise<AdoApiResponse<any>> {
    try {
      const url = `/_apis/projects/${this.config.projectName}?api-version=7.0`;
      return await this.makeRequest('GET', url);
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get project info: ${error.message}`
      };
    }
  }

  /**
   * Make HTTP request to Azure DevOps API with retry logic
   */
  private async makeRequest(
    method: string, 
    path: string, 
    body?: any, 
    additionalHeaders?: Record<string, string>
  ): Promise<AdoApiResponse> {
    const maxAttempts = this.config.maxRetryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeRequest(method, path, body, additionalHeaders);
        return result;
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const delay = this.config.baseDelayMs * attempt;
          await this.sleep(delay);
          console.warn(`ADO API request attempt ${attempt} failed, retrying in ${delay}ms...`);
        }
      }
    }

    return {
      success: false,
      error: `Request failed after ${maxAttempts} attempts: ${lastError?.message}`,
      statusCode: 0
    };
  }

  /**
   * Execute single HTTP request
   */
  private async executeRequest(
    method: string,
    path: string,
    body?: any,
    additionalHeaders?: Record<string, string>
  ): Promise<AdoApiResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.config.orgUrl);
      
      const headers: Record<string, string> = {
        'User-Agent': 'Roadmap-Tool/1.0.0',
        'Accept': 'application/json',
        ...additionalHeaders
      };

      // Add authentication header
      if (this.config.authMode === 'PAT' && this.config.patToken) {
        const auth = Buffer.from(`:${this.config.patToken}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const postData = body ? JSON.stringify(body) : undefined;
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData).toString();
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const req = https.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: headers,
        timeout: 30000 // 30 second timeout
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const statusCode = res.statusCode || 0;
            
            if (statusCode >= 200 && statusCode < 300) {
              const responseData = data ? JSON.parse(data) : {};
              resolve({
                success: true,
                data: responseData,
                statusCode: statusCode
              });
            } else {
              let errorMessage = `HTTP ${statusCode}`;
              try {
                const errorData = JSON.parse(data);
                errorMessage = errorData.message || errorData.error?.message || errorMessage;
              } catch {
                errorMessage = data || errorMessage;
              }
              
              resolve({
                success: false,
                error: errorMessage,
                statusCode: statusCode
              });
            }
          } catch (parseError: any) {
            reject(new Error(`Failed to parse response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AdoConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfigSafe(): Omit<AdoConfig, 'patToken'> {
    const { patToken, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Export singleton instance
export const adoApiService = new AdoApiService({
  orgUrl: '',
  projectName: '',
  authMode: 'PAT',
  maxRetryAttempts: 3,
  baseDelayMs: 500
});