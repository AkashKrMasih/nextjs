import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const port = process.env.PORT ?? '3000';
const url = `http://localhost:${port}`;

function openInBrowser(target: string) {
  const plat = platform();
  const child =
    plat === 'win32'
      ? spawn('cmd', ['/c', 'start', '', target], { detached: true, stdio: 'ignore' })
      : plat === 'darwin'
        ? spawn('open', [target], { detached: true, stdio: 'ignore' })
        : spawn('xdg-open', [target], { detached: true, stdio: 'ignore' });
  child.unref();
}

const nextArgs = ['dev', ...process.argv.slice(2)];
const next = spawn('next', nextArgs, {
  stdio: ['inherit', 'pipe', 'inherit'],
  env: process.env,
  shell: true,
});

let opened = false;

function tryOpen() {
  if (opened) return;
  opened = true;
  openInBrowser(url);
}

// Next prints a local URL or "Ready" when the dev server is up.
const readyPattern = /\bReady\b|Local:\s+https?:\/\//i;

next.stdout?.on('data', (chunk: Buffer) => {
  process.stdout.write(chunk);
  if (!opened && readyPattern.test(chunk.toString())) {
    tryOpen();
  }
});

// Fallback if log format changes.
setTimeout(tryOpen, 3500);

next.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
