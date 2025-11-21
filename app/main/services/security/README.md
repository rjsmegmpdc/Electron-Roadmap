# Security Services

This directory contains security-related services for the Roadmap Electron application, focusing on secure handling of sensitive data like Personal Access Tokens (PATs) and other authentication credentials.

## Overview

The security services provide:
- **Encryption/Decryption**: AES-256-GCM encryption for sensitive data
- **Token Management**: Secure storage and retrieval of authentication tokens
- **Password Hashing**: PBKDF2 with salt for password/token validation
- **Secure Key Generation**: Cryptographically secure random key generation
- **Token Validation**: Format validation for different token types

## Components

### EncryptionService.ts

The main encryption service providing:

- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **Master Key Management**: Secure key generation and storage
- **Token Validation**: Format checking for PAT and Bearer tokens
- **Password Hashing**: PBKDF2 with 10,000 iterations
- **Secure Random Generation**: For webhook secrets and other tokens

#### Key Features:
- Singleton pattern for consistent state management
- Master key stored in user data directory with restricted permissions
- Authenticated encryption with Additional Associated Data (AAD)
- Memory cleanup functions for security

### EncryptionServiceExample.ts

Example usage patterns and TokenManager class demonstrating:

- **Secure Token Storage**: Encrypt and store PAT tokens in database
- **Token Retrieval**: Decrypt and return stored tokens
- **Token Management**: Update and remove operations
- **Webhook Security**: Secret generation and signature verification
- **Integration Patterns**: How to use with your database layer

### EncryptionService.test.ts

Test file to validate the encryption service functionality:

- Encryption/decryption round-trip tests
- Token format validation tests
- Hash generation and verification tests
- Secure key generation tests

## Usage

### Basic Setup

```typescript
import { encryptionService } from './services/security/EncryptionService';

// Initialize on app startup
await encryptionService.initialize();

// Use throughout your application
const encrypted = encryptionService.encrypt(sensitiveData);
const decrypted = encryptionService.decrypt(encrypted);

// Clean up on app shutdown
encryptionService.clearMasterKey();
```

### Token Management

```typescript
import { TokenManager } from './services/security/EncryptionServiceExample';

// Initialize
await TokenManager.initialize();

// Store a PAT token
await TokenManager.storePATToken(
  'user123', 
  'https://dev.azure.com/myorg', 
  'pat_token_here'
);

// Retrieve a token for API calls
const token = await TokenManager.retrievePATToken(
  'user123', 
  'https://dev.azure.com/myorg'
);
```

## Security Considerations

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes)
- **Authentication Tag**: 128 bits (16 bytes)
- **Additional Associated Data**: "ADO-Token-Encryption"

### Key Management

- Master key is generated using cryptographically secure random bytes
- Key is stored in the user's data directory (`~/.../userData/.keys/master.key`)
- File permissions are set to 0o600 (read/write for owner only)
- Key is cleared from memory on application shutdown
- If key file cannot be saved, falls back to in-memory key (less persistent but still secure)

### Token Validation

- **PAT Tokens**: Validates 52-character base64url format typical of Azure DevOps
- **Bearer Tokens**: Validates JWT-like format with minimum length and dot separators
- Additional validation can be added for other token types

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 10,000 (adjustable for security vs performance trade-off)
- **Salt**: 16 random bytes per password
- **Output**: Salt and hash are combined in format `salt:hash`

## Testing

Run the test suite to validate functionality:

```bash
# Using ts-node
npx ts-node app/main/services/security/EncryptionService.test.ts

# Or compile and run
tsc app/main/services/security/EncryptionService.test.ts
node app/main/services/security/EncryptionService.test.js
```

## Integration with Database

The `EncryptionServiceExample.ts` file shows placeholder database functions. You'll need to replace these with your actual database implementation:

```typescript
// Replace these functions with your database calls
async function saveToDatabase(record: TokenRecord): Promise<void>
async function getFromDatabase(query: {userId: string, organizationUrl: string}): Promise<TokenRecord | null>
async function deleteFromDatabase(query: {userId: string, organizationUrl: string}): Promise<void>
```

## Error Handling

The service includes comprehensive error handling:

- **Initialization Errors**: If master key cannot be created or loaded
- **Encryption Errors**: If plaintext is empty or encryption fails
- **Decryption Errors**: If encrypted data is malformed or key is wrong
- **Validation Errors**: If token format doesn't match expected patterns

## Performance Considerations

- Encryption/decryption operations are synchronous but fast
- PBKDF2 operations (hashing) are intentionally slower for security
- Master key is kept in memory to avoid file I/O on every operation
- Consider caching decrypted tokens temporarily if used frequently

## Security Best Practices

1. **Never log sensitive data**: Avoid logging actual tokens or decrypted values
2. **Use environment variables**: For any additional secrets not handled by this service
3. **Regular key rotation**: Consider implementing periodic master key rotation
4. **Audit access**: Log when tokens are accessed (but not the token values)
5. **Secure transport**: Always use HTTPS when transmitting encrypted data
6. **Backup considerations**: Encrypted tokens are useless without the master key

## Future Enhancements

Potential improvements to consider:

- **Key derivation from user password**: For additional security layer
- **Hardware security module (HSM) integration**: For enterprise deployments  
- **Key rotation mechanisms**: Automated periodic key updates
- **Multiple encryption contexts**: Different keys for different data types
- **Secure deletion**: Overwrite sensitive data in memory before garbage collection