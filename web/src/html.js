const {
  FAVICON,
  OG_HOMEPAGE_TITLE,
  OG_IMAGE_URL,
  OG_TITLE_SUFFIX,
  PROXY_URL,
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  FARCASTER_ICON_URL,
  SITE_NAME,
  SITE_TITLE,
  URL,
} = require('../../config.js');
const {
  generateEmbedUrlEncoded,
  getParameterByName,
  getThumbnailCardCdnUrl,
  escapeHtmlProperty,
  unscapeHtmlProperty,
} = require('../../ui/util/web');
const { fetchStreamUrl } = require('./fetchStreamUrl');
const { lbryProxy: Lbry } = require('../lbry');
const { getHomepageJsonV1 } = require('./getHomepageJSON');
const { buildURI, parseURI, normalizeClaimUrl } = require('./lbryURI');
const fs = require('fs');
const PAGES = require('../../ui/constants/pages');
const path = require('path');
const removeMd = require('remove-markdown');
const { buildGoogleVideoMetadata } = require('./metadata/googleVideo');

Lbry.setDaemonConnectionString(PROXY_URL);

const BEGIN_STR = '<!-- VARIABLE_HEAD_BEGIN -->';
const FINAL_STR = '<!-- VARIABLE_HEAD_END -->';
const DOUBLE_TAB = '    ';

// ****************************************************************************
// Helpers
// ****************************************************************************

function insertToHead(fullHtml, htmlToInsert, buildRev = '') {
  const beginIndex = fullHtml.indexOf(BEGIN_STR);
  const finalIndex = fullHtml.indexOf(FINAL_STR);

  if (beginIndex > -1 && finalIndex > -1 && finalIndex > beginIndex) {
    const uiScript = buildRev ? `<script src="/public/ui-${buildRev}.js" defer></script>` : '';

    return (
      `${fullHtml.slice(0, beginIndex)}` +
      `${htmlToInsert || buildOgMetadata()}\n` +
      `${DOUBLE_TAB}` +
      `${uiScript}` +
      `${fullHtml.slice(finalIndex + FINAL_STR.length)}`
    );
  }
}

function truncateDescription(description, maxChars = 200) {
  description = description.trim().split('\n');
  description = description[0].trim();

  const chars = [...description];
  // Use slice array instead of substring to prevent breaking emojis
  let truncated = chars.slice(0, maxChars).join('');
  return chars.length > maxChars ? truncated + '...' : truncated;
}

function getCategoryMeta(path) {
  const homepage = getHomepageJsonV1();

  if (path === `/$/${PAGES.WILD_WEST}` || path === `/$/${PAGES.WILD_WEST}/`) {
    return {
      title: 'Wild West',
      description: 'Boosted by user credits, this is what the community promotes on Odysee',
      image: 'https://player.odycdn.com/speech/category-wildwest:1.jpg',
    };
  } else if (homepage && homepage.en) {
    const data = Object.values(homepage.en).find((x) => path === `/$/${x.name}` || path === `/$/${x.name}/`);
    if (data) {
      return {
        title: data.label,
        description: data.description,
        image: data.image,
      };
    }
  }

  return null;
}

function buildFarcasterEmbedScripts(options = {}) {
  const { requireIframe } = options;
  const iframeCheck = requireIframe ? '\n  if (window.self === window.top) return;' : '';
  return `<script src="https://cdn.jsdelivr.net/npm/@farcaster/miniapp-sdk/dist/index.min.js"></script>
<script>
(function() {${iframeCheck}
  function signalReady() {
    try {
      var sdk = (window.miniapp && window.miniapp.sdk) || window.sdk || (window.frame && window.frame.sdk);
      if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
        sdk.actions.ready();
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  var attempts = 0;
  var maxAttempts = 50;
  var checkAndSignal = setInterval(function() {
    attempts++;
    if (signalReady()) {
      clearInterval(checkAndSignal);
    } else if (attempts >= maxAttempts) {
      clearInterval(checkAndSignal);
      try {
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage({ type: 'miniapp-ready-timeout' }, '*');
        }
      } catch (e) {}
    }
  }, 100);
})();
</script>`;
}

