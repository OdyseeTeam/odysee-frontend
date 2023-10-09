const {
  FAVICON,
  OG_HOMEPAGE_TITLE,
  OG_IMAGE_URL,
  OG_TITLE_SUFFIX,
  PROXY_URL,
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
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

//
// Normal metadata with option to override certain values
//
function buildOgMetadata(overrideOptions = {}) {
  const { title, description, image, path, urlQueryString } = overrideOptions;
  const cleanDescription = escapeHtmlProperty(removeMd(description || SITE_DESCRIPTION));
  const cleanTitle = escapeHtmlProperty(title);
  const url = (path ? `${URL}${path}` : URL) + (urlQueryString ? `?${urlQueryString}` : '');

  const head =
    `<title>${SITE_TITLE}</title>\n` +
    `<meta name="description" content="${cleanDescription}" />\n` +
    `<meta name="theme-color" content="#ca004b">\n` +
    `<meta property="og:url" content="${url}" />\n` +
    `<meta property="og:title" content="${cleanTitle || OG_HOMEPAGE_TITLE || SITE_TITLE}" />\n` +
    `<meta property="og:site_name" content="${SITE_NAME || SITE_TITLE}"/>\n` +
    `<meta property="og:description" content="${cleanDescription}" />\n` +
    `<meta property="og:image" content="${
      getThumbnailCardCdnUrl(image) || getThumbnailCardCdnUrl(OG_IMAGE_URL) || `${URL}/public/v2-og.png`
    }" />\n` +
    `<meta property="og:type" content="website"/>\n` +
    '<meta name="twitter:card" content="summary_large_image"/>\n' +
    `<meta name="twitter:title" content="${
      (cleanTitle && cleanTitle + ' ' + OG_TITLE_SUFFIX) || OG_HOMEPAGE_TITLE || SITE_TITLE
    }" />\n` +
    `<meta name="twitter:description" content="${cleanDescription}" />\n` +
    `<meta name="twitter:image" content="${
      getThumbnailCardCdnUrl(image) || getThumbnailCardCdnUrl(OG_IMAGE_URL) || `${URL}/public/v2-og.png`
    }"/>\n` +
    '<meta property="fb:app_id" content="1673146449633983" />\n' +
    `<link rel="canonical" content="${SITE_CANONICAL_URL || URL}"/>` +
    `<link rel="search" type="application/opensearchdescription+xml" title="${
      SITE_NAME || SITE_TITLE
    }" href="${URL}/opensearch.xml">`;
  return head;
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

function buildBasicOgMetadata() {
  const head = BEGIN_STR + addFavicon() + buildOgMetadata() + FINAL_STR;
  return head;
}

//
// Metadata used for urls that need claim information
// Also has option to override defaults
//
async function buildClaimOgMetadata(uri, claim, overrideOptions = {}, referrerQuery) {
  // Initial setup for claim based og metadata
  const { userAgent } = overrideOptions;
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
      : `View ${claimTitle} on ${SITE_NAME}`;

  const claimLanguage =
    value && value.languages && value.languages.length > 0 ? escapeHtmlProperty(value.languages[0]) : 'en_US';

  let imageThumbnail;

  if (fee <= 0 && mediaType && mediaType.startsWith('image/')) {
    imageThumbnail = await fetchStreamUrl(claim.name, claim.claim_id);
  }

  let claimThumbnail =
    escapeHtmlProperty(thumbnail) ||
    getThumbnailCardCdnUrl(imageThumbnail) ||
    getThumbnailCardCdnUrl(OG_IMAGE_URL) ||
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
  const claimPath = `${URL}/${claim.canonical_url.replace('lbry://', '').replace(/#/g, ':')}`;

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
  head += `<link rel="alternate" type="application/json+oembed" href="${URL}/$/oembed?url=${encodeURIComponent(
    claimPath
  )}&format=json${referrerQuery ? `&r=${encodeURIComponent(referrerQuery)}` : ''}" title="${title}" />`;
  head += `<link rel="alternate" type="text/xml+oembed" href="${URL}/$/oembed?url=${encodeURIComponent(
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

async function resolveClaimOrRedirect(ctx, url, ignoreRedirect = false) {
  let claim;
  try {
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

  if (requestPath.length === 0) {
    const ogMetadata = buildBasicOgMetadata();
    return insertToHead(html, ogMetadata);
  }

  if (ctx?.request?.url) {
    ctx.request.url = encodeURIComponent(escapeHtmlProperty(decodeURIComponent(ctx.request.url)));
  }

  const userAgent = ctx && ctx.request && ctx.request.header ? ctx.request.header['user-agent'] : undefined;

  const invitePath = `/$/${PAGES.INVITE}/`;
  const embedPath = `/$/${PAGES.EMBED}/`;

  if (requestPath.includes(invitePath)) {
    try {
      const inviteChannel = requestPath.slice(invitePath.length);
      const inviteChannelUrl = normalizeClaimUrl(inviteChannel);
      const claim = await resolveClaimOrRedirect(ctx, inviteChannelUrl);
      const invitePageMetadata = await buildClaimOgMetadata(inviteChannelUrl, claim, {
        title: `Join ${claim.name} on ${SITE_NAME}`,
        description: `Join ${claim.name} on ${SITE_NAME}, a content wonderland owned by everyone (and no one).`,
        userAgent: userAgent,
      });

      return insertToHead(html, invitePageMetadata);
    } catch (e) {
      // Something about the invite channel is messed up
      // Enter generic invite metadata
      const invitePageMetadata = buildOgMetadata({
        title: `Join a friend on ${SITE_NAME}`,
        description: `Join a friend on ${SITE_NAME}, a content wonderland owned by everyone (and no one).`,
      });
      return insertToHead(html, invitePageMetadata);
    }
  }

  if (requestPath.includes(embedPath)) {
    const claimUri = normalizeClaimUrl(requestPath.replace(embedPath, '').replace('/', '#'));
    const claim = await resolveClaimOrRedirect(ctx, claimUri, true);

    if (claim) {
      const ogMetadata = await buildClaimOgMetadata(claimUri, claim, {
        userAgent: userAgent,
      });
      const googleVideoMetadata = await buildGoogleVideoMetadata(claimUri, claim);
      return insertToHead(html, ogMetadata.concat('\n', googleVideoMetadata));
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
