#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const demoFile = path.join(__dirname, 'app', 'renderer', 'css-demo.html');

// Check if demo file exists
if (!fs.existsSync(demoFile)) {
    console.error('Demo file not found at:', demoFile);
    process.exit(1);
}

console.log('Opening CSS Styles Comparison Demo...');
console.log('Demo file:', demoFile);
console.log('\nThis demo shows three different CSS styling approaches:');
console.log('1. Unified Styles - Modern OneNZ branded system with CSS variables');
console.log('2. Legacy Variables - Dark theme CSS variables system');
console.log('3. Legacy Globals - Traditional hardcoded CSS approach');
console.log('\nThe demo will open in your default browser.');

// Try different browser commands based on platform
let browserCommand;
const platform = process.platform;

if (platform === 'win32') {
    browserCommand = 'start';
} else if (platform === 'darwin') {
    browserCommand = 'open';
} else {
    browserCommand = 'xdg-open';
}

// Open the HTML file in the default browser
const child = spawn(browserCommand, [demoFile], {
    shell: true,
    stdio: 'ignore',
    detached: true
});

child.unref();

console.log('\n✅ Demo launched successfully!');
console.log('📋 Use this demo to compare the three CSS approaches and make your decision.');