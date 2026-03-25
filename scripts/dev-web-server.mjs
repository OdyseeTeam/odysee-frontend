import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const projectRoot = process.cwd();
const vitePlusEntry = path.resolve(projectRoot, 'node_modules/vite-plus/bin/vp');
const webServerEntry = path.resolve(projectRoot, 'web/index.js');
const liveChildren = new Set();
let shuttingDown = false;
let exitCode = 0;
let forceExitTimer;

const PID_FILE = path.resolve(projectRoot, 'web/dist/.dev-server.pid');

function killPreviousInstance() {
  try {
    if (!fs.existsSync(PID_FILE)) return;
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
    if (!oldPid || oldPid === process.pid) return;
    try {
      process.kill(-oldPid, 'SIGTERM');
    } catch {
      try { process.kill(oldPid, 'SIGTERM'); } catch {}
    }
    fs.unlinkSync(PID_FILE);
  } catch {}
}

function writePidFile() {
  try {
    fs.mkdirSync(path.dirname(PID_FILE), { recursive: true });
    fs.writeFileSync(PID_FILE, String(process.pid));
  } catch {}
}

function removePidFile() {
  try { fs.unlinkSync(PID_FILE); } catch {}
}

killPreviousInstance();
writePidFile();

function describeExit(name, code, signal) {
  if (signal) return `${name} exited from signal ${signal}`;
  return `${name} exited with code ${code ?? 0}`;
}

function spawnNodeProcess(name, entryFile, args, cwd, nodeArgs = []) {
  const child = spawn(process.execPath, [...nodeArgs, entryFile, ...args], {
    cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
    detached: !isWindows,
    windowsHide: isWindows,
  });

  liveChildren.add(child);

  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    exitCode = 1;
    void shutdown('startup failure', 'SIGTERM');
  });

  child.on('exit', (code, signal) => {
    liveChildren.delete(child);

    if (!shuttingDown) {
      exitCode = code ?? 1;
      console.log(describeExit(name, code, signal));
      void shutdown('child exit', signal || 'SIGTERM');
      return;
    }

    if (liveChildren.size === 0) {
      if (forceExitTimer) clearTimeout(forceExitTimer);
      process.exit(exitCode);
    }
  });

  return child;
}

function killProcessTree(child, signal) {
  return new Promise((resolve) => {
    if (!child.pid) {
      resolve();
      return;
    }

    if (isWindows) {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
      });

      killer.on('exit', () => resolve());
      killer.on('error', () => {
        try {
          child.kill(signal);
        } catch {}
        resolve();
      });
      return;
    }

    try {
      process.kill(-child.pid, signal);
    } catch {
      try {
        child.kill(signal);
      } catch {}
    }

    resolve();
  });
}

async function shutdown(reason, signal = 'SIGTERM') {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`\n${reason}: stopping dev:web-server...`);

  forceExitTimer = setTimeout(() => {
    process.exit(exitCode || 1);
  }, 5000);

  await Promise.all(Array.from(liveChildren).map((child) => killProcessTree(child, signal)));

  removePidFile();
  clearTimeout(forceExitTimer);
  process.exit(exitCode);
}

spawnNodeProcess('vite-watch', vitePlusEntry, ['build', '--watch'], projectRoot);
spawnNodeProcess('web-server', webServerEntry, [], path.resolve(projectRoot, 'web'), ['--watch', '--inspect']);

process.on('SIGINT', () => {
  exitCode = 0;
  void shutdown('SIGINT received', 'SIGINT');
});

process.on('SIGTERM', () => {
  exitCode = 0;
  void shutdown('SIGTERM received', 'SIGTERM');
});

if (isWindows) {
  process.on('SIGBREAK', () => {
    exitCode = 0;
    void shutdown('SIGBREAK received', 'SIGTERM');
  });
}