//
// Normal metadata with option to override certain values
//
function buildOgMetadata(overrideOptions = {}) {
  const { title, description, image, path, urlQueryString, baseUrl, fcActionUrl, isEmbed } = overrideOptions;
  const BASE = baseUrl || URL;
  const cleanDescription = escapeHtmlProperty(removeMd(description || SITE_DESCRIPTION));
  const cleanTitle = escapeHtmlProperty(title);
  const url = (path ? `${BASE}${path}` : BASE) + (urlQueryString ? `?${urlQueryString}` : '');

  const head =
    `<title>${SITE_TITLE}</title>\n` +
    `<meta name="description" content="${cleanDescription}" />\n` +
    `<meta name="theme-color" content="#ca004b">\n` +
    `<meta property="og:url" content="${url}" />\n` +
    `<meta property="og:title" content="${cleanTitle || OG_HOMEPAGE_TITLE || SITE_TITLE}" />\n` +
    `<meta property="og:site_name" content="${SITE_NAME || SITE_TITLE}"/>\n` +
    `<meta property="og:description" content="${cleanDescription}" />\n` +
    `<meta property="og:image" content="${
      getThumbnailCardCdnUrl(image) || OG_IMAGE_URL || `${BASE}/public/v2-og.png`
    }" />\n` +
    `<meta property="og:type" content="website"/>\n` +
    '<meta name="twitter:card" content="summary_large_image"/>\n' +
    `<meta name="twitter:title" content="${
      (cleanTitle && cleanTitle + ' ' + OG_TITLE_SUFFIX) || OG_HOMEPAGE_TITLE || SITE_TITLE
    }" />\n` +
    `<meta name="twitter:description" content="${cleanDescription}" />\n` +
    `<meta name="twitter:image" content="${
      getThumbnailCardCdnUrl(image) || OG_IMAGE_URL || `${BASE}/public/v2-og.png`
    }"/>\n` +
    '<meta property="fb:app_id" content="1673146449633983" />\n' +
    `<link rel="canonical" content="${SITE_CANONICAL_URL || URL}"/>` +
    `<link rel="search" type="application/opensearchdescription+xml" title="${
      SITE_NAME || SITE_TITLE
    }" href="${URL}/opensearch.xml">`;
  // Add Farcaster Mini App embed meta for generic pages
  const ogImageUrl = getThumbnailCardCdnUrl(image) || OG_IMAGE_URL || `${BASE}/public/v2-og.png`;
  const splashImageUrl = FARCASTER_ICON_URL || `https://odysee.com/public/favicon_128.png`;
  try {
    const miniApp = {
      version: '1',
      imageUrl: ogImageUrl,
      button: {
        title: 'Open on Odysee',
        action: {
          type: 'launch_miniapp',
          name: SITE_NAME || 'Odysee',
          url: fcActionUrl || url,
          splashImageUrl: splashImageUrl,
          splashBackgroundColor: '#ffffff',
        },
      },
    };
    const miniAppJson = JSON.stringify(miniApp);
    let out = head + `\n<meta name="fc:miniapp" content='${miniAppJson}'/>`;
    // Frames JSON (v2-style) for clients expecting fc:frame as an object
    const frameJsonGeneric = JSON.stringify({
      version: 'next',
      imageUrl: ogImageUrl,
      button: {
        title: 'Open on Odysee',
        action: {
          type: 'launch_frame',
          name: SITE_NAME || 'Odysee',
          url: fcActionUrl || url,
          splashImageUrl: splashImageUrl,
          splashBackgroundColor: '#ffffff',
        },
      },
    });
    out += `\n<meta name="fc:frame" content='${frameJsonGeneric}'/>`;
    // Legacy Frames meta (basic link action)
    out += `\n<meta name="fc:frame:image" content="${ogImageUrl}"/>`;
    out += `\n<meta name="fc:frame:button:1" content="Open on Odysee"/>`;
    out += `\n<meta name="fc:frame:button:1:action" content="link"/>`;
    out += `\n<meta name="fc:frame:button:1:target" content="${fcActionUrl || url}"/>`;

    // Load SDK for embed pages (always) or Farcaster-enabled pages (with iframe check)
    if (isEmbed) {
      out += '\n' + buildFarcasterEmbedScripts();
    } else if (fcActionUrl) {
      out += '\n' + buildFarcasterEmbedScripts({ requireIframe: true });
    }

    return out;
  } catch (e) {
    return head;
  }
}

