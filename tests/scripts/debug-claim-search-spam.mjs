/**
 * Debug script: captures claim_search requests on homepage to identify spam loop.
 * Run: node tests/scripts/debug-claim-search-spam.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:1337';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = [];
  let consoleWarnings = [];

  // Capture all claim_search proxy requests
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/proxy') || req.url().includes('comments.odysee.tv')) {
      const postData = req.postData();
      if (postData) {
        try {
          const body = JSON.parse(postData);
          const method = body.method;
          if (method === 'claim_search' || method === 'moderation.AmI' || method === 'resolve') {
            requests.push({
              time: Date.now(),
              method,
              params: method === 'claim_search' ? body.params : undefined,
            });
          }
        } catch {}
      }
    }
  });

  // Capture console warnings about notifications
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Unhandled notification_rule') || text.includes('input selector returned')) {
      consoleWarnings.push({ time: Date.now(), text: text.substring(0, 200) });
    }
  });

  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Wait 15 seconds and collect
  console.log('Collecting requests for 15 seconds...');
  await page.waitForTimeout(15000);

  // Print summary
  console.log('\n=== CLAIM_SEARCH REQUESTS ===');
  const claimSearches = requests.filter((r) => r.method === 'claim_search');
  console.log(`Total claim_search calls: ${claimSearches.length}`);

  // Group by params to see duplicates
  const byParams = {};
  claimSearches.forEach((r) => {
    const key = JSON.stringify(r.params);
    if (!byParams[key]) byParams[key] = [];
    byParams[key].push(r.time);
  });

  Object.entries(byParams).forEach(([params, times]) => {
    console.log(`\n  ${times.length}x: ${params.substring(0, 200)}`);
    if (times.length > 2) {
      const deltas = times.slice(1).map((t, i) => t - times[i]);
      console.log(`    Intervals (ms): ${deltas.join(', ')}`);
    }
  });

  console.log('\n=== MODERATION REQUESTS ===');
  const modRequests = requests.filter((r) => r.method === 'moderation.AmI');
  console.log(`Total moderation.AmI calls: ${modRequests.length}`);

  console.log('\n=== CONSOLE WARNINGS ===');
  const uniqueWarnings = [...new Set(consoleWarnings.map((w) => w.text))];
  uniqueWarnings.forEach((w) => {
    const count = consoleWarnings.filter((cw) => cw.text === w).length;
    console.log(`  ${count}x: ${w}`);
  });

  console.log('\n=== RESOLVE REQUESTS ===');
  const resolves = requests.filter((r) => r.method === 'resolve');
  console.log(`Total resolve calls: ${resolves.length}`);

  await browser.close();
}

main().catch(console.error);
