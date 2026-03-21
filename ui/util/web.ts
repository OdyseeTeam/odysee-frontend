import { URL, THUMBNAIL_CARDS_CDN_URL } from 'config';

const CONTINENT_COOKIE = 'continent';

function generateEmbedUrl(
  claimUri: string,
  startTime?: string | number,
  referralLink?: string,
  newestType?: string,
  autoplay?: boolean,
  uriAccessKey?: UriAccessKey
): string {
  const uriPath = claimUri.replace('lbry://', '').replace(/#/g, ':');
  let urlParams = new URLSearchParams();

  if (startTime) {
    urlParams.append('t', escapeHtmlProperty(startTime));
  }

  if (referralLink) {
    urlParams.append('r', escapeHtmlProperty(referralLink));
  }

  if (newestType) {
    urlParams.append('feature', newestType);
  }

  if (autoplay) {
    urlParams.append('autoplay', 'true');
  }

  if (uriAccessKey) {
    urlParams.append('signature', uriAccessKey.signature);
    urlParams.append('signature_ts', uriAccessKey.signature_ts);
  }

  const embedUrl = `${URL}/$/embed/${escapeHtmlProperty(uriPath)}`;
  const embedUrlParams = urlParams.toString() ? `?${urlParams.toString()}` : '';
  return `${embedUrl}${embedUrlParams}`;
}

function generateEmbedUrlEncoded(
  claimUri: string,
  startTime?: string | number,
  referralLink?: string,
  newestType?: string,
  autoplay?: boolean,
  uriAccessKey?: UriAccessKey
): string {
  const uriPath = claimUri.replace('lbry://', '').replace(/#/g, ':');
  const encodedUri = encodeURIComponent(uriPath).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
  return generateEmbedUrl(encodedUri, startTime, referralLink, newestType, autoplay, uriAccessKey).replace(
    /\$/g,
    '%24'
  );
}

function generateEmbedIframeData(src: string): { html: string } {
  const width = '100%';
  const ratio = '16 / 9';
  const html = `<iframe id="odysee-iframe" style="width:${width}; aspect-ratio:${ratio};" src="${src}" allowfullscreen></iframe>`;
  return {
    html,
  };
}

function generateDownloadUrl(claimName: string, claimId: string): string {
  return `${URL}/$/download/${claimName}/${claimId}`;
}

function generateDirectUrl(claimName: string, claimId: string): string {
  return `${URL}/$/stream/${claimName}/${claimId}`;
}

function generateNewestUrl(channelName: string, newestType: string): string {
  return `${URL}/$/${newestType}/${channelName}`;
}

function getThumbnailCardCdnUrl(url: string | undefined): string | undefined {
  if (
    !THUMBNAIL_CARDS_CDN_URL ||
    !url ||
    (url && (url.includes('https://twitter-card') || url.includes('https://cards.odycdn.com')))
  ) {
    return url;
  }

  if (url && !url.startsWith('data:image')) {
    return `${THUMBNAIL_CARDS_CDN_URL}${url}`;
  }
}

function getParameterByName(name: string, url: string): string | null {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function escapeHtmlProperty(property: string | number | undefined): string {
  return property
    ? String(property)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    : '';
}

function unscapeHtmlProperty(property: string | undefined): string {
  return property
    ? String(property)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
    : '';
}

export {
  CONTINENT_COOKIE,
  generateDirectUrl,
  generateDownloadUrl,
  generateEmbedIframeData,
  generateEmbedUrl,
  generateEmbedUrlEncoded,
  getParameterByName,
  getThumbnailCardCdnUrl,
  escapeHtmlProperty,
  unscapeHtmlProperty,
  generateNewestUrl,
};
