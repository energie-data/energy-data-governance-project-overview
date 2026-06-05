/**
 * Start lokaal de statische site (poort 8080) en de Vercel API (poort 3000).
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [];

function resolvePython() {
  if (process.platform === 'win32') return 'python';
  return 'python3';
}

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', code => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] gestopt met exitcode ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
  }
  process.exit(code);
}

if (!existsSync(resolve(root, '.env.local'))) {
  console.warn(
    'Geen .env.local gevonden. Kopieer .env.example naar .env.local en vul minimaal OPENAI_API_KEY en CORS_ORIGINS in.\n'
  );
}

console.log('Chat-config genereren…');
execSync('npm run build:chat-config', { cwd: root, stdio: 'inherit' });

start('api', 'npx', ['vercel', 'dev', '--listen', '3000']);
start('site', resolvePython(), ['-m', 'http.server', '8080']);

console.log('\nLokaal draaien:');
console.log('  Website: http://localhost:8080/index.html');
console.log('  Chat-API: http://localhost:3000/api/chat');
console.log('Stop met Ctrl+C\n');

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
