// @flow
import * as tus from 'tus-js-client';
import NoopUrlStorage from 'tus-js-client/lib/noopUrlStorage';
import { LBRY_WEB_PUBLISH_API_V4 } from 'config';
import { X_LBRY_AUTH_TOKEN } from '../../ui/constants/token';

const V4_INIT_UPLOAD = `${LBRY_WEB_PUBLISH_API_V4}/uploads/`;

// ****************************************************************************
// Step: check prerequisites
// ****************************************************************************

export function checkPrerequisites(params: FileUploadSdkParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!LBRY_WEB_PUBLISH_API_V4) {
      reject(new Error('LBRY_WEB_PUBLISH_API_V4 is not defined in the environment'));
    }
    if (params.remote_url) {
      reject(new Error('Publish: v5 does not support remote_url'));
    }
    resolve(true);
  });
}

// ****************************************************************************
// Step: Get upload token from Odysee API
// ****************************************************************************

export type TokenRequestResponse = { token: string, location: string };

export function requestUploadToken(authToken: string): Promise<TokenRequestResponse> {
  return new Promise((resolve, reject) => {
    fetch(V4_INIT_UPLOAD, {
      method: 'POST',
      headers: {
        [X_LBRY_AUTH_TOKEN]: authToken,
        'Content-Type': 'application/json',
      },
    })
      .then(convertResponseToJson)
      .then((json) => validateJson(json, 'upload_token_created', (p) => p.token && p.location))
      .then((payload) => resolve({ token: payload.token, location: payload.location }))
      .catch((err) => reject(v4Error(err, { step: 'getToken' })));
  });
}

// ****************************************************************************
// Step: Perform TUS upload/resume
// ****************************************************************************

const STATUS_NOT_FOUND = 404;
const STATUS_CONFLICT = 409;
const STATUS_LOCKED = 423;

function inStatusCategory(status, category) {
  return status >= category && status < category + 100;
}

export type TusCallbacks = {
  // Callbacks for UI updates. The result/error should still be obtained from the Promise.
  onStart: (tusSession: tus.Upload) => void,
  onRetry: () => void,
  onProgress: (progressPct: string) => void,
  onError: () => void,
};

export function startTus(
  file: File | string,
  uploadUrl: ?string, // Previous upload URL if resuming
  uploadLocation: string, // Upload URL if not resuming
  uploadToken: string,
  cb: TusCallbacks
): Promise<tus.Upload> {
  return new Promise((resolve, reject) => {
    assert(uploadUrl || uploadLocation, 'Either uploadUrl or uploadLocation must be provided');

    // --- Create tus session ---
    const tusSession = new tus.Upload(file, {
      ...(uploadUrl ? { uploadUrl: uploadUrl } : { endpoint: uploadLocation }),
      chunkSize: 25 * 1024 * 1024, // 25MB
      retryDelays: [0, 3000, 5000, 10000, 20000], // v3 uses: [8000, 15000, 30000],
      parallelUploads: 1,
      storeFingerprintForResuming: false,
      urlStorage: new NoopUrlStorage(),
      headers: { Authorization: `Bearer ${uploadToken}` },
      metadata: {
        filename: file instanceof File ? file.name : file,
        filetype: file instanceof File ? file.type : undefined,
      },
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        cb.onProgress(percentage);
      },
      onShouldRetry: (err, retryAttempt, options) => {
        const status = err.originalResponse ? err.originalResponse.getStatus() : 0;
        const shouldRetry =
          !inStatusCategory(status, 400) ||
          status === STATUS_CONFLICT ||
          status === STATUS_LOCKED ||
          status === STATUS_NOT_FOUND;
        if (shouldRetry) {
          cb.onRetry();
        }
        return shouldRetry;
      },
      onError: (err) => {
        const filename = file instanceof File ? file.name : file;
        const filetype = file instanceof File ? file.type : undefined;
        cb.onError();
        reject(
          v4Error(beautifyTusError(err), { step: 'tus', inputs: { filename, filetype, uploadUrl, uploadLocation } })
        );
      },
      onSuccess: () => resolve(tusSession),
    });

    // --- Start/resume tus session ---
    cb.onStart(tusSession); // Pass tus object so client can call abort() if needed.
    tusSession.start();
  });
}

// ****************************************************************************
// Step: Send SDK request to Odysee API to create the claim
// ****************************************************************************

export type PublishId = number;

export type CreateClaimCallbacks = {
  // Callbacks for UI updates. The result/error should still be obtained from the Promise.
  onSuccess: (publishId: PublishId) => void,
  onFailure: () => void,
};

