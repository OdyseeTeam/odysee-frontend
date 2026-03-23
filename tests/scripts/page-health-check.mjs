/**
 * Page health check: visits all major pages, captures errors, measures perf.
 * Run: node tests/scripts/page-health-check.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:1337';
const WAIT_MS = 6000;

const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Search', path: '/$/search?q=bitcoin' },
  { name: 'Channel (@Odysee)', path: '/@Odysee:8' },
  { name: 'Video (watch)', path: '/@veritasium:f/the-simplest-satisfying-proof:8' },
  { name: 'Playlists', path: '/$/playlists' },
  { name: 'Library', path: '/$/library' },
  { name: 'Uploads', path: '/$/uploads' },
  { name: 'Settings', path: '/$/settings' },
  { name: 'Notifications', path: '/$/notifications' },
  { name: 'Wallet', path: '/$/wallet' },
  { name: 'Discover', path: '/$/discover' },
  { name: 'Watch History', path: '/$/watch-history' },
];

async function checkPage(page, { name, path }) {
  const errors = [];
  const warnings = [];
  const requests = { claim_search: 0, resolve: 0, 'moderation.AmI': 0, other_proxy: 0 };

  const errorHandler = (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('net::ERR') && !text.includes('favicon')) {
      errors.push(text.substring(0, 150));
    }
    if (text.includes('input selector returned') || text.includes('Unhandled notification_rule')) {
      warnings.push(text.substring(0, 100));
    }
  };

  const pageErrorHandler = (err) => {
    errors.push(`CRASH: ${err.message.substring(0, 150)}`);
  };

  const requestHandler = (req) => {
    const url = req.url();
    if (url.includes('/api/v1/proxy') || url.includes('comments.odysee.tv')) {
      const postData = req.postData();
      if (postData) {
        try {
          const body = JSON.parse(postData);
          const method = body.method;
          if (requests[method] !== undefined) {
            requests[method]++;
          } else {
            requests.other_proxy++;
          }
        } catch {}
      }
    }
  };

  page.on('console', errorHandler);
  page.on('pageerror', pageErrorHandler);
  page.on('request', requestHandler);

  const start = Date.now();
  try {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(WAIT_MS);
  } catch (e) {
    errors.push(`NAV_ERROR: ${e.message.substring(0, 100)}`);
  }
  const elapsed = Date.now() - start;

  page.off('console', errorHandler);
  page.off('pageerror', pageErrorHandler);
  page.off('request', requestHandler);

  // Deduplicate
  const uniqueErrors = [...new Set(errors)];
  const uniqueWarnings = [...new Set(warnings)];

  return {
    name,
    path,
    elapsed,
    errors: uniqueErrors,
    errorCount: errors.length,
    warnings: uniqueWarnings,
    warningCount: warnings.length,
    requests,
    claimSearchSpam: requests.claim_search > 10,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  PAGE HEALTH CHECK — ${BASE_URL}`);
  console.log(`${'='.repeat(70)}\n`);

  const results = [];

  for (const pageInfo of PAGES) {
    process.stdout.write(`  Testing: ${pageInfo.name.padEnd(25)}`);
    const result = await checkPage(page, pageInfo);
    results.push(result);

    const status = result.errors.length > 0 ? '✗ ERRORS' :
                   result.claimSearchSpam ? '⚠ SPAM' :
                   result.warningCount > 5 ? '⚠ WARNS' : '✓ OK';
    console.log(`${status.padEnd(12)} ${result.elapsed}ms  cs:${result.requests.claim_search} res:${result.requests.resolve} mod:${result.requests['moderation.AmI']}`);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('  DETAILS');
  console.log(`${'='.repeat(70)}`);

  for (const r of results) {
    if (r.errors.length > 0 || r.warningCount > 0 || r.claimSearchSpam) {
      console.log(`\n  --- ${r.name} (${r.path}) ---`);
      if (r.errors.length > 0) {
        console.log('  Errors:');
        r.errors.forEach((e) => console.log(`    ✗ ${e}`));
      }
      if (r.warningCount > 0) {
        console.log(`  Warnings: ${r.warningCount}x`);
        r.warnings.slice(0, 3).forEach((w) => console.log(`    ⚠ ${w}`));
      }
      if (r.claimSearchSpam) {
        console.log(`  ⚠ claim_search spam: ${r.requests.claim_search} calls in ${WAIT_MS / 1000}s`);
      }
    }
  }

  // Summary
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const spamPages = results.filter((r) => r.claimSearchSpam).length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.elapsed, 0) / results.length);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  SUMMARY`);
  console.log(`  Pages tested:     ${results.length}`);
  console.log(`  Total errors:     ${totalErrors}`);
  console.log(`  Total warnings:   ${totalWarnings}`);
  console.log(`  Spam pages:       ${spamPages}`);
  console.log(`  Avg load+wait:    ${avgTime}ms`);
  console.log(`${'='.repeat(70)}\n`);

  await browser.close();
}

main().catch(console.error);
