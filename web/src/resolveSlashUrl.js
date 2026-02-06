const { lbryProxy: Lbry } = require('../lbry');

/**
 * Resolves ambiguous URLs that have "/" without "@".
 *
 * In LBRY URLs, "/" is always a channel/content separator (requiring @).
 * When we see "foo/bar" without "@", it could be:
 *   1) A name with claim ID: foo:bar (someone used "/" instead of ":")
 *   2) A malformed channel URL: @foo/bar (missing @ prefix, e.g., from Grok/Twitter)
 *
 * Priority:
 *   - If second part is exactly 40 hex chars (full claim ID), try name:claimid first
 *   - Otherwise, try @channel/content first
 *   - Falls back to the other interpretation if the first doesn't resolve
 *
 * @param {string} webPath - The web path without leading slash (e.g., "Creator/video-title")
 * @returns {Promise<{ claim: Object, uri: string, type: 'channel'|'claimid' } | null>}
 */
async function resolveSlashUrl(webPath) {
  const slashIdx = webPath.indexOf('/');
  if (slashIdx <= 0 || webPath.startsWith('@')) {
    return null;
  }

  const secondPart = webPath.substring(slashIdx + 1);
  const isHexClaimId = /^[0-9a-f]+$/.test(secondPart) && secondPart.length <= 40;
  const isFullClaimId = isHexClaimId && secondPart.length === 40;

  // If the second part is exactly 40 hex chars (full claim ID), prioritize name:claimid
  // interpretation since content names don't look like "ca00cbe17cb76...".
  if (isFullClaimId) {
    try {
      const fixedUri = `lbry://${webPath.substring(0, slashIdx)}#${secondPart}`;
      const response = await Lbry.resolve({ urls: [fixedUri] });
      if (response && response[fixedUri] && !response[fixedUri].error) {
        return { claim: response[fixedUri], uri: fixedUri, type: 'claimid' };
      }
    } catch {}
  }

  // Try as @channel/content (malformed URLs from Grok/Twitter)
  try {
    const withAtUri = `lbry://@${webPath}`;
    const response = await Lbry.resolve({ urls: [withAtUri] });
    if (response && response[withAtUri] && !response[withAtUri].error) {
      return { claim: response[withAtUri], uri: withAtUri, type: 'channel' };
    }
  } catch {}

  // Try as name#claimid (partial claim ID, or full ID that didn't resolve above)
  if (isHexClaimId && !isFullClaimId) {
    try {
      const fixedUri = `lbry://${webPath.substring(0, slashIdx)}#${secondPart}`;
      const response = await Lbry.resolve({ urls: [fixedUri] });
      if (response && response[fixedUri] && !response[fixedUri].error) {
        return { claim: response[fixedUri], uri: fixedUri, type: 'claimid' };
      }
    } catch {}
  }

  return null;
}

module.exports = { resolveSlashUrl };
