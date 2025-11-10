import { encryptionService } from './EncryptionService';

/**
 * Simple test to validate EncryptionService functionality
 * Run this with: node -r ts-node/register EncryptionService.test.ts
 */

async function testEncryptionService() {
  try {
    console.log('🔧 Initializing encryption service...');
    await encryptionService.initialize();
    console.log('✅ Encryption service initialized successfully');

    // Test basic encryption/decryption
    console.log('\n📝 Testing basic encryption/decryption...');
    const testData = 'test-pat-token-abcdef1234567890';
    console.log('Original data:', testData);

    const encrypted = encryptionService.encrypt(testData);
    console.log('Encrypted data:', {
      data: encrypted.data.substring(0, 20) + '...',
      iv: encrypted.iv.substring(0, 10) + '...',
      tag: encrypted.tag.substring(0, 10) + '...'
    });

    const decrypted = encryptionService.decrypt(encrypted);
    console.log('Decrypted data:', decrypted);

    if (testData === decrypted) {
      console.log('✅ Encryption/Decryption test PASSED');
    } else {
      console.log('❌ Encryption/Decryption test FAILED');
    }

    // Test token validation
    console.log('\n🔍 Testing token validation...');
    const validPAT = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
    const invalidPAT = 'invalid-token';

    console.log('Valid PAT test:', encryptionService.validateTokenFormat(validPAT, 'PAT'));
    console.log('Invalid PAT test:', encryptionService.validateTokenFormat(invalidPAT, 'PAT'));

    // Test hashing
    console.log('\n🔐 Testing hash functionality...');
    const passwordToHash = 'mySecretPassword123';
    const hashedPassword = encryptionService.hash(passwordToHash);
    console.log('Hashed password:', hashedPassword.substring(0, 30) + '...');

    const isValidHash = encryptionService.verifyHash(passwordToHash, hashedPassword);
    const isInvalidHash = encryptionService.verifyHash('wrongPassword', hashedPassword);

    console.log('Valid hash verification:', isValidHash);
    console.log('Invalid hash verification:', isInvalidHash);

    if (isValidHash && !isInvalidHash) {
      console.log('✅ Hash verification test PASSED');
    } else {
      console.log('❌ Hash verification test FAILED');
    }

    // Test secure key generation
    console.log('\n🔑 Testing secure key generation...');
    const webhookSecret = encryptionService.generateSecureKey(32);
    console.log('Generated webhook secret:', webhookSecret.substring(0, 20) + '...');

    if (webhookSecret.length > 30) {
      console.log('✅ Secure key generation test PASSED');
    } else {
      console.log('❌ Secure key generation test FAILED');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Clean up
    encryptionService.clearMasterKey();
    console.log('🧹 Cleaned up master key from memory');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEncryptionService();
}

export { testEncryptionService };