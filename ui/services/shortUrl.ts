import { ODYSEE_HYPERBEAM_NODE_API, SHORT_URL_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from 'util/hyperbeamDevices';
const ShortUrl = {
  url: SHORT_URL_API,
  enabled: Boolean(SHORT_URL_API),
  createFrom: (longUrl: string): Promise<ShortUrlResponse> => createFrom(longUrl), // expandFrom: (shortUrl: string) => expandFrom(shortUrl),
};

// ****************************************************************************
// ****************************************************************************
function callApi(body) {
  if (!ShortUrl.enabled) {
    return Promise.reject('ShortUrl currently disabled');
  }

  const node = String(ODYSEE_HYPERBEAM_NODE_API || '').replace(/\/+$/, '');
  assert(SHORT_URL_API, 'SHORT_URL_API required');
  const params64 = base64Url(JSON.stringify(body || {}));
  const nodeUrl = hyperbeamDeviceUrl(HYPERBEAM_DEVICE.productEvents, 'short_url', { params64 });
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
  return fetch(
    node ? nodeUrl : `${ShortUrl.url}`,
    node ? { method: 'GET', headers: { accept: 'application/json' } } : options
  )
    .then((res) => res.json())
    .then((res) => {
      if (res?.error) {
        throw new Error(`${ShortUrl.url}: ${res.error}`);
      }

      return res;
    });
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createFrom(longUrl: string): Promise<ShortUrlResponse> {
  const body = {
    url: longUrl,
  };
  return callApi(body);
}

export default ShortUrl;
