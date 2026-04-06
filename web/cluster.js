const cluster = require('cluster');
const os = require('os');

const isPrimary = cluster.isPrimary || cluster.isMaster;

function getWorkerCount() {
  const requested = Number.parseInt(process.env.WEB_CONCURRENCY || '', 10);
  if (Number.isInteger(requested) && requested > 0) {
    return requested;
  }

  if (typeof os.availableParallelism === 'function') {
    return os.availableParallelism();
  }

  const cpus = os.cpus();
  return cpus && cpus.length ? cpus.length : 1;
}

if (!isPrimary) {
  require('./index');
  return;
}

const workerCount = getWorkerCount();
let shuttingDown = false;

function forkWorker() {
  return cluster.fork();
}

for (let i = 0; i < workerCount; i++) {
  forkWorker();
}

cluster.on('exit', () => {
  if (!shuttingDown) {
    forkWorker();
  }
});

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received, shutting down cluster`);

  const workers = Object.values(cluster.workers).filter(Boolean);
  if (!workers.length) {
    process.exit(0);
  }

  let remaining = workers.length;
  const timeout = setTimeout(() => process.exit(1), 5000);

  workers.forEach((worker) => {
    worker.on('exit', () => {
      remaining -= 1;
      if (remaining === 0) {
        clearTimeout(timeout);
        process.exit(0);
      }
    });
    worker.disconnect();
    setTimeout(() => {
      if (!worker.isDead()) {
        worker.kill('SIGTERM');
      }
    }, 3000);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
