import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../helpers/routes';

/**
 * ShortsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for the Odysee Shorts / FYP (/$/shorts) experience.
 *
 * The Shorts UI is a vertical swipe-feed of short-form videos.
 * Each "slide" contains:
 *   - A video player
 *   - A side actions panel (like, dislike, comment, tip, share)
 *   - Channel info + title overlaid on the video
 *
 * Selector notes:
 *   Component source dirs referenced:
 *     ui/component/shortsVideoPlayer
 *     ui/component/shortsActions
 *     ui/component/shortsSidePanel
 *     ui/component/shortsMobileSidePanel
 */
export class ShortsPage extends BasePage {
  // ── Page container ────────────────────────────────────────────────────────
  /** Root scroll container that holds all short video slides. */
  readonly feedContainer: Locator;

  // ── Individual slides ─────────────────────────────────────────────────────
  /** All rendered short slides (there may be several pre-loaded in the DOM). */
  readonly slides: Locator;
  /** The currently active / visible short slide. */
  readonly activeSlide: Locator;

  // ── Video player ──────────────────────────────────────────────────────────
  /** The video element inside the active slide. */
  readonly activeVideo: Locator;
  /** Video.js player wrapper inside the active slide. */
  readonly activePlayer: Locator;
  /** Play/pause overlay or button on the active video. */
  readonly playPauseOverlay: Locator;

  // ── Overlay metadata (title, channel) ────────────────────────────────────
  /** Title text overlaid on the active short. */
  readonly activeTitle: Locator;
  /** Channel name / thumbnail link overlaid on the active short. */
  readonly activeChannelLink: Locator;

  // ── Actions panel (side panel) ────────────────────────────────────────────
  /** The entire side-panel of action buttons. */
  readonly actionsPanel: Locator;
  /** Like / thumbs-up button. */
  readonly likeButton: Locator;
  /** Dislike / thumbs-down button. */
  readonly dislikeButton: Locator;
  /** Comment / discussion button. */
  readonly commentButton: Locator;
  /** Tip / support button. */
  readonly tipButton: Locator;
  /** Share button. */
  readonly shareButton: Locator;
  /** Follow / subscribe button for the current channel. */
  readonly followButton: Locator;

  // ── Navigation ────────────────────────────────────────────────────────────
  /** "Next" (down / scroll-forward) button. */
  readonly nextButton: Locator;
  /** "Previous" (up / scroll-back) button. */
  readonly prevButton: Locator;

  // ── Comments drawer ───────────────────────────────────────────────────────
  /** Comments side-panel / drawer when opened. */
  readonly commentsDrawer: Locator;
  /** Input field inside the comments drawer. */
  readonly commentInput: Locator;
  /** Submit button inside the comments drawer. */
  readonly commentSubmit: Locator;

