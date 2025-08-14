#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Compile TypeScript
console.log('Compiling TypeScript...');
const tsc = spawn('npx', ['tsc'], {
  stdio: 'inherit',
  shell: true
});

tsc.on('close', (code) => {
  if (code !== 0) {
    console.error('TypeScript compilation failed');
    process.exit(1);
  }

  console.log('Starting server...');
  // Start the server
  const server = spawn('node', ['dist/app.js'], {
    stdio: 'inherit',
    shell: true
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error('Server crashed');
      process.exit(1);
    }
  });
});
