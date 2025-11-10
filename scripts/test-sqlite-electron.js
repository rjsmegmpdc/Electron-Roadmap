// This script will be run by Electron to test SQLite compatibility
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('=== SQLite Electron Diagnostic Test ===');
console.log('Node.js version:', process.version);
console.log('Electron version:', process.versions.electron);
console.log('Chrome version:', process.versions.chrome);
console.log('NODE_MODULE_VERSION:', process.versions.modules);

// Test SQLite in Electron context
function testSQLite() {
  console.log('\n=== Testing SQLite in Electron Context ===');
  
  try {
    const Database = require('better-sqlite3');
    console.log('✅ Successfully required better-sqlite3 in Electron');
    
    const testDbPath = path.join(__dirname, '..', 'electron-test-db.sqlite');
    const db = new Database(testDbPath);
    console.log('✅ Successfully created database in Electron');
    
    db.exec('CREATE TABLE IF NOT EXISTS electron_test (id INTEGER PRIMARY KEY, name TEXT)');
    const insert = db.prepare('INSERT INTO electron_test (name) VALUES (?)');
    const result = insert.run('electron-test-entry');
    console.log('✅ Successfully inserted data in Electron:', result);
    
    const select = db.prepare('SELECT * FROM electron_test WHERE id = ?');
    const row = select.get(result.lastInsertRowid);
    console.log('✅ Successfully retrieved data in Electron:', row);
    
    db.close();
    console.log('✅ Successfully closed database in Electron');
    
    // Cleanup
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log('✅ Cleaned up test database');
    }
    
    console.log('\n🎉 SQLite is working correctly in Electron!');
    
  } catch (error) {
    console.log('❌ SQLite failed in Electron:', error.message);
    console.log('Error code:', error.code);
    console.log('Stack:', error.stack);
    
    if (error.code === 'ERR_DLOPEN_FAILED') {
      console.log('\n=== SOLUTION REQUIRED ===');
      console.log('The native module needs to be rebuilt for Electron ABI');
      console.log('Run: npm install --save-dev electron-rebuild');
      console.log('Then: npx electron-rebuild');
    }
  }
  
  // Quit the app after testing
  app.quit();
}

app.whenReady().then(() => {
  // Create a hidden window to initialize Electron properly
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Run test after a short delay
  setTimeout(testSQLite, 100);
});

app.on('window-all-closed', () => {
  app.quit();
});