  constructor(page: Page) {
    super(page);

    // ── Feed container ───────────────────────────────────────────────────────
    this.feedContainer = page
      .locator('.shorts-feed, [class*="shorts__feed"], [class*="shorts-container"]')
      .first();

    // ── Slides ───────────────────────────────────────────────────────────────
    this.slides = page.locator(
      '.shorts__slide, [class*="shorts__item"], [class*="short-slide"], .claim-preview--shorts'
    );
    this.activeSlide = page
      .locator(
        '.shorts__slide--active, [class*="shorts__item--active"], [class*="short-slide--active"]'
      )
      .or(this.slides.first()); // fallback: first slide when no active class exists yet

    // ── Video ────────────────────────────────────────────────────────────────
    this.activePlayer = this.activeSlide
      .locator('.video-js, [class*="videojs"], .shorts-video-player')
      .first();
    this.activeVideo = this.activeSlide.locator('video').first();
    this.playPauseOverlay = this.activeSlide
      .locator('.vjs-big-play-button, [class*="play-pause"], [aria-label*="Play"], [aria-label*="Pause"]')
      .first();

    // ── Metadata ─────────────────────────────────────────────────────────────
    this.activeTitle = this.activeSlide
      .locator('[class*="shorts__title"], [class*="file-title"], .claim-preview__title')
      .first();
    this.activeChannelLink = this.activeSlide
      .locator('[class*="shorts__channel"], [class*="channel-thumbnail"], .claim-preview__channel')
      .first();

    // ── Actions panel ─────────────────────────────────────────────────────────
    this.actionsPanel = page
      .locator('.shorts-actions, [class*="shorts-side-panel"], [class*="shortsActions"]')
      .first();
    this.likeButton = this.actionsPanel
      .locator('[aria-label*="Like"], [class*="like"], button:has([class*="like"])')
      .first();
    this.dislikeButton = this.actionsPanel
      .locator('[aria-label*="Dislike"], [class*="dislike"], button:has([class*="dislike"])')
      .first();
    this.commentButton = this.actionsPanel
      .locator('[aria-label*="Comment"], [class*="comment"], button:has([class*="comment"])')
      .first();
    this.tipButton = this.actionsPanel
      .locator('[aria-label*="Tip"], [aria-label*="Support"], [class*="tip"], [class*="support"]')
      .first();
    this.shareButton = this.actionsPanel
      .locator('[aria-label*="Share"], [class*="share"]')
      .first();
    this.followButton = this.actionsPanel
      .locator('[aria-label*="Follow"], [aria-label*="Subscribe"], .subscribe-button, [class*="subscribe"]')
      .first();

    // ── Navigation arrows ─────────────────────────────────────────────────────
    this.nextButton = page
      .locator(
        '[aria-label*="Next"], [class*="shorts__next"], [class*="next-short"], button[class*="down"]'
      )
      .first();
    this.prevButton = page
      .locator(
        '[aria-label*="Previous"], [class*="shorts__prev"], [class*="prev-short"], button[class*="up"]'
      )
      .first();

    // ── Comments drawer ───────────────────────────────────────────────────────
    this.commentsDrawer = page
      .locator('.swipeable-drawer, [class*="comments-drawer"], [class*="comment-panel"]')
      .first();
    this.commentInput = this.commentsDrawer
      .locator('textarea, input[type="text"], [class*="comment-create__input"]')
      .first();
    this.commentSubmit = this.commentsDrawer
      .locator('button[type="submit"], [class*="comment-create__submit"]')
      .first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to the Shorts feed page and wait for the first short to appear.
   */
  async goto(): Promise<void> {
    await super.goto(ROUTES.shorts);
    await this.waitForFirstShort();
  }

  /**
   * Navigate to the FYP (For You Page) variant of Shorts.
   */
  async gotoFyp(): Promise<void> {
    await super.goto(ROUTES.fyp);
    await this.waitForFirstShort();
  }

  /**
   * Wait until at least one short slide is present in the DOM.
   */
  async waitForFirstShort(timeout = 20_000): Promise<void> {
    await this.slides.first().waitFor({ state: 'visible', timeout });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Slide navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Advance to the next short by pressing the Next button.
   * Falls back to a keyboard ArrowDown if the button is not visible.
   */
  async goToNextShort(): Promise<void> {
    const nextVisible = await this.nextButton.isVisible().catch(() => false);
    if (nextVisible) {
      await this.nextButton.click();
    } else {
      await this.page.keyboard.press('ArrowDown');
    }
    await this.page.waitForTimeout(600); // allow snap-scroll animation
  }

  /**
   * Go back to the previous short.
   * Falls back to ArrowUp if the button is not visible.
   */
  async goToPrevShort(): Promise<void> {
    const prevVisible = await this.prevButton.isVisible().catch(() => false);
    if (prevVisible) {
      await this.prevButton.click();
    } else {
      await this.page.keyboard.press('ArrowUp');
    }
    await this.page.waitForTimeout(600);
  }

  /**
   * Scroll down by one viewport height (simulates a swipe-up gesture).
   */
  async swipeUp(): Promise<void> {
    await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await this.page.waitForTimeout(600);
  }

  /**
   * Scroll up by one viewport height (simulates a swipe-down gesture).
   */
  async swipeDown(): Promise<void> {
    await this.page.evaluate(() => window.scrollBy(0, -window.innerHeight));
    await this.page.waitForTimeout(600);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Video playback
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Click the video area to toggle play/pause.
   */
  async togglePlayPause(): Promise<void> {
    await this.activePlayer.click();
  }

  /**
   * Returns true if the active video element is currently playing
   * (i.e. not paused and not ended).
   */
  async isPlaying(): Promise<boolean> {
    return this.activeVideo.evaluate(
      (video: HTMLVideoElement) => !video.paused && !video.ended && video.currentTime > 0
    );
  }

  /**
   * Wait until the active video has started playing.
   */
  async waitForPlayback(timeout = 10_000): Promise<void> {
    await expect
      .poll(async () => this.isPlaying(), { timeout, message: 'Expected video to start playing' })
      .toBe(true);
  }

  /**
   * Returns the duration (in seconds) of the active video, or null if unknown.
   */
  async getVideoDuration(): Promise<number | null> {
    const duration = await this.activeVideo.evaluate(
      (video: HTMLVideoElement) => video.duration
    );
    return isFinite(duration) ? duration : null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Metadata
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns the title text of the currently visible short.
   */
  async getActiveTitle(): Promise<string> {
    await this.activeTitle.waitFor({ state: 'visible', timeout: 8_000 });
    return this.activeTitle.innerText();
  }

  /**
   * Returns the channel handle / name of the currently visible short.
   */
  async getActiveChannel(): Promise<string> {
    await this.activeChannelLink.waitFor({ state: 'visible', timeout: 8_000 });
    return this.activeChannelLink.innerText();
  }

  /**
   * Returns the total number of slides currently rendered in the DOM.
   */
  async getSlideCount(): Promise<number> {
    return this.slides.count();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Click the Like button on the current short.
   * Requires the user to be authenticated.
   */
  async like(): Promise<void> {
    await this.likeButton.waitFor({ state: 'visible', timeout: 8_000 });
    await this.likeButton.click();
  }

  /**
   * Click the Dislike button on the current short.
   * Requires the user to be authenticated.
   */
  async dislike(): Promise<void> {
    await this.dislikeButton.waitFor({ state: 'visible', timeout: 8_000 });
    await this.dislikeButton.click();
  }

  /**
   * Open the comments drawer by clicking the comment action button.
   */
  async openComments(): Promise<void> {
    await this.commentButton.waitFor({ state: 'visible', timeout: 8_000 });
    await this.commentButton.click();
    await this.commentsDrawer.waitFor({ state: 'visible', timeout: 8_000 });
  }

  /**
   * Close the comments drawer by pressing Escape.
   */
  async closeComments(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.commentsDrawer.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  /**
   * Open the Share panel for the current short.
   */
  async openShare(): Promise<void> {
    await this.shareButton.waitFor({ state: 'visible', timeout: 8_000 });
    await this.shareButton.click();
  }

  /**
   * Click the Follow / Subscribe button for the current short's channel.
   * Requires the user to be authenticated.
   */
  async follow(): Promise<void> {
    await this.followButton.waitFor({ state: 'visible', timeout: 8_000 });
    await this.followButton.click();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Assertions
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Assert that the Shorts feed has loaded and contains at least one slide.
   */
  async assertFeedLoaded(): Promise<void> {
    await expect(this.slides.first(), 'Expected at least one short to be visible').toBeVisible();
  }

  /**
   * Assert that the actions panel is visible for the current short.
   */
  async assertActionsPanelVisible(): Promise<void> {
    await expect(this.actionsPanel, 'Expected the actions panel to be visible').toBeVisible();
  }

  /**
   * Assert that the video player is rendered (regardless of playback state).
   */
  async assertPlayerRendered(): Promise<void> {
    await expect(this.activePlayer, 'Expected the video player to be rendered').toBeVisible();
  }

  /**
   * Assert that there are at least `min` slides rendered in the DOM.
   * Useful for confirming that infinite-scroll / pre-loading is working.
   */
  async assertSlideCountAtLeast(min: number): Promise<void> {
    const count = await this.getSlideCount();
    expect(count, `Expected at least ${min} shorts to be rendered, got ${count}`).toBeGreaterThanOrEqual(min);
  }

  /**
   * Assert that the comments drawer is open.
   */
  async assertCommentsOpen(): Promise<void> {
    await expect(this.commentsDrawer, 'Expected the comments drawer to be open').toBeVisible();
  }
}
