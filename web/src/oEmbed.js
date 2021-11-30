const {
  URL,
  SITE_NAME,
  LBRY_WEB_API,
  THUMBNAIL_CARDS_CDN_URL,
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} = require('../../config.js');

const { generateEmbedUrl } = require('../../ui/util/web');
const { lbryProxy: Lbry } = require('../lbry');

const SDK_API_PATH = `${LBRY_WEB_API}/api/v1`;
const proxyURL = `${SDK_API_PATH}/proxy`;
Lbry.setDaemonConnectionString(proxyURL);

function getParameterByName(name, url) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// ****************************************************************************
// Fetch claim info
// ****************************************************************************

function getThumbnailCdnUrl(url) {
  if (
    !THUMBNAIL_CARDS_CDN_URL ||
    !url ||
    (url && (url.includes('https://twitter-card') || url.includes('https://cards.odysee.com')))
  ) {
    return url;
  }

  if (url) {
    const encodedURL = Buffer.from(url).toString('base64');
    return `${THUMBNAIL_CARDS_CDN_URL}${encodedURL}.jpg`;
  }
}

async function getClaim(requestUrl) {
  const uri = requestUrl.replace(URL, 'lbry:/');

  let claim;
  let error;

  try {
    const response = await Lbry.resolve({ urls: [uri] });
    if (response && response[uri] && !response[uri].error) {
      claim = response[uri];
    }
  } catch {}

  if (!claim) {
    error = 'The URL is invalid or is not associated with any claim.';
  } else {
    const { value_type, value } = claim;

    if (value_type !== 'stream' || value.stream_type !== 'video') {
      error = 'The URL is not associated with a video claim.';
    }
  }

  return { claim, error };
}

// ****************************************************************************
// Generate
// ****************************************************************************

function generateOEmbedData(claim) {
  const { value, signing_channel: authorClaim } = claim;

  const claimTitle = value.title;
  const authorName = authorClaim ? authorClaim.value.title || authorClaim.name : 'Anonymous';
  const authorUrlPath = authorClaim && authorClaim.canonical_url.replace('lbry://', '');
  const authorUrl = authorClaim ? `${URL}/${authorUrlPath}` : null;
  const thumbnailUrl = value && value.thumbnail && value.thumbnail.url && getThumbnailCdnUrl(value.thumbnail.url);
  const videoUrl = generateEmbedUrl(claim.name, claim.claim_id);
  const videoWidth = value.video && value.video.width;
  const videoHeight = value.video && value.video.height;

  return {
    type: 'video',
    version: '1.0',
    title: claimTitle,
    author_name: authorName,
    author_url: authorUrl,
    provider_name: SITE_NAME,
    provider_url: URL,
    thumbnail_url: thumbnailUrl,
    thumbnail_width: THUMBNAIL_WIDTH,
    thumbnail_height: THUMBNAIL_HEIGHT,
    html: `<iframe id="lbry-iframe" width="560" height="315" src="${videoUrl}" allowfullscreen></iframe>`,
    width: videoWidth,
    height: videoHeight,
  };
}

function generateXmlData(oEmbedData) {
  const {
    type,
    version,
    title,
    author_name,
    author_url,
    provider_name,
    provider_url,
    thumbnail_url,
    thumbnail_width,
    thumbnail_height,
    html,
    width,
    height,
  } = oEmbedData;

  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<oembed>' +
    `<type>${type}</type>` +
    `<version>${version}</version>` +
    `<title>${title}</title>` +
    `<author_name>${author_name}</author_name>` +
    `<author_url>${author_url}</author_url>` +
    `<provider_name>${provider_name}</provider_name>` +
    `<provider_url>${provider_url}</provider_url>` +
    `<thumbnail_url>${thumbnail_url}</thumbnail_url>` +
    `<thumbnail_width>${thumbnail_width}</thumbnail_width>` +
    `<thumbnail_height>${thumbnail_height}</thumbnail_height>` +
    `<html>${html}</html>` +
    `<width>${width}</width>` +
    `<height>${height}</height>` +
    '<oembed>'
  );
}

async function getOEmbed(ctx) {
  const requestUrl = ctx.request.url;
  const urlQuery = getParameterByName('url', requestUrl);

  const { claim, error } = await getClaim(urlQuery);
  if (error) return error;

  const oEmbedData = generateOEmbedData(claim);

  const formatQuery = getParameterByName('format', requestUrl);
  if (formatQuery === 'xml') {
    ctx.set('Content-Type', 'application/xml');
    const xmlData = generateXmlData(oEmbedData);

    return xmlData;
  }

  ctx.set('Content-Type', 'application/json');
  return oEmbedData;
}

module.exports = { getOEmbed };
