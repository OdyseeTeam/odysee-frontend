// @flow
import { SHORT_URL_API } from 'config';

const ShortUrl = {
  url: SHORT_URL_API,
  enabled: Boolean(SHORT_URL_API),

  createFrom: (longUrl: string): Promise<ShortUrlResponse> => createFrom(longUrl),
  // expandFrom: (shortUrl: string) => expandFrom(shortUrl),
};

// ****************************************************************************
// ****************************************************************************

function callApi(body) {
  if (!ShortUrl.enabled) {
    return Promise.reject('ShortUrl currently disabled');
  }

  assert(SHORT_URL_API, 'SHORT_URL_API required');

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  return fetch(`${ShortUrl.url}`, options)
    .then((res) => res.json())
    .then((res) => {
      if (res?.error) {
        throw new Error(`${ShortUrl.url}: ${res.error}`);
      }
      return res;
    });
}

function createFrom(longUrl: string): Promise<ShortUrlResponse> {
  const body = {
    url: longUrl,
  };

  return callApi(body);
}

export default ShortUrl;
