const { URL, THUMBNAIL_CARDS_CDN_URL } = require('../../config');

const CONTINENT_COOKIE = 'continent';

function generateEmbedUrl(claimName, claimId, startTime, referralLink, newestType) {
  let urlParams = new URLSearchParams();

  if (startTime) {
    urlParams.append('t', escapeHtmlProperty(startTime));
  }

  if (referralLink) {
    urlParams.append('r', escapeHtmlProperty(referralLink));
  }

  const encodedUriName = encodeURIComponent(claimName).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');

  let embedUrl;
  if (newestType) {
    embedUrl = `${URL}/$/embed/${escapeHtmlProperty(encodedUriName)}?feature=${newestType}`;
  } else {
    embedUrl = `${URL}/$/embed/${escapeHtmlProperty(encodedUriName)}/${escapeHtmlProperty(claimId)}`;
  }
  const embedUrlParams = urlParams.toString() ? `?${urlParams.toString()}` : '';

  return `${embedUrl}${embedUrlParams}`;
}

function generateEmbedUrlEncoded(claimName, claimId, startTime, referralLink) {
  return generateEmbedUrl(claimName, claimId, startTime, referralLink).replace(/\$/g, '%24');
}

function generateEmbedIframeData(src) {
  const width = '560';
  const height = '315';
  const html = `<iframe id="odysee-iframe" width="${width}" height="${height}" src="${src}" allowfullscreen></iframe>`;

  return { html, width, height };
}

function generateDownloadUrl(claimName, claimId) {
  return `${URL}/$/download/${claimName}/${claimId}`;
}

function generateDirectUrl(claimName, claimId) {
  return `${URL}/$/stream/${claimName}/${claimId}`;
}

function generateNewestUrl(channelName, newestType) {
  return `${URL}/$/${newestType}/${channelName}`;
}

function getThumbnailCardCdnUrl(url) {
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

function getParameterByName(name, url) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function escapeHtmlProperty(property) {
  return property
    ? String(property)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    : '';
}

function unscapeHtmlProperty(property) {
  return property
    ? String(property)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
    : '';
}

// module.exports needed since the web server imports this function
module.exports = {
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
