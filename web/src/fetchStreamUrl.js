const Mime = require('mime-types');

const { PLAYER_SERVER, URL: SITE_URL } = require('../../config.cjs');

const { lbryProxy: Lbry } = require('../lbry');

const { buildURI } = require('./lbryURI');

const EXTRA_PATH_SEGMENT_CHARS = /['()]/g;
const FALLBACK_SOURCE_FILENAME = 'stream';
const SOURCE_HASH_FILENAME_LENGTH = 6;

function encodePathSegmentCharacter(character) {
  return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value ?? '')).replace(EXTRA_PATH_SEGMENT_CHARS, encodePathSegmentCharacter);
}

function getSourceFilename(claim) {
  const source = claim?.value?.source;
  const filename = source?.sd_hash ? source.sd_hash.slice(0, SOURCE_HASH_FILENAME_LENGTH) : FALLBACK_SOURCE_FILENAME;
  const extension = source?.media_type ? Mime.extension(source.media_type) : null;

  return extension ? `${filename}.${extension}` : filename;
}

async function fetchStreamUrl(claimName, claimId) {
  const uri = buildURI({
    streamName: claimName,
    streamClaimId: claimId,
  });
  return await Lbry.get({
    uri,
  })
    .then(({ streaming_url }) => streaming_url)
    .catch((error) => {
      return '';
    });
}

/**
 * Direct URL to the content's bits without redirects.
 *
 * Move back to 'utils/web' when `fetchStreamUrl` is no longer needed.
 *
 * @param claim
 */
function generateContentUrl(claim) {
  const streamUrl = (claim) => {
    // Hardcoded version of fetchStreamUrl().
    return `${PLAYER_SERVER}/api/v3/streams/free/${claim.name}/${claim.claim_id}`;
  };

  const value = claim?.value;

  if (value?.source?.media_type && value?.source?.sd_hash) {
    const fileExt = `.${Mime.extension(value.source.media_type)}`;
    const sdHash = value.source.sd_hash.slice(0, 6);
    return `${streamUrl(claim)}/${sdHash}${fileExt}`;
  }

  return streamUrl(claim);
}

function generateDownloadUrl(claim) {
  const value = claim?.value;

  if (value?.source?.media_type && value?.source?.sd_hash) {
    const fileExt = `.${Mime.extension(value.source.media_type)}`;
    const sdHash = value.source.sd_hash.slice(0, 6);
    return `${PLAYER_SERVER}/v6/streams/${claim.claim_id}/${sdHash}${fileExt}`;
  }

  return `${PLAYER_SERVER}/v6/streams/${claim.claim_id}`;
}

function generateRssContentUrl(claim) {
  const siteURL = String(SITE_URL || '').replace(/\/$/, '');
  return `${siteURL}/$/rss/media/${encodePathSegment(claim.name)}/${encodePathSegment(
    claim.claim_id
  )}/${encodePathSegment(getSourceFilename(claim))}`;
}

module.exports = {
  fetchStreamUrl,
  generateContentUrl,
  generateDownloadUrl,
  generateRssContentUrl,
};
