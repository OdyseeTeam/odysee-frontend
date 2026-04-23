type ProgressCallback = (progress: number) => void;

type PipelineResult = {
  file: File;
};

type PipelineHandle = {
  promise: Promise<PipelineResult>;
  pause: () => Promise<void>;
  resume: () => void;
};

export function runConversion(file: File, onProgress: ProgressCallback): PipelineHandle {
  return createWorkerHandle({ type: 'convert', file }, onProgress);
}

export function runOptimization(file: File, videoBitrate: number, onProgress: ProgressCallback): PipelineHandle {
  return createWorkerHandle({ type: 'optimize', file, options: { videoBitrate } }, onProgress);
}

function createWorkerHandle(message: any, onProgress: ProgressCallback): PipelineHandle {
  const worker = new Worker(new URL('../workers/upload-conversion-worker.ts', import.meta.url), { type: 'module' });
  const controlBuffer =
    typeof SharedArrayBuffer !== 'undefined' ? new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT) : null;
  const control = controlBuffer ? new Int32Array(controlBuffer) : null;

  let paused = false;
  let pauseRequested = false;
  let terminated = false;
  let lastVisibleProgress = 0;
  let pauseRequestedAtProgress: number | null = null;
  let controlVersion = 0;
  let pendingResult: PipelineResult | null = null;
  let pendingError: Error | null = null;
  let resolvePause: (() => void) | null = null;
  let pausePromise: Promise<void> | null = null;
  let resolvePromise: ((value: PipelineResult) => void) | null = null;
  let rejectPromise: ((reason: Error) => void) | null = null;

  const promise = new Promise<PipelineResult>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;

    worker.addEventListener('message', (e) => {
      const { type, progress, file, error, version } = e.data;
      if (type === 'progress') {
        if (paused || pauseRequested) {
          return;
        }
        lastVisibleProgress = progress;
        onProgress(progress);
      } else if (type === 'paused') {
        const controlPaused = control ? Atomics.load(control, 0) === 1 : false;
        if (!pauseRequested && !controlPaused) {
          return;
        }
        paused = true;
        pauseRequested = false;
        const frozenProgress =
          pauseRequestedAtProgress !== null
            ? pauseRequestedAtProgress
            : typeof progress === 'number'
              ? progress
              : lastVisibleProgress;
        lastVisibleProgress = frozenProgress;
        onProgress(frozenProgress);
        pauseRequestedAtProgress = null;
        if (resolvePause) {
          resolvePause();
          resolvePause = null;
          pausePromise = null;
        }
      } else if (type === 'resumed') {
        const controlPaused = control ? Atomics.load(control, 0) === 1 : false;
        if (controlPaused) {
          return;
        }
        paused = false;
      } else if (type === 'done') {
        terminated = true;
        worker.terminate();
        if (resolvePause) {
          resolvePause();
          resolvePause = null;
          pausePromise = null;
        }
        if (paused) {
          pendingResult = { file };
        } else {
          resolve({ file });
        }
      } else if (type === 'error') {
        terminated = true;
        worker.terminate();
        if (resolvePause) {
          resolvePause();
          resolvePause = null;
          pausePromise = null;
        }
        if (paused) {
          pendingError = new Error(error);
        } else {
          reject(new Error(error));
        }
      }
    });

    worker.addEventListener('error', (e) => {
      terminated = true;
      worker.terminate();
      if (resolvePause) {
        resolvePause();
        resolvePause = null;
        pausePromise = null;
      }
      if (paused) {
        pendingError = new Error(e.message);
      } else {
        reject(new Error(e.message));
      }
    });

    worker.postMessage({ ...message, controlBuffer }); // eslint-disable-line unicorn/require-post-message-target-origin
  });

  return {
    promise,
    pause: () => {
      if (paused) {
        return Promise.resolve();
      }

      controlVersion += 1;
      pauseRequested = true;
      pauseRequestedAtProgress = lastVisibleProgress;
      if (control) {
        Atomics.store(control, 0, 1);
      }
      if (!terminated) {
        worker.postMessage({ type: 'pause', version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
      }

      if (!pausePromise) {
        pausePromise = new Promise((resolve) => {
          resolvePause = resolve;
        });
      }

      return pausePromise;
    },
    resume: () => {
      controlVersion += 1;
      pauseRequested = false;
      pauseRequestedAtProgress = null;
      paused = false;
      if (control) {
        Atomics.store(control, 0, 0);
        Atomics.notify(control, 0);
      }
      if (!terminated) {
        worker.postMessage({ type: 'resume', version: controlVersion }); // eslint-disable-line unicorn/require-post-message-target-origin
      }
      if (pendingResult && resolvePromise) {
        resolvePromise(pendingResult);
        pendingResult = null;
      } else if (pendingError && rejectPromise) {
        rejectPromise(pendingError);
        pendingError = null;
      }
    },
  };
}
