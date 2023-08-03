// @flow

export function webDownloadClaim(
  streamingUrl: string,
  fileName: ?string,
  isSecure: ?boolean,
  uriAccessKey: ?UriAccessKey
) {
  const url = new URL(streamingUrl);

  // Existing usages allowed null string. Try to capture that scenario
  assert(fileName, 'Trying to download an empty fileName');

  if (!isSecure) {
    url.searchParams.set('download', 'true');
  }

  if (uriAccessKey) {
    url.searchParams.set('signature', uriAccessKey.signature);
    url.searchParams.set('signature_ts', uriAccessKey.signature_ts);
  }

  const element = document.createElement('a');
  element.href = url.toString();
  element.setAttribute('download', fileName || '');
  element.click();
  element.remove();
}