function addPWA() {
  let head = '';
  head += '<link rel="manifest" href="/public/pwa/manifest.json"/>';
  head += '<link rel="apple-touch-icon" sizes="180x180" href="/public/pwa/icon-180.png">';
  head += `<script>
      window.addEventListener('load', function() {
        if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js")}
      });
    </script>`;
  return head;
}

function addFavicon() {
  let head = '';
  head += `<link rel="icon" type="image/png" href="${FAVICON || './public/favicon.png'}" />`;
  return head;
}

function buildHead() {
  return (
    `${BEGIN_STR}\n` +
    `${addFavicon()}\n` +
    `${addPWA()}\n` +
    `${buildOgMetadata()}\n` +
    `${DOUBLE_TAB}` +
    `${FINAL_STR}\n`
  );
}

function buildBasicOgMetadata(overrideOptions = {}) {
  const head = BEGIN_STR + addFavicon() + buildOgMetadata(overrideOptions) + FINAL_STR;
  return head;
}

//
// Metadata used for urls that need claim information
// Also has option to override defaults
//
async function buildClaimOgMetadata(uri, claim, overrideOptions = {}, referrerQuery) {
  // Initial setup for claim based og metadata
  const { userAgent, baseUrl, isEmbed } = overrideOptions;
  const BASE = baseUrl || URL;
  const { claimName } = parseURI(uri);
  const { meta, value, signing_channel } = claim;
  const fee = value && value.fee && (Number(value.fee.amount) || 0);
  const tags = value && value.tags;
  const media = value && (value.video || value.audio || value.image);
  const source = value && value.source;
  const channel = signing_channel && signing_channel.name;
  let thumbnail = value && value.thumbnail && value.thumbnail.url && getThumbnailCardCdnUrl(value.thumbnail.url);
  const mediaType = source && source.media_type;
  const mediaDuration = media && media.duration;
  const claimTitle = escapeHtmlProperty((value && value.title) || claimName);
  const releaseTime = (value && value.release_time) || (meta && meta.creation_timestamp) || 0;
  const isStream = claim && claim.value_type === 'stream';
  const liveStream = isStream && !source;
  const mediaHeight = (media && media.height) || '720';
  const mediaWidth = (media && media.width) || '1280';

  const claimDescription =
    value && value.description && value.description.length > 0
      ? escapeHtmlProperty(truncateDescription(value.description))
      : `View on ${SITE_NAME}: ${claimTitle}`;

  const claimLanguage =
    value && value.languages && value.languages.length > 0 ? escapeHtmlProperty(value.languages[0]) : 'en_US';

  let imageThumbnail;

  if (fee <= 0 && mediaType && mediaType.startsWith('image/')) {
    imageThumbnail = await fetchStreamUrl(claim.name, claim.claim_id);
  }

  let claimThumbnail =
    escapeHtmlProperty(thumbnail) ||
    getThumbnailCardCdnUrl(imageThumbnail) ||
    OG_IMAGE_URL ||
    `${URL}/public/v2-og.png`;
  if (userAgent && userAgent.includes('Discordbot')) {
    claimThumbnail = claimThumbnail.substring(claimThumbnail.lastIndexOf('https://'));
  }

  const getOgType = (streamType, liveStream) => {
    if (liveStream) return 'video.other';
    switch (streamType) {
      // https://ogp.me/?fbclid=IwAR0Dr3Rb3tw1W5wjFtuRMZfwewM2vlrSnNp-_ZKlvCzo5nKuX2TuTqt0kU8#types
      case 'video':
        return 'video.other';
      case 'audio':
        return 'music.song';
      default:
        return 'website';
    }
  };

  // Allow for overriding default claim based og metadata
  const title = overrideOptions.title || claimTitle;
  const description = overrideOptions.description || claimDescription;
  const cleanDescription = removeMd(description);
  const claimPath = `${BASE}/${claim.canonical_url.replace('lbry://', '').replace(/#/g, ':')}`;

  let head = '';

  head += `${addFavicon()}`;
  head += '<meta charset="utf8"/>';
  head += `<title>${title}</title>`;
  head += `<meta name="description" content="${cleanDescription}"/>`;

  if (tags && tags.length > 0) {
    head += `<meta name="keywords" content="${escapeHtmlProperty(tags.toString())}"/>`;
  }
  head += `<meta name="theme-color" content="#ca004b">`;

  head += `<meta property="og:description" content="${cleanDescription}"/>`;
  head += `<meta property="og:image" content="${claimThumbnail}"/>`;
  head += `<meta property="og:image:secure_url" content="${claimThumbnail}"/>`;
  head += `<meta property="og:image:width"  content="${mediaWidth}"/>`;
  head += `<meta property="og:image:height"  content="${mediaHeight}"/>`;
  head += `<meta property="og:locale" content="${claimLanguage}"/>`;
  head += `<meta property="og:site_name" content="${SITE_NAME}"/>`;
  head += `<meta property="og:type" content="${getOgType(value?.stream_type, liveStream)}"/>`;
  head += `<meta property="og:title" content="${title}"/>`;
  head += `<meta property="og:url" content="${claimPath}"/>`;

  head += `<link rel="canonical" content="${claimPath}"/>`;
  head += `<link rel="alternate" type="application/json+oembed" href="${BASE}/$/oembed?url=${encodeURIComponent(
    claimPath
  )}&format=json${referrerQuery ? `&r=${encodeURIComponent(referrerQuery)}` : ''}" title="${title}" />`;
  head += `<link rel="alternate" type="text/xml+oembed" href="${BASE}/$/oembed?url=${encodeURIComponent(
    claimPath
  )}&format=xml${referrerQuery ? `&r=${encodeURIComponent(referrerQuery)}` : ''}" title="${title}" />`;

  if ((mediaType && (mediaType.startsWith('video/') || mediaType.startsWith('audio/'))) || liveStream) {
    const videoUrl = generateEmbedUrlEncoded(claim.canonical_url);
    head += `<meta property="og:video" content="${videoUrl}" />`;
    head += `<meta property="og:video:secure_url" content="${videoUrl}" />`;
    head += `<meta property="og:video:type" content="text/html" />`;
    if (channel) {
      head += `<meta name="og:video:series" content="${channel}"/>`;
    }
    head += `<meta property="og:video:width" content="${mediaWidth}"/>`;
    head += `<meta property="og:video:height" content="${mediaHeight}"/>`;
    if (releaseTime) {
      var release = new Date(releaseTime * 1000).toISOString();
      head += `<meta property="og:video:release_date" content="${release}"/>`;
    }
    if (mediaDuration) {
      head += `<meta property="og:video:duration" content="${mediaDuration}"/>`;
    }

    head += `<meta name="twitter:title" content="${title}"/>`;
    head += `<meta name="twitter:image" content="${claimThumbnail}"/>`;
    head += `<meta name="twitter:player:image" content="${claimThumbnail}"/>`;
    head += `<meta name="twitter:site" content="@OdyseeTeam"/>`;
    head += `<meta name="twitter:url" content="${claimPath}"/>`;
    if (userAgent && userAgent.includes('Discordbot')) {
      head += `<meta name="twitter:card" content="summary_large_image"/>`;
    } else {
      head += `<meta name="twitter:card" content="player"/>`;
    }
    head += `<meta name="twitter:player" content="${videoUrl}" />`;
    head += `<meta name="twitter:player:width" content="${mediaWidth}">`;
    head += `<meta name="twitter:player:height" content="${mediaHeight}">`;
    head += `<meta property="fb:app_id" content="1673146449633983" />`;
  } else {
    head += `<meta name="twitter:card" content="summary_large_image"/>`;
  }

  // Farcaster: Mini App embed meta
  try {
    const splashImageUrl = FARCASTER_ICON_URL || `https://odysee.com/public/favicon_128.png`;
    // Use a literal, unencoded embed URL (clients seem to prefer this format)
    const embedUriPath = claim.canonical_url.replace('lbry://', '').replace(/#/g, ':');
    const embedUrl = `${BASE}/$/embed/${embedUriPath}`;
    const miniApp = {
      version: '1',
      imageUrl: claimThumbnail,
      button: {
        title: isStream ? 'Watch on Odysee' : 'Open on Odysee',
        action: {
          type: 'launch_miniapp',
          name: SITE_NAME,
          url: embedUrl,
          splashImageUrl: splashImageUrl,
          splashBackgroundColor: '#ffffff',
        },
      },
    };
    const miniAppJson = JSON.stringify(miniApp);
    head += `<meta name="fc:miniapp" content='${miniAppJson}'/>`;
    // Frames JSON (v2-style) for clients expecting fc:frame as an object
    const frameJson = JSON.stringify({
      version: 'next',
      imageUrl: claimThumbnail,
      button: {
        title: isStream ? 'Watch on Odysee' : 'Open on Odysee',
        action: {
          type: 'launch_frame',
          name: SITE_NAME,
          url: embedUrl,
          splashImageUrl: splashImageUrl,
          splashBackgroundColor: '#ffffff',
        },
      },
    });
    head += `<meta name="fc:frame" content='${frameJson}'/>`;
    // Legacy Frames meta (link + post button) for clients that still rely on v1 tags
    head += `<meta name="fc:frame:image" content="${claimThumbnail}"/>`;
    head += `<meta name="fc:frame:button:1" content="${isStream ? 'Watch on Odysee' : 'Open on Odysee'}"/>`;
    head += `<meta name="fc:frame:button:1:action" content="link"/>`;
    head += `<meta name="fc:frame:button:1:target" content="${embedUrl}"/>`;
    head += `<meta name="fc:frame:button:2" content="Next ▶"/>`;
    head += `<meta name="fc:frame:button:2:action" content="post"/>`;
    head += `<meta name="fc:frame:post_url" content="${BASE}/$/frame"/>`;

    // Only load SDK and ready script for actual embed pages
    if (isEmbed) {
      head += buildFarcasterEmbedScripts();
    }
  } catch (e) {
    console.error('MiniApp embed meta failed:', e);
  }
  return head;
}

function buildSearchPageHead(html, requestPath, queryStr) {
  const searchPageMetadata = buildOgMetadata({
    ...(queryStr
      ? {
          title: `"${queryStr}" Search Results`,
          description: `Find the best "${queryStr}" content on Odysee`,
          image: '', // TODO: get Search Page image
          urlQueryString: `q=${queryStr}`,
        }
      : {}),
    path: requestPath,
  });
  return insertToHead(html, searchPageMetadata);
}

function buildCategoryPageHead(html, requestPath, categoryMeta) {
  const categoryPageMetadata = buildOgMetadata({
    title: categoryMeta.title,
    description: categoryMeta.description,
    image: categoryMeta.image,
    path: requestPath,
  });
  return insertToHead(html, categoryPageMetadata);
}

async function resolveClaimOrRedirect(ctx, urlOrClaimId, ignoreRedirect = false) {
  let claim;

  const isClaimId = Boolean(urlOrClaimId?.match(/^[a-f0-9]{40}$/));
  if (isClaimId) {
    try {
      const claimId = urlOrClaimId;
      const response = await Lbry.claim_search({ claim_ids: [claimId] });
      if (response && response.items?.at(0) && !response.error) {
        claim = response.items[0];
        const isRepost = claim.reposted_claim && claim.reposted_claim.name && claim.reposted_claim.claim_id;
        if (isRepost && !ignoreRedirect) {
          ctx.redirect(`/${claim.reposted_claim.name}:${claim.reposted_claim.claim_id}`);
          return;
        }
      }
    } catch {}
  } else {
    try {
      const url = urlOrClaimId;
      const response = await Lbry.resolve({ urls: [url] });
      if (response && response[url] && !response[url].error) {
        claim = response && response[url];
        const isRepost = claim.reposted_claim && claim.reposted_claim.name && claim.reposted_claim.claim_id;
        if (isRepost && !ignoreRedirect) {
          ctx.redirect(`/${claim.reposted_claim.name}:${claim.reposted_claim.claim_id}`);
          return;
        }
      }
    } catch {}
  }
  return claim;
}

// ****************************************************************************
// getHtml
// ****************************************************************************

let html;
async function getHtml(ctx) {
  if (!html) {
    html = fs.readFileSync(path.join(__dirname, '/../dist/index.html'), 'utf8');
  }

  const query = ctx.query;
  const requestPath = unscapeHtmlProperty(decodeURIComponent(ctx.path));

  if (requestPath === '/' || requestPath.length === 0) {
    // Keep basic OG for non-Farcaster while setting Mini App action to homepage embed
    // Use current origin to avoid pointing to production URL in dev.
    const homeFcActionUrl = `${ctx.origin}/$/embed/home`;
    let ogMetadata = buildBasicOgMetadata({ baseUrl: ctx.origin, fcActionUrl: homeFcActionUrl });
    return insertToHead(html, ogMetadata);
  }

  if (ctx?.request?.url) {
    ctx.request.url = encodeURIComponent(escapeHtmlProperty(decodeURIComponent(ctx.request.url)));
  }

  const userAgent = ctx && ctx.request && ctx.request.header ? ctx.request.header['user-agent'] : undefined;

  const invitePath = `/$/${PAGES.INVITE}/`;
  const embedPath = `/$/${PAGES.EMBED}/`;
  const playlistPath = `/$/${PAGES.PLAYLIST}/`;

  if (requestPath.includes(invitePath)) {
    try {
      const inviteChannel = requestPath.slice(invitePath.length);
      const inviteChannelUrl = normalizeClaimUrl(inviteChannel);
      const claim = await resolveClaimOrRedirect(ctx, inviteChannelUrl);
      const invitePageMetadata = await buildClaimOgMetadata(inviteChannelUrl, claim, {
        title: `Join ${claim.name} on ${SITE_NAME}`,
        description: `Join ${claim.name} on ${SITE_NAME}, a content wonderland owned by everyone (and no one).`,
        userAgent: userAgent,
        baseUrl: ctx.origin,
      });

      return insertToHead(html, invitePageMetadata);
    } catch (e) {
      // Something about the invite channel is messed up
      // Enter generic invite metadata
      const invitePageMetadata = buildOgMetadata({
        title: `Join a friend on ${SITE_NAME}`,
        description: `Join a friend on ${SITE_NAME}, a content wonderland owned by everyone (and no one).`,
        baseUrl: ctx.origin,
      });
      return insertToHead(html, invitePageMetadata);
    }
  }

  if (requestPath.includes(embedPath)) {
    // Special-case: homepage embed (early) only when enabled
    if (requestPath === '/$/embed/home' || requestPath === '/$/embed/home/') {
      const ogMetadata = buildOgMetadata({
        baseUrl: ctx.origin,
        fcActionUrl: `${ctx.origin}/$/embed/home`,
        isEmbed: true,
      });
      return insertToHead(html, ogMetadata);
    }

    // Special-case: playlist embed - redirect to first item with lid parameter
    const embedPlaylistMatch = requestPath.match(/\/\$\/embed\/playlist\/([a-f0-9]{40})/i);
    if (embedPlaylistMatch) {
      const collectionClaimId = embedPlaylistMatch[1];
      const collectionClaim = await resolveClaimOrRedirect(ctx, collectionClaimId, true);

      if (collectionClaim) {
        const firstItemClaimId = collectionClaim.value?.claims?.[0];
        if (firstItemClaimId) {
          try {
            const response = await Lbry.claim_search({ claim_ids: [firstItemClaimId] });
            if (response && response.items?.at(0) && !response.error) {
              const firstItemClaim = response.items[0];
              const firstItemPath = firstItemClaim.canonical_url?.replace('lbry://', '/')?.replace(/#/g, ':');
              const fcActionUrl = `${ctx.origin}/$/embed${firstItemPath}?lid=${collectionClaimId}`;

              const ogMetadata = await buildClaimOgMetadata(firstItemClaim.canonical_url, firstItemClaim, {
                userAgent: userAgent,
                baseUrl: ctx.origin,
                isEmbed: true,
                fcActionUrl: fcActionUrl,
              });
              const googleVideoMetadata = await buildGoogleVideoMetadata(firstItemClaim.canonical_url, firstItemClaim);
              return insertToHead(html, ogMetadata.concat('\n', googleVideoMetadata));
            }
          } catch {}
        }
      }

      return insertToHead(html);
    }

    // Otherwise, try to resolve an embed claim
    const claimUri = normalizeClaimUrl(requestPath.replace(embedPath, '').replace('/', '#'));
    const claim = await resolveClaimOrRedirect(ctx, claimUri, true);

    if (claim) {
      const ogMetadata = await buildClaimOgMetadata(claimUri, claim, {
        userAgent: userAgent,
        baseUrl: ctx.origin,
        isEmbed: true,
      });
      const googleVideoMetadata = await buildGoogleVideoMetadata(claimUri, claim);
      return insertToHead(html, ogMetadata.concat('\n', googleVideoMetadata));
    }

    return insertToHead(html);
  }

  if (requestPath.includes(playlistPath)) {
    const collectionClaimId = requestPath.match(/[a-f0-9]{40}/)?.at(0);
    const collectionClaim = await resolveClaimOrRedirect(ctx, collectionClaimId, true);

    if (collectionClaim) {
      // Get first item in the collection
      const firstItemClaimId = collectionClaim.value?.claims?.[0];
      let firstItemClaim = null;
      let fcActionUrl = null;

      if (firstItemClaimId) {
        try {
          const response = await Lbry.claim_search({ claim_ids: [firstItemClaimId] });
          if (response && response.items?.at(0) && !response.error) {
            firstItemClaim = response.items[0];
            // Build fcActionUrl pointing to the first item's embed with lid parameter
            const firstItemPath = firstItemClaim.canonical_url?.replace('lbry://', '/')?.replace(/#/g, ':');
            fcActionUrl = `${ctx.origin}/$/embed${firstItemPath}?lid=${collectionClaimId}`;
          }
        } catch {}
      }

      // Use first item for OG metadata if available, otherwise fall back to collection
      const metadataClaim = firstItemClaim || collectionClaim;
      const metadataUri = firstItemClaim?.canonical_url || collectionClaim.canonical_url;

      const ogMetadata = await buildClaimOgMetadata(metadataUri, metadataClaim, {
        userAgent: userAgent,
        baseUrl: ctx.origin,
        fcActionUrl: fcActionUrl,
      });
      return insertToHead(html, ogMetadata);
    }

    return insertToHead(html);
  }

  const categoryMeta = getCategoryMeta(requestPath);
  if (categoryMeta) {
    return buildCategoryPageHead(html, requestPath, categoryMeta);
  }

  if (requestPath === `/$/${PAGES.SEARCH}` || requestPath === `/$/${PAGES.SEARCH}/`) {
    return buildSearchPageHead(html, requestPath, encodeURIComponent(escapeHtmlProperty(query.q)));
  }

  if (!requestPath.includes('$')) {
    let parsedUri, claimUri;

    try {
      parsedUri = parseURI(normalizeClaimUrl(requestPath.slice(1)));
      claimUri = buildURI({ ...parsedUri, startTime: undefined }, true);
    } catch (err) {
      ctx.status = 404;
      return err.message;
    }

    const claim = await resolveClaimOrRedirect(ctx, claimUri);
    const referrerQuery = escapeHtmlProperty(getParameterByName('r', ctx.request.url));

    if (claim) {
      const ogMetadata = await buildClaimOgMetadata(
        claimUri,
        claim,
        {
          userAgent: userAgent,
          baseUrl: ctx.origin,
        },
        referrerQuery
      );
      const googleVideoMetadata = await buildGoogleVideoMetadata(claimUri, claim);
      return insertToHead(html, ogMetadata.concat('\n', googleVideoMetadata));
    }
  }

  const ogMetadataAndPWA = buildHead();
  return insertToHead(html, ogMetadataAndPWA);
}

module.exports = { insertToHead, buildHead, getHtml };
