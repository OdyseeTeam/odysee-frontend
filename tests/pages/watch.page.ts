import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * WatchPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for the video / file watch page.
 * Covers the player, metadata, reactions, comments, and recommendations.
 *
 * Typical URL pattern:  /@ChannelName/claim-name
 */
export class WatchPage extends BasePage {
  // ── Video player ──────────────────────────────────────────────────────────
  readonly playerContainer: Locator;
  readonly videoElement: Locator;
  readonly playButton: Locator;
  readonly pauseButton: Locator;
  readonly muteButton: Locator;
  readonly volumeSlider: Locator;
  readonly fullscreenButton: Locator;
  readonly progressBar: Locator;
  readonly playerOverlay: Locator;

  // ── File metadata ─────────────────────────────────────────────────────────
  readonly fileTitle: Locator;
  readonly fileSubtitle: Locator;
  readonly fileDescription: Locator;
  readonly fileDescriptionExpander: Locator;
  readonly channelLink: Locator;
  readonly publishDate: Locator;
  readonly viewCount: Locator;
  readonly fileType: Locator;
  readonly duration: Locator;

  // ── Reactions ─────────────────────────────────────────────────────────────
  readonly likeButton: Locator;
  readonly dislikeButton: Locator;
  readonly likeCount: Locator;
  readonly dislikeCount: Locator;

  // ── Action buttons ────────────────────────────────────────────────────────
  readonly tipButton: Locator;
  readonly shareButton: Locator;
  readonly addToPlaylistButton: Locator;
  readonly repostButton: Locator;
  readonly reportButton: Locator;
  readonly followButton: Locator;

  // ── Comments ──────────────────────────────────────────────────────────────
  readonly commentsSection: Locator;
  readonly commentsList: Locator;
  readonly commentItems: Locator;
  readonly commentInput: Locator;
  readonly commentSubmitButton: Locator;
  readonly commentChannelSelector: Locator;

  // ── Recommended content ───────────────────────────────────────────────────
  readonly recommendedSection: Locator;
  readonly recommendedItems: Locator;

  // ── Floating / mini player ────────────────────────────────────────────────
  readonly floatingPlayer: Locator;
  readonly floatingPlayerCloseButton: Locator;

