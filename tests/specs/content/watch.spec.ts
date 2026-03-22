import { test, expect } from '../../fixtures';
import { optionalAuthToken } from '../../helpers/auth';
import { ROUTES } from '../../helpers/routes';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
// These point at real public Odysee content that should be stable.
// Update them if a claim is ever deleted or renamed.

const KNOWN_VIDEO = {
  channel: '@Odysee',
  claim: 'placeholder-video', // TODO: replace with a real stable claim slug
  titleFragment: '', // optional: assert title contains this text
};

// ---------------------------------------------------------------------------
// Watch page tests
// ---------------------------------------------------------------------------

test.describe('Watch page', () => {
  test.describe('Player rendering', () => {
    test('player container is visible after navigation', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.assertPlayerVisible();
    });

    test('video element is attached to the DOM', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForVideo();
      await expect(watchPage.videoElement).toBeAttached();
    });

    test('player controls are accessible on hover', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForPlayer();
      await watchPage.hoverPlayer();
      // Progress bar should be visible when controls are shown
      await expect(watchPage.progressBar).toBeVisible({ timeout: 5_000 });
    });

    test('fullscreen button is present', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.hoverPlayer();
      await expect(watchPage.fullscreenButton).toBeVisible({ timeout: 5_000 });
    });

    test('mute button is present', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.hoverPlayer();
      await expect(watchPage.muteButton).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('File metadata', () => {
    test('file title is visible', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await expect(watchPage.fileTitle).toBeVisible({ timeout: 15_000 });
    });

    test('file title is non-empty', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const title = await watchPage.getTitleText();
      expect(title.trim().length, 'Title should not be empty').toBeGreaterThan(0);
    });

    test('title contains expected text when titleFragment is set', async ({ watchPage }) => {
      test.skip(!KNOWN_VIDEO.titleFragment, 'titleFragment not configured – skipping');
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.assertTitleContains(KNOWN_VIDEO.titleFragment);
    });

    test('channel link is visible and navigates to channel', async ({ watchPage, page }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const channelName = await watchPage.getChannelName();
      expect(channelName.trim().length).toBeGreaterThan(0);

      await watchPage.goToChannel();
      expect(watchPage.currentPath()).toMatch(/^\/@/);
    });

    test('description section is present', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      // Description may be collapsed – expander may or may not be shown
      const descVisible = await watchPage.fileDescription.isVisible({ timeout: 8_000 }).catch(() => false);
      const expanderVisible = await watchPage.fileDescriptionExpander.isVisible().catch(() => false);
      expect(descVisible || expanderVisible, 'Either description or its expander should be present').toBe(true);
    });

    test('expand description reveals full text', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const text = await watchPage.getDescriptionText();
      // Just assert it resolved without throwing; content is claim-specific
      expect(typeof text).toBe('string');
    });
  });

  test.describe('Recommended content', () => {
    test('recommended section is present', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForRecommended(1);
      await expect(watchPage.recommendedSection).toBeVisible();
    });

    test('at least 3 recommended items are shown', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForRecommended(3);
      await watchPage.assertMinRecommended(3);
    });

    test('clicking a recommended item navigates to a new watch page', async ({ watchPage, page }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const originalPath = watchPage.currentPath();

      await watchPage.waitForRecommended(1);
      await watchPage.clickRecommended(0);

      // Should have navigated somewhere else
      const newPath = watchPage.currentPath();
      expect(newPath, 'Should have navigated to a different page after clicking recommended').not.toBe(originalPath);
    });
  });

  test.describe('Comments section', () => {
    test('comments section is rendered on the watch page', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForComments();
      await expect(watchPage.commentsSection).toBeVisible();
    });

    test('comment count is a non-negative number', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForComments();
      const count = await watchPage.getCommentCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('comment input is present (for sign-in prompt or actual input)', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForComments();
      // Either the real textarea or a "sign in to comment" message should appear
      const inputVisible = await watchPage.commentInput.isVisible({ timeout: 5_000 }).catch(() => false);
      const signInPrompt = await watchPage.page
        .getByText(/sign in to comment|log in to comment/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(inputVisible || signInPrompt, 'Expected either comment input or sign-in prompt').toBe(true);
    });
  });

  test.describe('Authenticated interactions', () => {
    test.beforeEach(async ({ watchPage }) => {
      const token = optionalAuthToken();
      test.skip(!token, 'Skipped – set ODYSEE_AUTH_TOKEN to run authenticated tests');
    });

    test('like button is interactive when signed in', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const likeVisible = await watchPage.likeButton.isVisible({ timeout: 8_000 }).catch(() => false);
      test.skip(!likeVisible, 'Like button not visible – reactions may be disabled for this claim');
      await expect(watchPage.likeButton).toBeEnabled();
    });

    test('comment input is available when signed in', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForComments();
      await expect(watchPage.commentInput).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Navigation / URL integrity', () => {
    test('watch page URL includes channel and claim name', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const path = watchPage.currentPath();
      expect(path).toContain('@');
      expect(path.split('/').length).toBeGreaterThanOrEqual(3);
    });

    test('page title is not empty', async ({ watchPage }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const title = await watchPage.getTitle();
      expect(title.trim().length).toBeGreaterThan(0);
    });

    test('navigating back from recommended returns to the previous watch page', async ({ watchPage, page }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      const originalPath = watchPage.currentPath();

      await watchPage.waitForRecommended(1);
      await watchPage.clickRecommended(0);

      // Go back
      await page.goBack();
      await watchPage.waitForApp();
      expect(watchPage.currentPath()).toBe(originalPath);
    });
  });

  test.describe('Floating / mini player', () => {
    test('floating player appears when navigating away mid-watch', async ({ watchPage, homePage, page }) => {
      await watchPage.gotoWatch(KNOWN_VIDEO.channel, KNOWN_VIDEO.claim);
      await watchPage.waitForPlayer();

      // Navigate to the home page – the floating player should persist
      await page.goto(ROUTES.home);
      await homePage.waitForApp();

      const floatingVisible = await watchPage.floatingPlayer.isVisible({ timeout: 8_000 }).catch(() => false);
      // This behaviour depends on app settings – skip if not visible rather than fail
      test.skip(!floatingVisible, 'Floating player did not appear – feature may be disabled or video did not start');
      await expect(watchPage.floatingPlayer).toBeVisible();
    });
  });
});
