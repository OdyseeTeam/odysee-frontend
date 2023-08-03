// @flow
import type { PublishStatus } from './publish-v4-tasks';
import {
  checkPrerequisites,
  requestUploadToken,
  startRemoteUrl,
  startTus,
  createClaim,
  checkPublishStatus,
  yieldThread,
} from './publish-v4-tasks';
import {
  doUpdateUploadAdd as add,
  doUpdateUploadProgress as progress,
  doUpdateUploadRemove as remove,
} from 'redux/actions/publish';

// ****************************************************************************
// ****************************************************************************

const SDK_STATUS_INITIAL_DELAY_MS = 2000;
const SDK_STATUS_RETRY_INTERVAL_MS = 10000;
const MAX_PREVIEW_RETRIES = 2;

// ****************************************************************************
// makeV4UploadRequest
// ****************************************************************************

export async function makeV4UploadRequest(token: string, params: FileUploadSdkParams, file: File | string) {
  const { uploadUrl, guid, isMarkdown, remote_url, publishId: ignore, ...sdkParams } = params;
  const dispatch = window.store.dispatch;

  await checkPrerequisites(params);

  const uploadToken = await requestUploadToken(token, remote_url);

  let publishId = params.publishId;

  if (publishId) {
    // Already uploaded and `stream_create` executed. Just need to query the status.
    dispatch(progress({ guid, status: 'notify_ok', publishId }));
  } else {
    if (remote_url) {
      // Start remote URL upload
      const sdkFilePath = await startRemoteUrl(uploadToken, remote_url);

      // Create claim
      publishId = await createClaim(token, sdkFilePath, sdkParams, {
        onSuccess: (publishId) => dispatch(progress({ guid, status: 'notify_ok', publishId })),
        onFailure: () => dispatch(progress({ guid, status: 'notify_failed' })),
      });
    } else {
      // Start or resume TUS upload
      const tusSession = await startTus(file, params.uploadUrl, uploadToken.location, uploadToken.token, {
        onStart: (tusSession) => dispatch(add(file, params, tusSession, 'v4')),
        onRetry: () => dispatch(progress({ guid, status: 'retry' })),
        onProgress: (pct: string) => dispatch(progress({ guid, progress: pct })),
        onError: () => dispatch(progress({ guid, status: 'error' })),
      });

      // Create claim
      publishId = await createClaim(token, tusSession.url, sdkParams, {
        onSuccess: (publishId) => dispatch(progress({ guid, status: 'notify_ok', publishId })),
        onFailure: () => dispatch(progress({ guid, status: 'notify_failed' })),
      });
    }

    // Wait a bit before checking the SDK status
    await yieldThread(SDK_STATUS_INITIAL_DELAY_MS);
  }

  // Check SDK status
  if (params.preview) {
    let attempt = 0;
    while (true) {
      const status: PublishStatus = await checkPublishStatus(token, publishId);

      if (status.status === 'success') {
        dispatch(remove(guid));
        return status.sdkResult;
      } else {
        if (++attempt < MAX_PREVIEW_RETRIES) {
          await yieldThread(7000);
        } else {
          dispatch(remove(guid));
          return null; // Give up getting LBC estimate
        }
      }
    }
  } else {
    while (true) {
      const status: PublishStatus = await checkPublishStatus(token, publishId);

      switch (status.status) {
        case 'success':
          dispatch(remove(guid));
          return status.sdkResult;
        case 'pending':
          await yieldThread(SDK_STATUS_RETRY_INTERVAL_MS);
          break;
        case 'not_found':
          dispatch(progress({ guid, status: 'error' }));
          throw new Error('The upload does not exist.');
        case 'error':
          dispatch(progress({ guid, status: 'error' }));
          throw status.error;
        default:
          dispatch(progress({ guid, status: 'error' }));
          throw new Error('Unhandled status');
      }
    }
  }
}
