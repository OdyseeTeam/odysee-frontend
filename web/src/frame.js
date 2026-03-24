const { URL, PROXY_URL, OG_IMAGE_URL } = require('../../config.js');
const { lbryProxy: Lbry } = require('../lbry');
const { getThumbnailCardCdnUrl } = require('../../ui/util/web');

Lbry.setDaemonConnectionString(PROXY_URL);

async function getChannelLatestUploads(channelClaimId, pageSize = 5) {
  try {
    const search = await Lbry.claim_search({
      channel_ids: [channelClaimId],
      page: 1,
      page_size: pageSize,
      order_by: ['release_time'],
      no_totals: true,
    });
    return search?.items || [];
  } catch (e) {
    return [];
  }
}

function buildFrameResponse({ image, buttons, postUrl, aspectRatio = '1.91:1' }) {
  // Basic JSON response for vNext-like frame clients
  return {
    version: '1',
    image,
    buttons,
    post_url: postUrl,
    aspect_ratio: aspectRatio,
  };
}

async function handleFramePost(ctx) {
  // Expect a JSON payload containing context and (optionally) state
  const body = ctx.request.body || {};
  const { claimUrl, channelId, index } = body.state || {};
  const nextIndex = typeof index === 'number' ? index + 1 : 0;

  let channelClaimId = channelId;
  let currentClaimUrl = claimUrl;

  if (!channelClaimId && currentClaimUrl) {
    try {
      const response = await Lbry.resolve({ urls: [currentClaimUrl] });
      const claim = response && response[currentClaimUrl];
      channelClaimId = claim?.signing_channel?.claim_id;
    } catch (e) {}
  }

  let items = [];
  if (channelClaimId) {
    items = await getChannelLatestUploads(channelClaimId, 5);
  }

  // Fallback: use current claim as the only item
  if (!items.length && currentClaimUrl) {
    try {
      const response = await Lbry.resolve({ urls: [currentClaimUrl] });
      const claim = response && response[currentClaimUrl];
      if (claim) items = [claim];
    } catch (e) {}
  }

  const item = items.length ? items[nextIndex % items.length] : undefined;

  let image = OG_IMAGE_URL || `${URL}/public/v2-og.png`;
  let targetUrl = URL;
  let channelUrl = URL;

  if (item) {
    const value = item.value;
    const thumb = value?.thumbnail?.url && getThumbnailCardCdnUrl(value.thumbnail.url);
    image = thumb || image;
    const odyUrl = `${URL}/${item.canonical_url.replace('lbry://', '').replace(/#/g, ':')}`;
    targetUrl = odyUrl;
    const chan = item.signing_channel;
    if (chan) {
      channelUrl = `${URL}/${chan.canonical_url.replace('lbry://', '').replace(/#/g, ':')}`;
    }
  }

  const buttons = [
    { label: 'Watch on Odysee', action: 'link', target: targetUrl },
    { label: 'More from Creator', action: 'link', target: channelUrl },
    { label: 'Next ▶', action: 'post' },
  ];

  const response = buildFrameResponse({
    image,
    buttons,
    postUrl: `${URL}/$/frame`,
  });

  // Include server-side state for the next turn
  response.state = {
    claimUrl: currentClaimUrl || (item && `lbry://${item.name}#${item.claim_id}`) || undefined,
    channelId: channelClaimId || item?.signing_channel?.claim_id || undefined,
    index: nextIndex,
  };

  ctx.set('Content-Type', 'application/json');
  ctx.body = JSON.stringify(response);
}

module.exports = { handleFramePost };
