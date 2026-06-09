const Mime = require('mime-types');

const { PLAYER_SERVER } = require('../../config.cjs');

const { buildURI } = require('./lbryURI');
const { hyperbeamNodeMediaUrl, resolveHyperbeamNodeUri } = require('./odyseeHyperbeamNode');

async function fetchStreamUrl(claimName, claimId) {
  const uri = buildURI({
    claimName,
    claimId,
  });
  const nodeResponse = await resolveHyperbeamNodeUri(uri).catch(() => null);

  if (nodeResponse?.media?.status === 'available') {
    return hyperbeamNodeMediaUrl(uri);
  }

  return '';
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

function generateHyperbeamNodeContentUrl(claim) {
  const uri = claim?.canonical_url || claim?.permanent_url;
  return uri ? hyperbeamNodeMediaUrl(uri) : '';
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

module.exports = {
  fetchStreamUrl,
  generateContentUrl,
  generateHyperbeamNodeContentUrl,
  generateDownloadUrl,
};
