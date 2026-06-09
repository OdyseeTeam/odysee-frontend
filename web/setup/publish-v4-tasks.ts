import * as tus from 'tus-js-client';
import NoopUrlStorage from 'tus-js-client/lib/noopUrlStorage';
import { LBRY_WEB_PUBLISH_API_V4, ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { X_LBRY_AUTH_TOKEN } from '../../ui/constants/token';
import { HYPERBEAM_DEVICE, hyperbeamDeviceBase, hyperbeamDeviceUrl } from '../../ui/util/hyperbeamDevices';
const V4_INIT_UPLOAD = `${LBRY_WEB_PUBLISH_API_V4}/uploads/`;
const v4_INIT_URL = `${LBRY_WEB_PUBLISH_API_V4}/urls/`;
const STATUS_RETRY_DELAYS_MS = [1000, 3000, 7000];
type SdkFilePath = string;

function hyperbeamNodeBase() {
  return hyperbeamDeviceBase(HYPERBEAM_DEVICE.productEvents);
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function publishV4HyperbeamNodeCall(authToken: string, action: string, params: Record<string, any> = {}) {
  const node = hyperbeamNodeBase();
  if (!node) return null;

  const params64 = base64Url(JSON.stringify({ action, ...params }));
  const url = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.productEvents, 'publish_v4', { params64 });
  const usePost = url.length > 1800;

  return fetch(usePost ? `${node}/publish_v4` : url, {
    method: usePost ? 'POST' : 'GET',
    headers: {
      [X_LBRY_AUTH_TOKEN]: authToken,
      accept: 'application/json',
      ...(usePost ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(usePost ? { body: JSON.stringify({ params64 }) } : {}),
  })
    .then(convertResponseToJson)
    .then((json) => {
      if (json?.error) {
        throw new Error(json.error.message || json.error);
      }

      return json;
    });
}

function hyperbeamNodeTusUrl(upstreamUrl: string | null | undefined) {
  const node = hyperbeamNodeBase();
  if (!node || !upstreamUrl) return upstreamUrl;

  return hyperbeamDeviceUrl(HYPERBEAM_DEVICE.productEvents, 'publish_v4_tus', { url64: base64Url(upstreamUrl) });
}

export function getTusUpstreamUrl(url: string | null | undefined) {
  const node = hyperbeamNodeBase();
  if (!node || !url || !url.startsWith(`${node}/publish_v4_tus?`)) return url;

  const url64 = new URL(url).searchParams.get('url64');
  if (!url64) return url;

  const normalized = url64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
// ****************************************************************************
// isEditingMetaOnly
// ****************************************************************************
export function isEditingMetaOnly(params: FileUploadSdkParams) {
  return !params.file_path && !params.remote_url && !params.publishId;
}
// ****************************************************************************
// Step: check prerequisites
// ****************************************************************************
export function checkPrerequisites(params: FileUploadSdkParams): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!LBRY_WEB_PUBLISH_API_V4) {
      reject(new Error('LBRY_WEB_PUBLISH_API_V4 is not defined in the environment'));
    }

    resolve(true);
  });
}
// ****************************************************************************
// Resolve file
// ****************************************************************************
export function resolveFileToUpload(params: FileUploadSdkParams): Promise<File | string> {
  return new Promise((resolve, reject) => {
    if (params.preview) {
      // Send dummy file for the preview. The tx-fee calculation does not depend on it.
      const dummyContent = 'x';
      resolve(
        new File([dummyContent], 'dummy.md', {
          type: 'text/markdown',
        })
      );
    } else {
      assert(params.file_path, 'file_path is required');
      resolve(params.file_path);
    }
  });
}
// ****************************************************************************
// Step: Get upload token from Odysee API
// ****************************************************************************
export type TokenRequestResponse = {
  token: string;
  location: string;
};
export function requestUploadToken(authToken: string, remoteUrl?: string): Promise<TokenRequestResponse> {
  return new Promise((resolve, reject) => {
    const nodeRequest = publishV4HyperbeamNodeCall(authToken, remoteUrl ? 'init_url' : 'init_upload');
    const directRequest = () =>
      fetch(remoteUrl ? v4_INIT_URL : V4_INIT_UPLOAD, {
        method: 'POST',
        headers: {
          [X_LBRY_AUTH_TOKEN]: authToken,
          'Content-Type': 'application/json',
        },
      }).then(convertResponseToJson);

    (nodeRequest ? nodeRequest.then((response) => response.body) : directRequest())
      .then((json) => validateJson(json, 'upload_token_created', (p) => p.token && p.location))
      .then((payload) =>
        resolve({
          token: payload.token,
          location: payload.location,
        })
      )
      .catch((err) =>
        reject(
          v4Error(err, {
            step: 'getToken',
          })
        )
      );
  });
}
// ****************************************************************************
// Step: Start Remote URL publishing
// ****************************************************************************
export function startRemoteUrl(
  authToken: string,
  uploadToken: TokenRequestResponse,
  remoteUrl: string
): Promise<SdkFilePath> {
  return new Promise((resolve, reject) => {
    const nodeRequest = publishV4HyperbeamNodeCall(authToken, 'start_remote_url', {
      location: uploadToken.location,
      upload_token: uploadToken.token,
      remote_url: remoteUrl,
    });
    const directRequest = () =>
      fetch(uploadToken.location, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${uploadToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: remoteUrl,
        }),
      }).then(convertResponseToJson);

    (nodeRequest ? nodeRequest.then((response) => response.body) : directRequest())
      .then((json) => validateJson(json, 'url_created', (p) => p.upload_id))
      .then((payload) => resolve(`${uploadToken.location}${payload.upload_id}`))
      .catch((err) =>
        reject(
          v4Error(err, {
            step: 'startRemoteUrl',
          })
        )
      );
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
  onStart: (tusSession: tus.Upload) => void;
  onRetry: () => void;
  onProgress: (progressPct: string) => void;
  onError: () => void;
};
export function startTus(
  file: File | string,
  uploadUrl: string | null | undefined, // Previous upload URL if resuming
  uploadLocation: string, // Upload URL if not resuming
  uploadToken: string,
  cb: TusCallbacks
): Promise<tus.Upload> {
  return new Promise((resolve, reject) => {
    assert(uploadUrl || uploadLocation, 'Either uploadUrl or uploadLocation must be provided');
    // --- Create tus session ---
    const tusSession = new tus.Upload(file as File, {
      ...(uploadUrl
        ? {
            uploadUrl: hyperbeamNodeTusUrl(uploadUrl),
          }
        : {
            endpoint: hyperbeamNodeTusUrl(uploadLocation),
          }),
      chunkSize: 50 * 1024 * 1024,
      // 50MB
      retryDelays: [0, 3000, 5000, 10000, 15000, 15000, 15000, 15000, 15000],
      // v3 uses: [8000, 15000, 30000],
      parallelUploads: 1,
      storeFingerprintForResuming: false,
      urlStorage: new NoopUrlStorage(),
      headers: {
        Authorization: `Bearer ${uploadToken}`,
      },
      metadata: {
        filename: file instanceof File ? file.name : file,
        filetype: file instanceof File ? file.type : undefined,
      },
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        cb.onProgress(percentage);
      },
      onShouldRetry: (err: any, retryAttempt, options) => {
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
          v4Error(beautifyTusError(err), {
            step: 'tus',
            inputs: {
              filename,
              filetype,
              uploadUrl,
              uploadLocation,
            },
          })
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
  onSuccess: (publishId: PublishId) => void;
  onFailure: () => void;
};
export function createClaim(
  authToken: string,
  sdkFilePath: SdkFilePath | null | undefined,
  params: any,
  cb: CreateClaimCallbacks
): Promise<PublishId> {
  return new Promise((resolve, reject) => {
    const sdkParams = {
      ...params,
      ...(sdkFilePath
        ? {
            file_path: sdkFilePath,
          }
        : {}),
    };
    const body = {
      jsonrpc: '2.0',
      method: params.claim_id ? 'stream_update' : 'stream_create',
      params: sdkParams,
      id: Date.now(),
    };
    const nodeRequest = publishV4HyperbeamNodeCall(authToken, 'create_claim', { body });
    const directRequest = () =>
      fetch(`${LBRY_WEB_PUBLISH_API_V4}/`, {
        method: 'POST',
        headers: {
          [X_LBRY_AUTH_TOKEN]: authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then(convertResponseToJson);

    (nodeRequest ? nodeRequest.then((response) => response.body) : directRequest())
      .then((json) => validateJson(json, 'query_created', (p) => p.query_id))
      .then((payload) => {
        cb.onSuccess(payload.query_id);
        resolve(payload.query_id);
      })
      .catch((err) => {
        cb.onFailure();
        reject(
          v4Error(err, {
            step: 'sdk',
            inputs: {
              sdkParams,
            },
          })
        );
      });
  });
}
// ****************************************************************************
// Step: Check the status of the publish
// ****************************************************************************
export type PublishStatus = {
  status: 'success' | 'pending' | 'not_found' | 'error' | 'unknown';
  sdkResult?: {};
  error?: Error;
  retryable?: boolean;
};

function isRetryableStatusCode(status: number) {
  return status === 404 || status === 429 || status >= 500;
}

async function getPublishStatus(authToken: string, queryId: PublishId): Promise<PublishStatus> {
  const nodeResponse = await publishV4HyperbeamNodeCall(authToken, 'status', { query_id: queryId });
  const response = nodeResponse
    ? {
        status: nodeResponse.status,
        json: async () => nodeResponse.body,
      }
    : await fetch(`${LBRY_WEB_PUBLISH_API_V4}/${queryId}`, {
        method: 'GET',
        headers: {
          [X_LBRY_AUTH_TOKEN]: authToken,
          'Content-Type': 'application/json',
        },
      });

  switch (response.status) {
    case 204:
      return {
        status: 'pending',
      };

    case 404:
      return {
        status: 'not_found',
        retryable: true,
      };

    case 200:
      try {
        const json = nodeResponse ? await response.json() : await convertResponseToJson(response as Response);

        if (json && json.result && !json.error) {
          return {
            status: 'success',
            sdkResult: json.result,
          };
        }

        return {
          status: 'error',
          error: json?.error
            ? v4Error(`${json?.error?.message || json?.error}`, {
                response: json,
              })
            : v4Error('Invalid SDK response', {
                response: json,
              }),
          retryable: !json?.error,
        };
      } catch (err) {
        return {
          status: 'error',
          error: v4Error(err, {
            step: 'status',
            inputs: {
              queryId,
            },
          }),
          retryable: true,
        };
      }

    default:
      return {
        status: isRetryableStatusCode(response.status) ? 'unknown' : 'error',
        error: v4Error(`Unexpected publish status response (${response.status})`, {
          step: 'status',
          responseStatus: response.status,
          inputs: {
            queryId,
          },
        }),
        retryable: isRetryableStatusCode(response.status),
      };
  }
}

export async function checkPublishStatus(authToken: string, queryId: PublishId): Promise<PublishStatus> {
  let lastStatus: PublishStatus | null = null;

  for (let attempt = 0; attempt <= STATUS_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const status = await getPublishStatus(authToken, queryId);
      lastStatus = status;

      if (!status.retryable) {
        return status;
      }
    } catch (err) {
      lastStatus = {
        status: 'error',
        error: v4Error(err, {
          step: 'status',
          inputs: {
            queryId,
          },
        }),
        retryable: true,
      };
    }

    const retryDelay = STATUS_RETRY_DELAYS_MS[attempt];
    if (retryDelay === undefined) break;
    await yieldThread(retryDelay);
  }

  return (
    lastStatus || {
      status: 'error',
      error: v4Error('Invalid SDK response', {
        step: 'status',
        inputs: {
          queryId,
        },
      }),
    }
  );
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
        reject(
          v4Error(`${json?.error?.message || json?.error}`, {
            response: json,
          })
        );
      } else {
        reject(
          v4Error('Invalid response from server', {
            response: json,
          })
        );
      }
    }
  });
}

// ****************************************************************************
// Util: error handling
// ****************************************************************************
function finalizeError(message: string, cause: any): Error {
  return new Error(
    message,
    cause
      ? {
          cause,
        }
      : {}
  );
}

function v4Error(flop: Error | string, cause: {}): Error {
  if (typeof flop === 'string') {
    return finalizeError(flop, cause);
  } else {
    const mergedCause = { ...(flop.cause && typeof flop.cause === 'object' ? flop.cause : {}), ...cause };
    // Override generic "failed to fetch"
    const message = flop.message === 'Failed to fetch' ? 'Network error. Please try again.' : flop.message;
    // Done
    return finalizeError(message, mergedCause);
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
