// @flow
import type { PublishStatus } from './publish-v4-tasks';
import {
  checkPrerequisites,
  requestUploadToken,
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

const SDK_STATUS_RETRY_INTERVAL_MS = 30000;

// ****************************************************************************
// makeV4UploadRequest
// ****************************************************************************

export async function makeV4UploadRequest(token: string, params: FileUploadSdkParams, file: File | string) {
  const { uploadUrl, guid, isMarkdown, publishId: ignore, ...sdkParams } = params;
  const dispatch = window.store.dispatch;

  await checkPrerequisites(params);
  const uploadToken = await requestUploadToken(token);
  let publishId = params.publishId;

  if (publishId) {
    // -- Already uploaded and `stream_create` executed. Just need to query the status.
    dispatch(progress({ guid, status: 'notify_ok', publishId }));
  } else {
    // -- Start or resume TUS upload
    const tusSession = await startTus(file, params.uploadUrl, uploadToken.location, uploadToken.token, {
      onStart: (tusSession) => dispatch(add(file, params, tusSession, 'v4')),
      onRetry: () => dispatch(progress({ guid, status: 'retry' })),
      onProgress: (pct: string) => dispatch(progress({ guid, progress: pct })),
      onError: () => dispatch(progress({ guid, status: 'error' })),
    });
    // -- Create claim
    publishId = await createClaim(token, tusSession.url, sdkParams, {
      onSuccess: (publishId) => dispatch(progress({ guid, status: 'notify_ok', publishId })),
      onFailure: () => dispatch(progress({ guid, status: 'notify_failed' })),
    });
  }

  // -- Check SDK status
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