export function createClaim(
  authToken: string,
  uploadUrl: string,
  params: any,
  cb: CreateClaimCallbacks
): Promise<PublishId> {
  return new Promise((resolve, reject) => {
    const sdkParams = { ...params, file_path: uploadUrl };

    fetch(`${LBRY_WEB_PUBLISH_API_V4}/`, {
      method: 'POST',
      headers: {
        [X_LBRY_AUTH_TOKEN]: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: params.claim_id ? 'stream_update' : 'stream_create',
        params: sdkParams,
        id: Date.now(),
      }),
    })
      .then(convertResponseToJson)
      .then((json) => validateJson(json, 'query_created', (p) => p.query_id))
      .then((payload) => {
        cb.onSuccess(payload.query_id);
        resolve(payload.query_id);
      })
      .catch((err) => {
        cb.onFailure();
        reject(v4Error(err, { step: 'sdk', inputs: { uploadUrl, sdkParams } }));
      });
  });
}

// ****************************************************************************
// Step: Check the status of the publish
// ****************************************************************************

export type PublishStatus = {
  status: 'success' | 'pending' | 'not_found' | 'error' | 'unknown',
  sdkResult?: { ... },
  error?: Error,
};

export function checkPublishStatus(authToken: string, queryId: PublishId): Promise<PublishStatus> {
  return new Promise((resolve, reject) => {
    fetch(`${LBRY_WEB_PUBLISH_API_V4}/${queryId}`, {
      method: 'GET',
      headers: {
        [X_LBRY_AUTH_TOKEN]: authToken,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        switch (response.status) {
          case 204:
            resolve({ status: 'pending' });
            break;

          case 404:
            resolve({ status: 'not_found' });
            break;

          case 200:
            convertResponseToJson(response)
              .then((json) => {
                if (json && json.result && !json.error) {
                  resolve({ status: 'success', sdkResult: json.result });
                } else {
                  resolve({
                    status: 'error',
                    error: json?.error
                      ? v4Error(`${json?.error?.message || json?.error}`, { response: json })
                      : v4Error('Invalid SDK response', { response: json }),
                  });
                }
              })
              .catch((err) =>
                resolve({ status: 'error', error: v4Error(err, { step: 'status', inputs: { queryId } }) })
              );
            break;

          default:
            assert(false, 'unhandled status:', response);
            resolve({ status: 'unknown' });
            break;
        }
      })
      .catch((err) => resolve({ status: 'error', error: v4Error(err, { step: 'status', inputs: { queryId } }) }));
  });
}

// ****************************************************************************
// Util: convertResponseToJson
// ****************************************************************************

function convertResponseToJson(response: Response): Promise<any> {
  return new Promise((resolve, reject) => {
    if (response.ok) {
      resolve(response.json());
    } else {
      response
        .text()
        .then((text) => reject(new Error(text)))
        .catch(() => reject(new Error(response.statusText)));
    }
  });
}

// ****************************************************************************
// Util: validateJsonResponse
// ****************************************************************************

function validateJson(json: any, okStatus: string, validator: (payload: any) => boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    if (json && json.status === okStatus && json.payload && validator(json.payload)) {
      resolve(json.payload);
    } else {
      if (json?.error) {
        reject(v4Error(`${json?.error?.message || json?.error}`, { response: json }));
      } else {
        reject(v4Error('Invalid response from server', { response: json }));
      }
    }
  });
}

// ****************************************************************************
// Util: error handling
// ****************************************************************************

function v4Error(flop: Error | string, cause: { ... }): Error {
  if (typeof flop === 'string') {
    return finalizeError(flop, cause);
  } else {
    // $FlowIgnore (outdated definition for Error)
    const mergedCause = { ...(flop.cause ? flop.cause : {}), ...cause };
    // Override generic "failed to fetch"
    const message = flop.message === 'Failed to fetch' ? 'Network error. Please try again.' : flop.message;
    // Done
    return finalizeError(message, mergedCause);
  }

  function finalizeError(message: string, cause: any): Error {
    // $FlowIgnore (outdated definition for Error)
    return new Error(message, { ...(cause ? { cause } : {}) });
  }
}

// ****************************************************************************
// Util: Beautify TUS error
// ****************************************************************************

function beautifyTusError(err: Error) {
  let errMsg = err.message;

  // Trim off known junk that doesn't add value
  errMsg = errMsg.replace(' caused by [object ProgressEvent],', '');
  errMsg = errMsg.replace(' response code: n/a,', '');
  errMsg = errMsg.replace(' response text: n/a,', '');
  errMsg = errMsg.replace(' request id: n/a', '');

  if (errMsg.length !== err.message.length) {
    return new Error(errMsg);
  }

  return err;
}

// ****************************************************************************
// Util: yieldThread
// ****************************************************************************

export function yieldThread(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
