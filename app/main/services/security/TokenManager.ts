import { encryptionService, EncryptedData } from './EncryptionService';
import type { DB } from '../../db';

/**
 * TokenManager - Securely manages PAT tokens using the existing database
 * Integrates with the ado_config table to store encrypted tokens
 */

export interface ADOTokenRecord {
  id: number;
  org_url: string;
  project_name: string;
  auth_mode: string;
  encrypted_pat_token?: string;
  pat_token_expiry_date?: string;
  client_id?: string;
  tenant_id?: string;
  webhook_url?: string;
  webhook_secret?: string;
  max_retry_attempts: number;
  base_delay_ms: number;
  is_enabled: boolean;
  connection_status: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private db: DB | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Initialize the TokenManager with database connection
   */
  public initialize(database: DB): void {
    this.db = database;
  }

  /**
   * Store a PAT token securely in the database
   */
  public async storePATToken(
    orgUrl: string, 
    projectName: string, 
    patToken: string,
    options: {
      webhookUrl?: string;
      webhookSecret?: string;
      isEnabled?: boolean;
      expiryDate?: string; // ISO date string
    } = {}
  ): Promise<void> {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      // Validate token format first with detailed error messaging
      const validationError = encryptionService.getPATValidationError(patToken);
      if (validationError) {
        throw new Error(validationError);
      }

      // Encrypt the token
      const encryptedToken = encryptionService.encrypt(patToken);
      const encryptedTokenJson = JSON.stringify(encryptedToken);

      // Generate webhook secret if not provided
      const webhookSecret = options.webhookSecret || encryptionService.generateSecureKey(32);

      // Set expiry date - default to 90 days from now if not provided
      const expiryDate = options.expiryDate || this.getDefaultExpiryDate();

      const now = new Date().toISOString();

      // Check if a configuration already exists for this org/project
      const existingConfig = this.db.prepare(`
        SELECT id FROM ado_config 
        WHERE org_url = ? AND project_name = ?
      `).get(orgUrl, projectName) as { id: number } | undefined;

      if (existingConfig) {
        // Update existing configuration
        this.db.prepare(`
          UPDATE ado_config SET
            pat_token = ?,
            pat_token_expiry_date = ?,
            webhook_url = ?,
            webhook_secret = ?,
            is_enabled = ?,
            connection_status = 'connected',
            updated_at = ?
          WHERE id = ?
        `).run(
          encryptedTokenJson,
          expiryDate,
          options.webhookUrl || '',
          webhookSecret,
          (options.isEnabled ?? true) ? 1 : 0,
          now,
          existingConfig.id
        );

        console.log('PAT token updated for:', orgUrl, projectName);
      } else {
        // Create new configuration
        this.db.prepare(`
          INSERT INTO ado_config (
            org_url, project_name, auth_mode, pat_token,
            pat_token_expiry_date, webhook_url, webhook_secret, 
            max_retry_attempts, base_delay_ms, is_enabled, 
            connection_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orgUrl,
          projectName,
          'PAT',
          encryptedTokenJson,
          expiryDate,
          options.webhookUrl || '',
          webhookSecret,
          3, // max_retry_attempts
          500, // base_delay_ms
          (options.isEnabled ?? true) ? 1 : 0,
          'connected',
          now,
          now
        );

        console.log('PAT token stored for:', orgUrl, projectName);
      }
    } catch (error) {
      console.error('Failed to store PAT token:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt a PAT token
   */
  public async retrievePATToken(orgUrl: string, projectName: string): Promise<string | null> {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const tokenRecord = this.db.prepare(`
        SELECT pat_token FROM ado_config 
        WHERE org_url = ? AND project_name = ? AND pat_token IS NOT NULL
      `).get(orgUrl, projectName) as { pat_token: string } | undefined;

      if (!tokenRecord || !tokenRecord.pat_token) {
        return null;
      }

      // Parse encrypted data
      const encryptedData: EncryptedData = JSON.parse(tokenRecord.pat_token);

      // Decrypt token
      const decryptedToken = encryptionService.decrypt(encryptedData);

      return decryptedToken;
    } catch (error) {
      console.error('Failed to retrieve PAT token:', error);
      return null;
    }
  }

  /**
   * Get all ADO configurations
   */
  public getADOConfigurations(): ADOTokenRecord[] {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const configs = this.db.prepare(`
        SELECT id, org_url, project_name, auth_mode, client_id, tenant_id,
               webhook_url, webhook_secret, pat_token_expiry_date, 
               max_retry_attempts, base_delay_ms, is_enabled, connection_status, 
               last_sync_at, created_at, updated_at
        FROM ado_config
        ORDER BY created_at DESC
      `).all() as ADOTokenRecord[];

      // Convert SQLite integer booleans back to JavaScript booleans
      return configs.map(config => ({
        ...config,
        is_enabled: Boolean(config.is_enabled)
      }));
    } catch (error) {
      console.error('Failed to get ADO configurations:', error);
      throw error;
    }
  }

  /**
   * Get a specific ADO configuration with decrypted token
   */
  public async getADOConfiguration(orgUrl: string, projectName: string): Promise<ADOTokenRecord | null> {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const config = this.db.prepare(`
        SELECT * FROM ado_config 
        WHERE org_url = ? AND project_name = ?
      `).get(orgUrl, projectName) as ADOTokenRecord | undefined;

      if (!config) {
        return null;
      }

      // Return config without decrypted token for security
      // Use retrievePATToken() separately if the token is needed
      return {
        ...config,
        is_enabled: Boolean(config.is_enabled),
        encrypted_pat_token: config.encrypted_pat_token ? '[ENCRYPTED]' : undefined
      } as ADOTokenRecord;
    } catch (error) {
      console.error('Failed to get ADO configuration:', error);
      return null;
    }
  }

  /**
   * Update ADO configuration settings
   */
  public updateADOConfiguration(
    orgUrl: string, 
    projectName: string, 
    updates: Partial<Omit<ADOTokenRecord, 'id' | 'created_at' | 'encrypted_pat_token'>>
  ): void {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      // Build dynamic update query
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && key !== 'encrypted_pat_token') {
          updateFields.push(`${key} = ?`);
          // Convert boolean to integer for SQLite compatibility
          if (typeof value === 'boolean') {
            values.push(value ? 1 : 0);
          } else {
            values.push(value);
          }
        }
      });

      if (updateFields.length === 0) {
        return; // Nothing to update
      }

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(orgUrl, projectName);

      const query = `
        UPDATE ado_config 
        SET ${updateFields.join(', ')}
        WHERE org_url = ? AND project_name = ?
      `;

      const result = this.db.prepare(query).run(...values);

      if (result.changes === 0) {
        throw new Error('No configuration found to update');
      }

      console.log('ADO configuration updated:', orgUrl, projectName);
    } catch (error) {
      console.error('Failed to update ADO configuration:', error);
      throw error;
    }
  }

  /**
   * Update PAT token for existing configuration
   */
  public async updatePATToken(
    orgUrl: string, 
    projectName: string, 
    newPatToken: string, 
    expiryDate?: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      // Validate token format with detailed error messaging
      const validationError = encryptionService.getPATValidationError(newPatToken);
      if (validationError) {
        throw new Error(validationError);
      }

      // Encrypt the new token
      const encryptedToken = encryptionService.encrypt(newPatToken);
      const encryptedTokenJson = JSON.stringify(encryptedToken);

      // Use provided expiry date or default to 90 days from now
      const tokenExpiryDate = expiryDate || this.getDefaultExpiryDate();

      const result = this.db.prepare(`
        UPDATE ado_config 
        SET pat_token = ?, pat_token_expiry_date = ?, updated_at = ?, connection_status = 'connected'
        WHERE org_url = ? AND project_name = ?
      `).run(
        encryptedTokenJson,
        tokenExpiryDate,
        new Date().toISOString(),
        orgUrl,
        projectName
      );

      if (result.changes === 0) {
        throw new Error('No configuration found to update');
      }

      console.log('PAT token updated for:', orgUrl, projectName);
    } catch (error) {
      console.error('Failed to update PAT token:', error);
      throw error;
    }
  }

  /**
   * Remove PAT token and configuration
   */
  public removePATToken(orgUrl: string, projectName: string): void {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const result = this.db.prepare(`
        DELETE FROM ado_config 
        WHERE org_url = ? AND project_name = ?
      `).run(orgUrl, projectName);

      if (result.changes === 0) {
        throw new Error('No configuration found to remove');
      }

      console.log('PAT token and configuration removed for:', orgUrl, projectName);
    } catch (error) {
      console.error('Failed to remove PAT token:', error);
      throw error;
    }
  }

  /**
   * Test connection with stored PAT token
   */
  public async testConnection(orgUrl: string, projectName: string): Promise<boolean> {
    try {
      const token = await this.retrievePATToken(orgUrl, projectName);
      if (!token) {
        return false;
      }

      // Here you would implement actual Azure DevOps API test
      // For now, just validate the token format
      return encryptionService.validateTokenFormat(token, 'PAT');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Update connection status
   */
  public updateConnectionStatus(
    orgUrl: string, 
    projectName: string, 
    status: 'connected' | 'disconnected' | 'error',
    lastSyncAt?: string
  ): void {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const updates: any = {
        connection_status: status,
        updated_at: new Date().toISOString()
      };

      if (lastSyncAt) {
        updates.last_sync_at = lastSyncAt;
      }

      this.updateADOConfiguration(orgUrl, projectName, updates);
    } catch (error) {
      console.error('Failed to update connection status:', error);
      throw error;
    }
  }

  /**
   * Generate a new webhook secret
   */
  public generateWebhookSecret(): string {
    return encryptionService.generateSecureKey(32);
  }

  /**
   * Get default expiry date (90 days from now)
   */
  private getDefaultExpiryDate(): string {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);
    return expiryDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  /**
   * Check if PAT token is expired or will expire soon
   */
  public checkTokenExpiry(orgUrl: string, projectName: string): {
    isExpired: boolean;
    willExpireSoon: boolean; // within 7 days
    expiryDate: string | null;
    daysUntilExpiry: number | null;
  } {
    if (!this.db) {
      throw new Error('TokenManager not initialized with database');
    }

    try {
      const result = this.db.prepare(`
        SELECT pat_token_expiry_date
        FROM ado_config
        WHERE org_url = ? AND project_name = ?
      `).get(orgUrl, projectName) as { pat_token_expiry_date: string } | undefined;

      if (!result || !result.pat_token_expiry_date) {
        return {
          isExpired: false,
          willExpireSoon: false,
          expiryDate: null,
          daysUntilExpiry: null
        };
      }

      const expiryDate = new Date(result.pat_token_expiry_date);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        isExpired: diffDays < 0,
        willExpireSoon: diffDays >= 0 && diffDays <= 7,
        expiryDate: result.pat_token_expiry_date,
        daysUntilExpiry: diffDays
      };
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return {
        isExpired: false,
        willExpireSoon: false,
        expiryDate: null,
        daysUntilExpiry: null
      };
    }
  }

  /**
   * Get all configurations with expiry status
   */
  public getADOConfigurationsWithExpiry(): (ADOTokenRecord & {
    tokenExpiry: {
      isExpired: boolean;
      willExpireSoon: boolean;
      expiryDate: string | null;
      daysUntilExpiry: number | null;
    }
  })[] {
    const configs = this.getADOConfigurations();
    return configs.map(config => ({
      ...config,
      tokenExpiry: this.checkTokenExpiry(config.org_url, config.project_name)
    }));
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();