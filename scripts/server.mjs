import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, openSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const state = path.join(root, '.local');
const pidFile = path.join(state, 'server.json');
const port = 8036;
function listeners() {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}
function owned(pid) {
  try {
    const cwd = execFileSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
    })
      .split('\n')
      .find((x) => x.startsWith('n'))
      ?.slice(1);
    const args = execFileSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
    return cwd === root && args.includes('vite');
  } catch {
    return false;
  }
}
if (process.argv[2] === 'stop') {
  if (!existsSync(pidFile)) {
    console.log('No managed CUL server to stop.');
    process.exit(0);
  }
  const { pid } = JSON.parse(readFileSync(pidFile, 'utf8'));
  if (!owned(pid)) {
    console.error('Refusing to stop: PID/cwd do not identify this CUL checkout.');
    process.exit(1);
  }
  process.kill(pid, 'SIGTERM');
  unlinkSync(pidFile);
  console.log(`Stopped CUL PID ${pid}.`);
} else {
  const pids = listeners();
  if (pids.length) {
    if (pids.every(owned)) {
      console.log(`CUL already running: http://127.0.0.1:${port}`);
      process.exit(0);
    }
    console.error(`Port ${port} is occupied by another process. Nothing was stopped.`);
    process.exit(1);
  }
  mkdirSync(state, { recursive: true });
  const log = openSync(path.join(state, 'server.log'), 'a');
  const child = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd: root, detached: true, stdio: ['ignore', log, log] },
  );
  child.unref();
  writeFileSync(pidFile, JSON.stringify({ pid: child.pid, root, port }));
  console.log(`CUL started: http://127.0.0.1:${port} (PID ${child.pid})`);
}
