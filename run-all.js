const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('======================================================================');
console.log(' Starting Hyperlocal Risk Mapping System (Backend + Frontend)...');
console.log('======================================================================');

// Start Backend on Port 5000
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  shell: true,
  env: process.env
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[36m[Backend]\x1b[0m ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[Backend ERR]\x1b[0m ${data}`);
});

// Start Frontend on Port 3000
const frontend = spawn(npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '3000'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  shell: true,
  env: process.env
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[Frontend]\x1b[0m ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[Frontend ERR]\x1b[0m ${data}`);
});

function cleanup() {
  console.log('\nShutting down backend and frontend services...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
