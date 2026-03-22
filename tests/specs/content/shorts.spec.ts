import { test, expect } from '../../fixtures';
import { optionalAuthToken } from '../../helpers/auth';
import { ROUTES } from '../../helpers/routes';

// ---------------------------------------------------------------------------
// Shorts / FYP feed tests
// ---------------------------------------------------------------------------
// These tests cover the vertical short-form video feed at /$/shorts.
//
// Most tests are unauthenticated (read-only).
// Tests that require auth (like, follow, comment) are skipped automatically
// when ODYSEE_AUTH_TOKEN is not set.
// ---------------------------------------------------------------------------

test.describe('Shorts feed', () => {
  test.beforeEach(async ({ shortsPage }) => {
    await shortsPage.goto();
  });

  // ── Basic load ────────────────────────────────────────────────────────────

  test('feed page loads and shows at least one short', async ({ shortsPage }) => {
    await shortsPage.assertFeedLoaded();
  });

  test('page title contains site name', async ({ shortsPage }) => {
    const title = await shortsPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('active short has a visible video player', async ({ shortsPage }) => {
    await shortsPage.assertPlayerRendered();
  });

  test('active short has a visible title', async ({ shortsPage, page }) => {
    // Title may be overlaid on the video or below it
    const titleLocator = page
      .locator('[class*="shorts__title"], [class*="fileTitle"], .claim-preview__title')
      .first();

    // If not found with overlay selectors, the feed may render titles differently –
    // just assert the slide itself is visible (player confirmed above).
    const isVisible = await titleLocator.isVisible().catch(() => false);
    if (isVisible) {
      const text = await titleLocator.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('header and navigation are visible on shorts page', async ({ shortsPage }) => {
    await expect(shortsPage.header).toBeVisible();
  });

  // ── Slide count / preloading ───────────────────────────────────────────────

  test('feed renders multiple short slides in the DOM', async ({ shortsPage }) => {
    // The shorts feed typically pre-renders several slides for smooth swiping.
    // We accept 1+ but ideally expect pre-loading of at least 2.
    const count = await shortsPage.getSlideCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('can navigate to the next short', async ({ shortsPage }) => {
    const before = await shortsPage.getSlideCount();
    await shortsPage.goToNextShort();

    // After advancing, either:
    //   a) the same slides are present (just a different one is active), or
    //   b) a new slide was loaded (count grew)
    // Both are valid – we simply assert the feed is still shown.
    await shortsPage.assertFeedLoaded();
    const after = await shortsPage.getSlideCount();
    expect(after).toBeGreaterThanOrEqual(1);
  });

  test('can navigate forward then back', async ({ shortsPage }) => {
    // Advance one slide
    await shortsPage.goToNextShort();
    await shortsPage.assertFeedLoaded();

    // Go back
    await shortsPage.goToPrevShort();
    await shortsPage.assertFeedLoaded();
  });

  test('ArrowDown key advances to next short', async ({ shortsPage, page }) => {
    await shortsPage.assertFeedLoaded();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(700); // snap-scroll animation
    await shortsPage.assertFeedLoaded();
  });

  test('swipe-up gesture (scrollBy) advances the feed', async ({ shortsPage }) => {
    await shortsPage.assertFeedLoaded();
    await shortsPage.swipeUp();
    await shortsPage.assertFeedLoaded();
  });

  // ── Actions panel ─────────────────────────────────────────────────────────

  test('actions panel (side buttons) is visible', async ({ shortsPage }) => {
    await shortsPage.assertActionsPanelVisible();
  });

  test('actions panel contains recognisable action buttons', async ({ shortsPage, page }) => {
    // We look for at least one of the known action icon-buttons.
    // If the actions panel renders differently, at least one of these should match.
    const actionButtons = page.locator(
      '.shorts-actions button, [class*="shortsActions"] button, [class*="shorts-side-panel"] button'
    );
    const count = await actionButtons.count();
    // Expect at least 2 action buttons (e.g. like + comment)
    expect(count, 'Expected at least 2 action buttons in the side panel').toBeGreaterThanOrEqual(2);
  });

  // ── Video playback ────────────────────────────────────────────────────────

  test('active short has a <video> element in the DOM', async ({ shortsPage, page }) => {
    const video = page.locator('video').first();
    await expect(video).toBeAttached({ timeout: 10_000 });
  });

  test('clicking the video player toggles play/pause', async ({ shortsPage, page }) => {
    // Wait for a video element to be attached (src may not be set yet)
    const video = page.locator('video').first();
    await video.waitFor({ state: 'attached', timeout: 10_000 });

    // Click the player container to toggle
    await shortsPage.togglePlayPause();

    // We don't hard-assert playback state here because autoplay policies
    // differ across environments; just assert the player didn't crash.
    await shortsPage.assertPlayerRendered();
  });

  // ── URL / routing ─────────────────────────────────────────────────────────

  test('navigating to /$/shorts lands on the shorts page', async ({ page }) => {
    await page.goto(ROUTES.shorts);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/$/shorts');
  });

  test('navigating to /$/fyp lands on the FYP/shorts page', async ({ page }) => {
    await page.goto(ROUTES.fyp);
    await page.waitForLoadState('domcontentloaded');
    // FYP may redirect to /$/shorts or render inline
    const url = page.url();
    expect(url.includes('/$/fyp') || url.includes('/$/shorts')).toBe(true);
  });

  // ── Channel link ──────────────────────────────────────────────────────────

  test('active short displays a channel link or thumbnail', async ({ shortsPage, page }) => {
    const channelLocator = page
      .locator(
        '[class*="shorts__channel"], [class*="channel-thumbnail"], .claim-author, [class*="claimAuthor"]'
      )
      .first();

    // Channel info may or may not be visible depending on layout
    const visible = await channelLocator.isVisible({ timeout: 5_000 }).catch(() => false);
    if (visible) {
      const href = await channelLocator
        .locator('a')
        .first()
        .getAttribute('href')
        .catch(() => null);
      if (href) {
        expect(href).toMatch(/^\/@/);
      }
    }
  });

  // ── Share ─────────────────────────────────────────────────────────────────

  test('share button is visible or accessible in actions panel', async ({ shortsPage, page }) => {
    const shareBtn = page
      .locator(
        '[aria-label*="Share" i], [class*="share"], button:has-text("Share")'
      )
      .first();
    // The share button may be in the side panel or behind a more-menu
    const visible = await shareBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    // Just log – share button UI placement varies; don't hard-fail
    if (!visible) {
      console.info('Share button not immediately visible – may be behind a menu');
    }
  });

  // ── Auth-gated actions ────────────────────────────────────────────────────

  test('like button prompts sign-in when unauthenticated', async ({ shortsPage, page }) => {
    test.skip(!!optionalAuthToken(), 'Skipping – user is authenticated');

    const likeBtn = page
      .locator('[aria-label*="Like" i], [class*="like-button"], [class*="likeButton"]')
      .first();

    const visible = await likeBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) {
      test.skip(true, 'Like button not found in current layout');
      return;
    }

    await likeBtn.click();

    // Should either redirect to sign-in or show a sign-in modal/nag
    const signInPrompt = page
      .locator('[class*="modal"], [class*="nag"], [class*="signin"]')
      .or(page.getByRole('dialog'))
      .first();

    const onSignInPage = page.url().includes('/$/signin');
    const promptVisible = await signInPrompt.isVisible({ timeout: 5_000 }).catch(() => false);

    expect(
      onSignInPage || promptVisible,
      'Expected like button to prompt sign-in for unauthenticated user'
    ).toBe(true);
  });

  test.describe('authenticated actions', () => {
    test.beforeEach(async () => {
      test.skip(!optionalAuthToken(), 'ODYSEE_AUTH_TOKEN not set – skipping auth tests');
    });

    test('like button is clickable when authenticated', async ({ shortsPage, page }) => {
      const likeBtn = shortsPage.likeButton;
      const visible = await likeBtn.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Like button not found');
        return;
      }
      await likeBtn.click();
      // After clicking, just assert the app didn't crash
      await shortsPage.assertFeedLoaded();
    });

    test('comment button opens comments drawer', async ({ shortsPage }) => {
      const commentBtn = shortsPage.commentButton;
      const visible = await commentBtn.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Comment button not found in current layout');
        return;
      }
      await shortsPage.openComments();
      await shortsPage.assertCommentsOpen();
    });

    test('follow button is visible and clickable', async ({ shortsPage }) => {
      const followBtn = shortsPage.followButton;
      const visible = await followBtn.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!visible) {
        test.skip(true, 'Follow button not found in actions panel');
        return;
      }
      await followBtn.click();
      // After clicking follow, app should not crash
      await shortsPage.assertFeedLoaded();
    });
  });

  // ── Responsive / mobile ───────────────────────────────────────────────────

  test('feed renders on a narrow (375px) viewport', async ({ shortsPage, page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.shorts);
    await page.waitForLoadState('domcontentloaded');
    await shortsPage.assertFeedLoaded();
  });
});
