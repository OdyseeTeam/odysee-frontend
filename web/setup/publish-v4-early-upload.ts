import { requestUploadToken, startTus } from './publish-v4-tasks';
import { X_LBRY_AUTH_TOKEN } from '../../ui/constants/token';
import Lbry from '../../ui/lbry';

export type EarlyUploadHandle = {
  promise: Promise<{ tusUrl: string }>;
  locationPromise: Promise<string>;
  pause: () => void;
  resume: () => void;
  abort: () => void;
};

export type EarlyUploadCallbacks = {
  onProgress: (percent: number, bytesPerSecond: number) => void;
  onError: (error: Error) => void;
};

export function startEarlyUpload(file: File, cb: EarlyUploadCallbacks): EarlyUploadHandle {
  let tusSession: any = null;
  let aborted = false;
  let paused = false;
  let lastBytes = 0;
  let lastTime = Date.now();

  const authToken =
    Lbry.getApiRequestHeaders() && Object.keys(Lbry.getApiRequestHeaders()).includes(X_LBRY_AUTH_TOKEN)
      ? Lbry.getApiRequestHeaders()[X_LBRY_AUTH_TOKEN]
      : '';

  let resolveLocation!: (loc: string) => void;
  let rejectLocation!: (err: any) => void;
  const locationPromise = new Promise<string>((resolve, reject) => {
    resolveLocation = resolve;
    rejectLocation = reject;
  });

  const promise = (async () => {
    let uploadToken;
    try {
      uploadToken = await requestUploadToken(authToken);
    } catch (e) {
      rejectLocation(e);
      throw e;
    }

    if (aborted) throw new Error('Upload aborted');

    return new Promise<{ tusUrl: string }>((resolve, reject) => {
      startTus(file, null, uploadToken.location, uploadToken.token, {
        onStart: (session) => {
          tusSession = session;
          // tus session.url is null until the first POST returns a Location
          // header. Poll for it so we can publish the early createClaim with
          // a file_path that contains the real upload_id.
          const pollUrl = setInterval(() => {
            if (aborted) {
              clearInterval(pollUrl);
              return;
            }
            if (session.url) {
              clearInterval(pollUrl);
              resolveLocation(session.url);
            }
          }, 100);
        },
        onRetry: () => {},
        onProgress: (pct: string) => {
          if (!aborted && !paused) {
            const percent = parseFloat(pct);
            const bytesUploaded = (percent / 100) * file.size;
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            let speed = 0;
            if (elapsed > 0.5) {
              speed = (bytesUploaded - lastBytes) / elapsed;
              lastBytes = bytesUploaded;
              lastTime = now;
            }
            cb.onProgress(percent, speed);
          }
        },
        onError: () => {
          if (!aborted) cb.onError(new Error('TUS upload failed'));
        },
      })
        .then((session) => {
          if (aborted) {
            reject(new Error('Upload aborted'));
          } else {
            resolve({ tusUrl: session.url });
          }
        })
        .catch(reject);
    });
  })();

  return {
    promise,
    locationPromise,
    pause: () => {
      paused = true;
      if (tusSession) {
        tusSession.abort();
      }
    },
    resume: () => {
      paused = false;
      if (tusSession) {
        tusSession.start();
      }
    },
    abort: () => {
      aborted = true;
      if (tusSession) {
        tusSession.abort();
        tusSession = null;
      }
    },
  };
}
