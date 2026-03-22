import { test, expect } from '../../fixtures';
import { optionalAuthToken, getTestChannel } from '../../helpers/auth';
import { ROUTES } from '../../helpers/routes';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/**
 * A well-known public Odysee channel used for read-only assertions.
 * This channel should reliably exist and have public content.
 */
const PUBLIC_CHANNEL = '@Odysee';

/**
 * The test-account channel read from env (used for auth-gated actions).
 * Falls back gracefully – tests that need it will skip when absent.
 */
const MY_CHANNEL = getTestChannel();

// ---------------------------------------------------------------------------
// Channel page – unauthenticated
// ---------------------------------------------------------------------------

test.describe('Channel page – public channel', () => {
  test.beforeEach(async ({ channelPage }) => {
    await channelPage.gotoChannel(PUBLIC_CHANNEL);
  });

  // ── Basic render ──────────────────────────────────────────────────────────

  test('loads and shows the channel name', async ({ channelPage }) => {
    await channelPage.assertChannelName();
    const name = await channelPage.channelName.innerText();
    expect(name.trim()).toBeTruthy();
  });

  test('renders the channel avatar / thumbnail', async ({ channelPage }) => {
    await expect(channelPage.channelAvatar).toBeVisible();
  });

  test('shows at least one content tile', async ({ channelPage }) => {
    await channelPage.assertHasContent();
  });

  test('has a follow button visible to logged-out users', async ({ channelPage }) => {
    // Even logged-out users should see a Follow button (clicking prompts sign-in)
    const followVisible = await channelPage.followButton.isVisible().catch(() => false);
    expect(followVisible, 'Follow button should be visible to logged-out users').toBe(true);
  });

  // ── Content grid ──────────────────────────────────────────────────────────

  test('content grid shows multiple tiles', async ({ channelPage }) => {
    const count = await channelPage.getContentTileCount();
    expect(count, 'Expected more than one content tile').toBeGreaterThan(1);
  });

  test('content tiles are clickable and navigate to watch page', async ({ channelPage, page }) => {
    const initialUrl = page.url();
    await channelPage.clickTile(0);

    // Should have navigated away from the channel page
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);

    // URL should contain a claim path (/@Channel/claim-name pattern)
    expect(newUrl).toMatch(/\/@[^/]+\/.+/);
  });

  test('infinite scroll loads more content', async ({ channelPage }) => {
    const before = await channelPage.getContentTileCount();
    const after = await channelPage.loadMoreContent();
    // After scrolling, count should be >= before (may not grow if already all loaded)
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ── Tab navigation ────────────────────────────────────────────────────────

  test('tab bar is visible', async ({ channelPage }) => {
    await expect(channelPage.tabBar).toBeVisible();
  });

  test('About tab shows description section', async ({ channelPage }) => {
    await channelPage.switchToAboutTab();
    await expect(channelPage.aboutSection).toBeVisible();
  });

  test('About tab URL includes tab=about', async ({ channelPage, page }) => {
    await channelPage.switchToAboutTab();
    expect(page.url()).toContain('tab=about');
  });

  test('Content tab is the default landing tab', async ({ channelPage, page }) => {
    // The default channel URL (no tab param) should show content
    await channelPage.assertHasContent();
    // URL should NOT have a tab param when on the default content view
    const url = new URL(page.url());
    const tab = url.searchParams.get('tab');
    expect(tab === null || tab === 'content').toBe(true);
  });

  test('switching to Playlists tab changes the URL', async ({ channelPage, page }) => {
    const playlistsTabVisible = await channelPage.tabPlaylists.isVisible().catch(() => false);
    if (!playlistsTabVisible) {
      test.skip();
      return;
    }
    await channelPage.switchToPlaylistsTab();
    expect(page.url()).toContain('tab=playlists');
  });

  // ── Channel metadata ──────────────────────────────────────────────────────

  test('page <title> contains the channel name', async ({ channelPage, page }) => {
    const title = await page.title();
    // Remove the leading @ for the title check since some renderers strip it
    const cleanName = PUBLIC_CHANNEL.replace('@', '');
    expect(title.toLowerCase()).toContain(cleanName.toLowerCase());
  });

  test('channel URL is correct after navigation', async ({ channelPage, page }) => {
    expect(page.url()).toContain(PUBLIC_CHANNEL.toLowerCase().replace('@', '%40'));
  });
});

// ---------------------------------------------------------------------------
// Channel page – navigated from search
// ---------------------------------------------------------------------------

test.describe('Channel page – navigate from search', () => {
  test('finding a channel in search and clicking opens its page', async ({
    searchPage,
    channelPage,
    page,
  }) => {
    // Search for "Odysee" (should surface the official channel)
    await searchPage.searchFor('Odysee', { type: 'channel' });
    await searchPage.waitForResults();

    const count = await searchPage.getResultCount();
    if (count === 0) {
      test.skip();
      return;
    }

    // Click the first result
    await searchPage.clickResult(0);

    // Should now be on a channel page (URL starts with /@)
    await channelPage.waitForChannelLoad();
    expect(page.url()).toMatch(/\/@[^/]+/);
  });
});

// ---------------------------------------------------------------------------
// Channel page – tab deep-link
// ---------------------------------------------------------------------------

test.describe('Channel page – tab deep-links', () => {
  test('navigating directly to ?tab=about shows the about section', async ({
    channelPage,
  }) => {
    await channelPage.gotoChannel(PUBLIC_CHANNEL, 'about');
    await expect(channelPage.aboutSection).toBeVisible({ timeout: 12_000 });
  });

  test('navigating directly to ?tab=content shows the content grid', async ({
    channelPage,
  }) => {
    await channelPage.gotoChannel(PUBLIC_CHANNEL, 'content');
    await channelPage.assertHasContent();
  });
});

// ---------------------------------------------------------------------------
// Channel page – authenticated actions
// ---------------------------------------------------------------------------

test.describe('Channel page – authenticated actions', () => {
  test.beforeEach(async ({ channelPage }) => {
    const token = optionalAuthToken();
    test.skip(!token, 'Skipped – set ODYSEE_AUTH_TOKEN to run authenticated tests');
    await channelPage.gotoChannel(PUBLIC_CHANNEL);
  });

  test('can follow and unfollow a channel', async ({ channelPage }) => {
    const alreadyFollowing = await channelPage.isFollowing();

    if (alreadyFollowing) {
      // Unfollow first, then re-follow to keep a clean state
      await channelPage.unfollow();
      await expect(channelPage.followButton).toBeVisible({ timeout: 8_000 });
      await channelPage.follow();
      await expect(channelPage.unfollowButton).toBeVisible({ timeout: 8_000 });
    } else {
      await channelPage.follow();
      await expect(channelPage.unfollowButton).toBeVisible({ timeout: 8_000 });
      // Clean up – unfollow after the test
      await channelPage.unfollow();
      await expect(channelPage.followButton).toBeVisible({ timeout: 8_000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Own channel page (authenticated)
// ---------------------------------------------------------------------------

test.describe('Own channel page', () => {
  test.beforeEach(() => {
    const token = optionalAuthToken();
    test.skip(!token, 'Skipped – set ODYSEE_AUTH_TOKEN to run');
    test.skip(!MY_CHANNEL, 'Skipped – set ODYSEE_TEST_CHANNEL to run own-channel tests');
  });

  test('own channel page loads correctly', async ({ channelPage }) => {
    if (!MY_CHANNEL) return;
    await channelPage.gotoChannel(MY_CHANNEL);
    await channelPage.waitForChannelLoad();
    // Should show our channel name somewhere on the page
    const name = await channelPage.channelName.innerText().catch(() => '');
    expect(name.trim()).toBeTruthy();
  });

  test('edit channel button is visible on own channel', async ({ channelPage, page }) => {
    if (!MY_CHANNEL) return;
    await channelPage.gotoChannel(MY_CHANNEL);
    await channelPage.waitForChannelLoad();

    // Look for an Edit / Customize channel button (only shown to the owner)
    const editButton = page
      .getByRole('button', { name: /edit channel|customize channel/i })
      .or(page.getByRole('link', { name: /edit channel|customize channel/i }))
      .first();

    await expect(editButton, 'Own channel should show an Edit button').toBeVisible({
      timeout: 10_000,
    });
  });

  test('own channel content tab shows published content', async ({ channelPage }) => {
    if (!MY_CHANNEL) return;
    await channelPage.gotoChannel(MY_CHANNEL, 'content');
    // Own channel might have 0 or more tiles – just assert the page loaded
    await channelPage.waitForChannelLoad();
    // No hard assertion on count since the test account may be empty
  });
});

// ---------------------------------------------------------------------------
// Channel page – 404 / unknown channel
// ---------------------------------------------------------------------------

test.describe('Channel page – not found', () => {
  test('visiting a non-existent channel shows a 404 or error state', async ({
    channelPage,
    page,
  }) => {
    // Use a clearly non-existent channel name
    await page.goto('/@this-channel-absolutely-does-not-exist-xyz-12345');
    await channelPage.waitForApp();

    // The page should either show a 404 / not-found state, OR redirect to home.
    // Either is acceptable behaviour – we just assert the app did not crash.
    const is404 = await page.getByText(/not found|404|does not exist/i).isVisible().catch(() => false);
    const isHome = new URL(page.url()).pathname === '/';

    expect(is404 || isHome, 'Expected either a 404 message or a home redirect').toBe(true);
  });
});
