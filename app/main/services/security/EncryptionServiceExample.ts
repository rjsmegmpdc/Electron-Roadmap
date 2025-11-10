import { encryptionService, EncryptedData } from './EncryptionService';

/**
 * Example usage patterns for the EncryptionService
 * This file demonstrates how to securely handle PAT tokens and other sensitive data
 */

export class TokenManager {
  /**
   * Initialize the encryption service (should be called on app startup)
   */
  static async initialize(): Promise<void> {
    await encryptionService.initialize();
  }

  /**
   * Store a PAT token securely in the database
   */
  static async storePATToken(userId: string, organizationUrl: string, patToken: string): Promise<void> {
    try {
      // Validate token format first
      if (!encryptionService.validateTokenFormat(patToken, 'PAT')) {
        throw new Error('Invalid PAT token format');
      }

      // Encrypt the token
      const encryptedToken = encryptionService.encrypt(patToken);

      // Store in database (pseudo-code - replace with actual database calls)
      await saveToDatabase({
        userId,
        organizationUrl,
        encryptedToken: JSON.stringify(encryptedToken),
        tokenType: 'PAT',
        createdAt: new Date().toISOString()
      });

      console.log('PAT token stored securely');
    } catch (error) {
      console.error('Failed to store PAT token:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt a PAT token
   */
  static async retrievePATToken(userId: string, organizationUrl: string): Promise<string | null> {
    try {
      // Retrieve from database (pseudo-code)
      const tokenRecord = await getFromDatabase({ userId, organizationUrl });
      
      if (!tokenRecord || !tokenRecord.encryptedToken) {
        return null;
      }

      // Parse encrypted data
      const encryptedData: EncryptedData = JSON.parse(tokenRecord.encryptedToken);

      // Decrypt token
      const decryptedToken = encryptionService.decrypt(encryptedData);

      return decryptedToken;
    } catch (error) {
      console.error('Failed to retrieve PAT token:', error);
      return null;
    }
  }

  /**
   * Update an existing PAT token
   */
  static async updatePATToken(userId: string, organizationUrl: string, newPatToken: string): Promise<void> {
    try {
      // First, remove the old token
      await this.removePATToken(userId, organizationUrl);
      
      // Store the new token
      await this.storePATToken(userId, organizationUrl, newPatToken);
    } catch (error) {
      console.error('Failed to update PAT token:', error);
      throw error;
    }
  }

  /**
   * Remove a PAT token from storage
   */
  static async removePATToken(userId: string, organizationUrl: string): Promise<void> {
    try {
      // Remove from database (pseudo-code)
      await deleteFromDatabase({ userId, organizationUrl });
      console.log('PAT token removed');
    } catch (error) {
      console.error('Failed to remove PAT token:', error);
      throw error;
    }
  }

  /**
   * Generate a secure webhook secret
   */
  static generateWebhookSecret(): string {
    return encryptionService.generateSecureKey(32);
  }

  /**
   * Verify webhook signature (example for Azure DevOps webhooks)
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      // Create expected signature
      const expectedSignature = encryptionService.hash(payload, secret);
      return encryptionService.verifyHash(payload + secret, expectedSignature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Clean up sensitive data from memory on app shutdown
   */
  static cleanup(): void {
    encryptionService.clearMasterKey();
  }
}

/**
 * Example database interface (replace with your actual database implementation)
 */
interface TokenRecord {
  userId: string;
  organizationUrl: string;
  encryptedToken: string;
  tokenType: string;
  createdAt: string;
}

// Placeholder database functions - replace with actual implementation
async function saveToDatabase(record: TokenRecord): Promise<void> {
  // Implementation depends on your database choice (SQLite, etc.)
  console.log('Saving to database:', { ...record, encryptedToken: '[ENCRYPTED]' });
}

async function getFromDatabase(query: { userId: string; organizationUrl: string }): Promise<TokenRecord | null> {
  // Implementation depends on your database choice
  console.log('Retrieving from database:', query);
  return null; // Placeholder
}

async function deleteFromDatabase(query: { userId: string; organizationUrl: string }): Promise<void> {
  // Implementation depends on your database choice
  console.log('Deleting from database:', query);
}

/**
 * Usage in your main application:
 * 
 * // On app startup
 * await TokenManager.initialize();
 * 
 * // Store a token
 * await TokenManager.storePATToken('user123', 'https://dev.azure.com/myorg', 'pat_token_here');
 * 
 * // Retrieve a token for API calls
 * const token = await TokenManager.retrievePATToken('user123', 'https://dev.azure.com/myorg');
 * if (token) {
 *   // Use token for Azure DevOps API calls
 * }
 * 
 * // On app shutdown
 * TokenManager.cleanup();
 */