  constructor(page: Page) {
    super(page);

    // ── Player ───────────────────────────────────────────────────────────────
    this.playerContainer = page.locator('.file-viewer, .video-js').first();
    this.videoElement = page.locator('video').first();
    this.playButton = page.locator('.vjs-play-control[title="Play"]').first();
    this.pauseButton = page.locator('.vjs-play-control[title="Pause"]').first();
    this.muteButton = page.locator('.vjs-mute-control').first();
    this.volumeSlider = page.locator('.vjs-volume-bar').first();
    this.fullscreenButton = page.locator('.vjs-fullscreen-control').first();
    this.progressBar = page.locator('.vjs-progress-holder').first();
    this.playerOverlay = page.locator('.videojs-overlay, [class*="videoOverlay"]').first();

    // ── Metadata ─────────────────────────────────────────────────────────────
    this.fileTitle = page.locator('.file-title__wrap, .claim-preview__title').first();
    this.fileSubtitle = page.locator('.file-subtitle, [class*="fileSubtitle"]').first();
    this.fileDescription = page.locator('.file-description, [class*="fileDescription"]').first();
    this.fileDescriptionExpander = page.locator('.file-description__toggle, [class*="expandToggle"]').first();
    this.channelLink = page.locator('.claim-author a, .channel-name a, [class*="channelLink"]').first();
    this.publishDate = page.locator('.date_time, [class*="dateTime"]').first();
    this.viewCount = page.locator('.file-view-count, [class*="fileViewCount"]').first();
    this.fileType = page.locator('.file-type, [class*="fileType"]').first();
    this.duration = page.locator('.video-duration, [class*="videoDuration"]').first();

    // ── Reactions ────────────────────────────────────────────────────────────
    this.likeButton = page.locator('.file-reactions__like, [class*="like"]').first();
    this.dislikeButton = page.locator('.file-reactions__dislike, [class*="dislike"]').first();
    this.likeCount = page.locator('.file-reactions__like-count, [class*="likeCount"]').first();
    this.dislikeCount = page.locator('.file-reactions__dislike-count, [class*="dislikeCount"]').first();

    // ── Action buttons ────────────────────────────────────────────────────────
    this.tipButton = page.getByRole('button', { name: /tip|support/i }).first();
    this.shareButton = page.getByRole('button', { name: /share/i }).first();
    this.addToPlaylistButton = page.getByRole('button', { name: /playlist|queue/i }).first();
    this.repostButton = page.getByRole('button', { name: /repost/i }).first();
    this.reportButton = page.getByRole('button', { name: /report/i }).first();
    this.followButton = page.getByRole('button', { name: /follow|subscribe/i }).first();

    // ── Comments ──────────────────────────────────────────────────────────────
    this.commentsSection = page.locator('.comments, [class*="commentsList"]').first();
    this.commentsList = page.locator('.comments__list, [class*="commentsList"]').first();
    this.commentItems = page.locator('.comment, [class*="comment__body"]');
    this.commentInput = page.locator('.comment-create__input textarea, [class*="commentCreate"] textarea').first();
    this.commentSubmitButton = page.getByRole('button', { name: /^post$|^submit comment/i }).first();
    this.commentChannelSelector = page.locator('.comment-create__channel-selector, [class*="channelSelector"]').first();

    // ── Recommended ───────────────────────────────────────────────────────────
    this.recommendedSection = page.locator('.recommended-content, [class*="recommendedContent"]').first();
    this.recommendedItems = page.locator(
      '.recommended-content .claim-preview, [class*="recommendedContent"] [class*="claimPreview"]'
    );

    // ── Floating player ───────────────────────────────────────────────────────
    this.floatingPlayer = page.locator('.content__viewer--floating, [class*="videoRenderFloating"]').first();
    this.floatingPlayerCloseButton = page.locator('.content__floating-close, [class*="floatingClose"]').first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate directly to a watch page and wait for the player to appear.
   * @param channelName   Channel handle, e.g. '@Odysee' or 'Odysee'
   * @param claimName     Claim / video slug, e.g. 'some-video-title'
   */
  async gotoWatch(channelName: string, claimName: string): Promise<void> {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    await this.goto(`/${ch}/${claimName}`);
    await this.waitForPlayer();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Player interactions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait until the video player container is visible.
   */
  async waitForPlayer(timeout = 20_000): Promise<void> {
    await this.playerContainer.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for the underlying <video> element to be present.
   */
  async waitForVideo(timeout = 20_000): Promise<void> {
    await this.videoElement.waitFor({ state: 'attached', timeout });
  }

  /**
   * Click the play button (or the player area) to start playback.
   */
  async play(): Promise<void> {
    // First try the explicit play button; fall back to clicking the player
    const playVisible = await this.playButton.isVisible().catch(() => false);
    if (playVisible) {
      await this.playButton.click();
    } else {
      await this.playerContainer.click();
    }
  }

  /**
   * Click the pause button to pause playback.
   */
  async pause(): Promise<void> {
    const pauseVisible = await this.pauseButton.isVisible().catch(() => false);
    if (pauseVisible) {
      await this.pauseButton.click();
    } else {
      await this.playerContainer.click();
    }
  }

  /**
   * Returns the current playback state via the video element.
   * Requires the video element to be in the DOM.
   */
  async isPlaying(): Promise<boolean> {
    return this.page.evaluate(() => {
      const video = document.querySelector('video');
      return !!(video && !video.paused && !video.ended && video.readyState > 2);
    });
  }

  /**
   * Returns the current playback time in seconds.
   */
  async getCurrentTime(): Promise<number> {
    return this.page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? video.currentTime : 0;
    });
  }

  /**
   * Returns the video duration in seconds (0 if not yet loaded).
   */
  async getDuration(): Promise<number> {
    return this.page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? video.duration : 0;
    });
  }

  /**
   * Toggle mute via the mute button.
   */
  async toggleMute(): Promise<void> {
    await this.muteButton.click();
  }

  /**
   * Hover over the player to reveal the control bar.
   */
  async hoverPlayer(): Promise<void> {
    await this.playerContainer.hover();
  }

  /**
   * Seek to a specific time by evaluating on the video element.
   */
  async seekTo(seconds: number): Promise<void> {
    await this.page.evaluate((t) => {
      const video = document.querySelector('video');
      if (video) video.currentTime = t;
    }, seconds);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Metadata
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns the visible file / video title text.
   */
  async getTitleText(): Promise<string> {
    await this.fileTitle.waitFor({ state: 'visible' });
    return this.fileTitle.innerText();
  }

  /**
   * Expands the description if it is collapsed.
   */
  async expandDescription(): Promise<void> {
    const expanderVisible = await this.fileDescriptionExpander.isVisible().catch(() => false);
    if (expanderVisible) {
      await this.fileDescriptionExpander.click();
    }
  }

  /**
   * Returns the full description text (expands it first if needed).
   */
  async getDescriptionText(): Promise<string> {
    await this.expandDescription();
    await this.fileDescription.waitFor({ state: 'visible' });
    return this.fileDescription.innerText();
  }

  /**
   * Returns the channel name text.
   */
  async getChannelName(): Promise<string> {
    await this.channelLink.waitFor({ state: 'visible' });
    return this.channelLink.innerText();
  }

  /**
   * Navigate to the content's channel page by clicking the channel link.
   */
  async goToChannel(): Promise<void> {
    await this.channelLink.click();
    await this.waitForApp();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Comments
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait for the comments section to be visible.
   */
  async waitForComments(timeout = 15_000): Promise<void> {
    await this.commentsSection.waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the number of comment items currently rendered.
   */
  async getCommentCount(): Promise<number> {
    return this.commentItems.count();
  }

  /**
   * Post a comment. Requires an authenticated session.
   * @param text      The comment body.
   * @param channel   Optional channel name to post as (if not the default).
   */
  async postComment(text: string, channel?: string): Promise<void> {
    await this.commentInput.waitFor({ state: 'visible' });
    await this.commentInput.click();
    await this.commentInput.fill(text);
    await this.commentSubmitButton.waitFor({ state: 'visible' });
    await this.commentSubmitButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Recommended content
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Wait for the recommended section to render at least one item.
   */
  async waitForRecommended(minItems = 1, timeout = 15_000): Promise<void> {
    await this.recommendedSection.waitFor({ state: 'visible', timeout });
    await expect(this.recommendedItems.nth(minItems - 1)).toBeVisible({ timeout });
  }

  /**
   * Returns the number of recommended items currently rendered.
   */
  async getRecommendedCount(): Promise<number> {
    return this.recommendedItems.count();
  }

  /**
   * Click a recommended item by its 0-based index.
   */
  async clickRecommended(index = 0): Promise<void> {
    await this.recommendedItems.nth(index).click();
    await this.waitForApp();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Assertions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Assert the player container is visible.
   */
  async assertPlayerVisible(): Promise<void> {
    await expect(this.playerContainer, 'Video player should be visible').toBeVisible();
  }

  /**
   * Assert the file title contains the expected text (case-insensitive).
   */
  async assertTitleContains(expected: string): Promise<void> {
    await expect(this.fileTitle).toContainText(expected, { ignoreCase: true });
  }

  /**
   * Assert at least `min` comments are rendered.
   */
  async assertMinComments(min: number): Promise<void> {
    const count = await this.getCommentCount();
    expect(count, `Expected at least ${min} comments, got ${count}`).toBeGreaterThanOrEqual(min);
  }

  /**
   * Assert at least `min` recommended items are rendered.
   */
  async assertMinRecommended(min: number): Promise<void> {
    const count = await this.getRecommendedCount();
    expect(count, `Expected at least ${min} recommended items, got ${count}`).toBeGreaterThanOrEqual(min);
  }

  /**
   * Assert the current URL matches the expected channel / claim pair.
   */
  async assertOnWatchPage(channelName: string, claimName: string): Promise<void> {
    const ch = channelName.startsWith('@') ? channelName : `@${channelName}`;
    const expected = `/${ch}/${claimName}`;
    expect(this.currentPath()).toBe(expected);
  }
}
