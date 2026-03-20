import { v4 as uuid } from 'uuid';
import { makeV4UploadRequest } from './publish-v4'; // A modified version of Lbry.apiCall that allows
// to perform calling methods at arbitrary urls
// and pass form file fields

export default function apiPublishCallViaWeb(
  apiCall: (arg0: any, arg1: any, arg2: any, arg3: any) => any,
  token: string,
  method: string,
  params: FileUploadSdkParams,
  resolve: (...args: Array<any>) => any,
  reject: (...args: Array<any>) => any
) {
  // Add a random ID to serve as the redux key.
  // If it already exists, then it is a resumed session.
  if (!params.guid) {
    params.guid = uuid();
  }

  return makeV4UploadRequest(token, params)
    .then((result) => resolve(result))
    .catch((err) => {
      assert(false, `${err.message}`, err.cause || err);
      reject(err);
    });
}
