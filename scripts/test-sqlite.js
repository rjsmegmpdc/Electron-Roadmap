const path = require('path');
const fs = require('fs');

console.log('=== SQLite Module Diagnostic Test ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Test 1: Check if better-sqlite3 module exists
const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
console.log('Module path:', modulePath);
console.log('Module exists:', fs.existsSync(modulePath));

// Test 2: Check native binding
const bindingPath = path.join(modulePath, 'build', 'Release', 'better_sqlite3.node');
console.log('Native binding path:', bindingPath);
console.log('Native binding exists:', fs.existsSync(bindingPath));

if (fs.existsSync(bindingPath)) {
  const stats = fs.statSync(bindingPath);
  console.log('Native binding size:', stats.size, 'bytes');
  console.log('Native binding modified:', stats.mtime);
}

// Test 3: Try to require the module
console.log('\n=== Attempting to require better-sqlite3 ===');
try {
  const Database = require('better-sqlite3');
  console.log('✅ Successfully required better-sqlite3');
  console.log('Database constructor type:', typeof Database);
  
  // Test 4: Try to create a database
  console.log('\n=== Attempting to create test database ===');
  try {
    const testDbPath = path.join(__dirname, '..', 'test-db.sqlite');
    const db = new Database(testDbPath);
    console.log('✅ Successfully created database');
    
    // Test basic operations
    try {
      db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
      const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
      const result = insert.run('test-entry');
      console.log('✅ Successfully created table and inserted data');
      console.log('Insert result:', result);
      
      const select = db.prepare('SELECT * FROM test WHERE id = ?');
      const row = select.get(result.lastInsertRowid);
      console.log('✅ Successfully retrieved data:', row);
      
      db.close();
      console.log('✅ Successfully closed database');
      
      // Cleanup
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
        console.log('✅ Cleaned up test database');
      }
      
    } catch (opError) {
      console.log('❌ Database operation failed:', opError.message);
      console.log('Stack:', opError.stack);
    }
    
  } catch (dbError) {
    console.log('❌ Database creation failed:', dbError.message);
    console.log('Error code:', dbError.code);
    console.log('Stack:', dbError.stack);
  }
  
} catch (requireError) {
  console.log('❌ Failed to require better-sqlite3:', requireError.message);
  console.log('Error code:', requireError.code);
  console.log('Stack:', requireError.stack);
  
  // Additional diagnostics for require errors
  if (requireError.code === 'ERR_DLOPEN_FAILED') {
    console.log('\n=== MODULE VERSION MISMATCH DETECTED ===');
    console.log('This indicates the native module was compiled for a different Node.js version');
    console.log('Current Node.js version:', process.version);
    console.log('Current NODE_MODULE_VERSION:', process.versions.modules);
    
    // Check if we're running under Electron
    if (process.versions.electron) {
      console.log('Running under Electron:', process.versions.electron);
      console.log('Electron uses different ABI than Node.js');
      console.log('Solution: Rebuild module for Electron ABI');
    }
  }
}

console.log('\n=== Environment Information ===');
console.log('NODE_MODULE_VERSION:', process.versions.modules);
console.log('V8 version:', process.versions.v8);
console.log('UV version:', process.versions.uv);
console.log('OpenSSL version:', process.versions.openssl);

if (process.versions.electron) {
  console.log('Electron version:', process.versions.electron);
  console.log('Chrome version:', process.versions.chrome);
}