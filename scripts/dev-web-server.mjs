import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const projectRoot = process.cwd();
const vitePlusEntry = path.resolve(projectRoot, 'node_modules/vite-plus/bin/vp');
const nodemonEntry = path.resolve(projectRoot, 'web/node_modules/nodemon/bin/nodemon.js');
const liveChildren = new Set();
let shuttingDown = false;
let exitCode = 0;
let forceExitTimer;

function describeExit(name, code, signal) {
  if (signal) return `${name} exited from signal ${signal}`;
  return `${name} exited with code ${code ?? 0}`;
}

function spawnNodeProcess(name, entryFile, args, cwd) {
  const child = spawn(process.execPath, [entryFile, ...args], {
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

  clearTimeout(forceExitTimer);
  process.exit(exitCode);
}

spawnNodeProcess('vite-watch', vitePlusEntry, ['build', '--watch'], projectRoot);
spawnNodeProcess('web-server', nodemonEntry, ['--inspect', 'index.js'], path.resolve(projectRoot, 'web'));

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
