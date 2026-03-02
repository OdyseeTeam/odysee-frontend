#!/usr/bin/env node
const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function ok(cond, msg) {
  if (cond) {
    console.log(`✔ ${msg}`);
  } else {
    console.log(`✘ ${msg}`);
  }
  return !!cond;
}

async function checkManifest(base) {
  const url = `${base}/.well-known/farcaster.json`;
  const res = await fetchUrl(url);
  const is200 = ok(res.status === 200, `Manifest HTTP 200 (${url})`);
  let json;
  try {
    json = JSON.parse(res.body);
    ok(true, 'Manifest JSON valid');
  } catch (e) {
    ok(false, 'Manifest JSON valid');
    return { passed: false };
  }

  const frame = json.frame;
  const hasFrame = ok(!!frame, 'Manifest contains frame object');
  const hasReqFields = ok(
    !!(frame && frame.version && frame.name && frame.iconUrl && frame.homeUrl),
    'Frame has required fields (version,name,iconUrl,homeUrl)'
  );

  let assocOk = true;
  if (json.accountAssociation) {
    try {
      const payloadStr = Buffer.from(json.accountAssociation.payload, 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      assocOk = ok(
        payload.domain && (base.includes(payload.domain) || payload.domain === base.replace(/^https?:\/\//, '')),
        'AccountAssociation payload.domain matches domain'
      );
    } catch (e) {
      assocOk = ok(false, 'AccountAssociation payload parsing');
    }
  } else {
    console.log('ℹ accountAssociation missing (optional, recommended)');
  }

  return { passed: is200 && hasFrame && hasReqFields && assocOk };
}

function extractMeta(body, name) {
  // Find the specific meta tag first, then extract content attr allowing JSON quotes
  const tagRegex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  const tagMatch = body.match(tagRegex);
  if (!tagMatch) return null;
  const tag = tagMatch[0];
  const single = tag.match(/content='([^']*)'/i);
  if (single) return single[1];
  const dbl = tag.match(/content="([^"]*)"/i);
  if (dbl) return dbl[1];
  return null;
}

async function checkEmbed(pageUrl) {
  const res = await fetchUrl(pageUrl);
  const is200 = ok(res.status === 200, `Page HTTP 200 (${pageUrl})`);
  const mini = extractMeta(res.body, 'fc:miniapp');
  const hasMini = ok(!!mini, 'fc:miniapp meta present');
  let parsed;
  try {
    const htmlDecode = (s) =>
      s
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    const decoded = mini ? htmlDecode(mini) : null;
    parsed = decoded && JSON.parse(decoded);
    ok(true, 'fc:miniapp content is valid JSON');
  } catch (e) {
    ok(false, 'fc:miniapp content is valid JSON');
    if (mini) {
      console.log('Raw fc:miniapp content:');
      console.log(mini);
    }
  }

  let imgOk = false;
  if (parsed && parsed.imageUrl) {
    const imgRes = await fetchUrl(parsed.imageUrl);
    imgOk = ok(imgRes.status === 200, 'imageUrl returns 200');
  } else {
    console.log('✘ imageUrl missing');
  }

  let actionOk = false;
  let actionUrl = null;
  if (parsed && parsed.button && parsed.button.action) {
    const a = parsed.button.action;
    actionOk = ok(a.type === 'launch_frame', 'action.type = launch_frame');
    ok((parsed.button.title || '').length <= 32, 'button.title length ≤ 32');
    actionUrl = a.url || null;
    if (actionUrl) {
      console.log(`Action URL: ${actionUrl}`);
      const isEmbed = /\/(%24|\$)\/embed\//.test(actionUrl);
      ok(isEmbed, 'action.url uses /$/embed/ path');
      try {
        const aRes = await fetchUrl(actionUrl);
        ok(aRes.status === 200, 'action.url returns 200');
      } catch (e) {
        ok(false, 'action.url fetchable');
      }
    } else {
      console.log('ℹ action.url not provided; client may default to current URL');
    }
  } else {
    console.log('✘ button.action missing');
  }

  return { passed: is200 && hasMini && !!parsed && imgOk && actionOk };
}

async function main() {
  const base = process.argv[2] || 'https://kp.odysee.tv';
  const path = process.argv[3] || '/';
  const pageUrl = base.replace(/\/$/, '') + path;

  console.log(`Checking manifest for ${base}`);
  const m = await checkManifest(base);
  console.log('');
  console.log(`Checking embed for ${pageUrl}`);
  const e = await checkEmbed(pageUrl);

  const passed = m.passed && e.passed;
  console.log('');
  if (passed) {
    console.log('All Farcaster Mini App checks passed.');
    process.exit(0);
  } else {
    console.log('Some checks failed. See details above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
