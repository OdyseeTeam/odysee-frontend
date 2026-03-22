import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * ChannelPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object Model for a channel page (e.g. /@Odysee, /@Odysee?tab=about).
 *
 * Covers:
 *   - Channel header  (banner, avatar, name, subscriber count)
 *   - Tab navigation  (content | playlists | about | membership | discussion)
 *   - Content grid    (claim preview tiles)
 *   - Follow / Subscribe button
 *   - About section
 *   - Membership section
 *   - Discussion / comments section
 */
export class ChannelPage extends BasePage {
  // ── Channel header ─────────────────────────────────────────────────────────
  readonly channelBanner: Locator;
  readonly channelAvatar: Locator;
  readonly channelName: Locator;
  readonly subscriberCount: Locator;

  // ── Follow / Subscribe ─────────────────────────────────────────────────────
  readonly followButton: Locator;
  readonly unfollowButton: Locator;

  // ── Tab bar ────────────────────────────────────────────────────────────────
  readonly tabBar: Locator;
  readonly tabContent: Locator;
  readonly tabPlaylists: Locator;
  readonly tabAbout: Locator;
  readonly tabMembership: Locator;
  readonly tabDiscussion: Locator;

  // ── Content grid ───────────────────────────────────────────────────────────
  /** The outer container for the channel's main content section */
  readonly contentSection: Locator;
  /** Individual claim preview tiles in the content grid */
  readonly claimTiles: Locator;
  /** Claim tile thumbnails */
  readonly claimThumbnails: Locator;

  // ── Sort / filter controls ─────────────────────────────────────────────────
  readonly sortButton: Locator;
  readonly filterButton: Locator;

  // ── About section ──────────────────────────────────────────────────────────
  readonly aboutSection: Locator;
  readonly aboutDescription: Locator;
  readonly aboutEmail: Locator;
  readonly aboutWebsite: Locator;

  // ── Membership section ─────────────────────────────────────────────────────
  readonly membershipSection: Locator;
  readonly joinMembershipButton: Locator;

  // ── Discussion / comments ──────────────────────────────────────────────────
  readonly discussionSection: Locator;
  readonly commentsList: Locator;
  readonly commentInput: Locator;

  // ── Empty / loading states ─────────────────────────────────────────────────
  readonly spinner: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);

    // ── Channel header ────────────────────────────────────────────────────────
    this.channelBanner = page.locator('.channel-cover__custom, .claim-cover__wrapper').first();
    this.channelAvatar = page.locator('.channel-thumbnail, .claim-thumbnail--channel').first();
    this.channelName = page.locator('.channel-name, .claim-preview__title h1, [class*="channelTitle"]').first();
    this.subscriberCount = page.locator('.subscribers, [class*="subscriber"], [class*="sub-count"]').first();

    // ── Follow / Subscribe ────────────────────────────────────────────────────
    // Odysee renders follow as a button whose label toggles between
    // "Follow" and "Following" (and shows "Unfollow" on hover).
    this.followButton = page
      .getByRole('button', { name: /^follow$/i })
      .or(page.locator('.subscribe-button--subscribe, [class*="subscribeButton--subscribe"]'))
      .first();

    this.unfollowButton = page
      .getByRole('button', { name: /unfollow|following/i })
      .or(page.locator('.subscribe-button--unsubscribe, [class*="subscribeButton--unsubscribe"]'))
      .first();

    // ── Tab bar ───────────────────────────────────────────────────────────────
    this.tabBar = page.locator('.channel__sections, [role="tablist"]').first();

    // Individual tabs – prefer accessible roles, fall back to text matchers
    this.tabContent = page
      .getByRole('tab', { name: /^content$/i })
      .or(page.locator('[href*="?tab=content"], a:has-text("Content")'))
      .first();

    this.tabPlaylists = page
      .getByRole('tab', { name: /playlists/i })
      .or(page.locator('[href*="?tab=playlists"], a:has-text("Playlists")'))
      .first();

    this.tabAbout = page
      .getByRole('tab', { name: /about/i })
      .or(page.locator('[href*="?tab=about"], a:has-text("About")'))
      .first();

    this.tabMembership = page
      .getByRole('tab', { name: /membership/i })
      .or(page.locator('[href*="?tab=membership"], a:has-text("Membership")'))
      .first();

    this.tabDiscussion = page
      .getByRole('tab', { name: /discussion/i })
      .or(page.locator('[href*="?tab=discussion"], a:has-text("Discussion")'))
      .first();

    // ── Content grid ──────────────────────────────────────────────────────────
    this.contentSection = page.locator('.channel__content, [class*="channelContent"]').first();
    this.claimTiles = page.locator('.claim-preview--tile, .media__thumb, [class*="claimPreview--tile"]');
    this.claimThumbnails = page.locator('.claim-preview__title a').first();

    // ── Sort / filter controls ────────────────────────────────────────────────
    this.sortButton = page
      .getByRole('button', { name: /sort by/i })
      .or(page.locator('[class*="claimListHeader"] button').first());
    this.filterButton = page
      .getByRole('button', { name: /filter/i })
      .or(page.locator('.claim-list__header-filter').first());

    // ── About section ─────────────────────────────────────────────────────────
    this.aboutSection = page.locator('.channel-about, [class*="channelAbout"]').first();
    this.aboutDescription = page.locator('.channel-about__description, [class*="channelAbout__description"]').first();
    this.aboutEmail = page.locator('.channel-about__email, [class*="channelAbout__email"]').first();
    this.aboutWebsite = page.locator('.channel-about__website, [class*="channelAbout__website"]').first();

    // ── Membership section ────────────────────────────────────────────────────
    this.membershipSection = page.locator('[class*="membership"], .creator-memberships').first();
    this.joinMembershipButton = page.getByRole('button', { name: /join|become a member/i }).first();

    // ── Discussion / comments ──────────────────────────────────────────────────
    this.discussionSection = page.locator('.channel-discussion, [class*="channelDiscussion"]').first();
    this.commentsList = page.locator('.comments, [class*="commentsList"]').first();
    this.commentInput = page.locator('.commentCreate__input, [class*="commentCreate"] textarea').first();

    // ── Loading / empty states ────────────────────────────────────────────────
    this.spinner = page.locator('.spinner, [class*="spinner"]').first();
    this.emptyState = page.locator('.empty, [class*="empty-state"], .yrbl').first();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Navigate to a channel page and wait for it to load.
   * @param channelName  Channel handle with or without the leading `@`.
   * @param tab          Optional tab to land on.
   */
  async gotoChannel(
    channelName: string,
    tab?: 'content' | 'playlists' | 'about' | 'membership' | 'discussion'
  ): Promise<void> {
    const handle = channelName.startsWith('@') ? channelName : `@${channelName}`;
    const path = tab ? `/${handle}?tab=${tab}` : `/${handle}`;
    await this.goto(path);
    await this.waitForChannelLoad();
  }

  /**
   * Wait until the channel content has rendered (spinner gone, content visible).
   */
  async waitForChannelLoad(timeout = 20_000): Promise<void> {
    await this.waitForApp(timeout);
    // Wait for the spinner to disappear if it was showing
    await this.spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      // Spinner might not appear at all — that's fine
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tab navigation
  // ──────────────────────────────────────────────────────────────────────────

  /** Click the Content tab and wait for content to render. */
  async switchToContentTab(): Promise<void> {
    await this.tabContent.click();
    await this.page.waitForURL(/[?&]tab=content|\/@[^/]+$/, { timeout: 8_000 }).catch(() => {});
    await this.waitForChannelLoad();
  }

  /** Click the Playlists tab. */
  async switchToPlaylistsTab(): Promise<void> {
    await this.tabPlaylists.click();
    await this.page.waitForURL(/tab=playlists/, { timeout: 8_000 }).catch(() => {});
    await this.waitForChannelLoad();
  }

  /** Click the About tab and wait for the about section. */
  async switchToAboutTab(): Promise<void> {
    await this.tabAbout.click();
    await this.page.waitForURL(/tab=about/, { timeout: 8_000 }).catch(() => {});
    await this.aboutSection.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Click the Membership tab. */
  async switchToMembershipTab(): Promise<void> {
    await this.tabMembership.click();
    await this.page.waitForURL(/tab=membership/, { timeout: 8_000 }).catch(() => {});
    await this.waitForChannelLoad();
  }

  /** Click the Discussion tab. */
  async switchToDiscussionTab(): Promise<void> {
    await this.tabDiscussion.click();
    await this.page.waitForURL(/tab=discussion/, { timeout: 8_000 }).catch(() => {});
    await this.waitForChannelLoad();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Follow / Unfollow
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Click the Follow button and wait for the UI to update.
   * Assumes the user is already signed in.
   */
  async follow(): Promise<void> {
    await this.followButton.waitFor({ state: 'visible' });
    await this.followButton.click();
    // After following, the button label changes to "Following" / "Unfollow"
    await this.unfollowButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
  }

  /**
   * Click Unfollow and wait for the UI to revert to the Follow state.
   */
  async unfollow(): Promise<void> {
    await this.unfollowButton.waitFor({ state: 'visible' });
    await this.unfollowButton.click();
    await this.followButton.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
  }

  /**
   * Returns true when the channel is already being followed.
   */
  async isFollowing(): Promise<boolean> {
    return this.unfollowButton.isVisible();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Content grid
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns the number of claim tiles currently visible in the content grid.
   */
  async getContentTileCount(): Promise<number> {
    await this.claimTiles
      .first()
      .waitFor({ state: 'visible', timeout: 12_000 })
      .catch(() => {});
    return this.claimTiles.count();
  }

  /**
   * Returns the text label of the Nth tile (0-indexed).
   */
  async getTileTitle(index: number): Promise<string> {
    const tile = this.claimTiles.nth(index);
    const titleLocator = tile.locator('.claim-tile__title, [class*="claimTile__title"]').first();
    return titleLocator.innerText();
  }

  /**
   * Click the Nth tile and wait for the watch page to load.
   */
  async clickTile(index: number): Promise<void> {
    const tile = this.claimTiles.nth(index);
    await tile.click();
    await this.waitForApp();
  }

  /**
   * Scroll down and wait for new tiles to appear (infinite scroll).
   * Returns the new total tile count.
   */
  async loadMoreContent(): Promise<number> {
    const before = await this.claimTiles.count();
    await this.scrollToBottom();
    await this.page.waitForTimeout(1_500);
    const after = await this.claimTiles.count();
    return after;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // About section
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Returns the channel description text from the About tab.
   * Navigates to the About tab first if not already there.
   */
  async getDescription(): Promise<string> {
    if (!(await this.aboutSection.isVisible())) {
      await this.switchToAboutTab();
    }
    return this.aboutDescription.innerText().catch(() => '');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Channel metadata assertions
  // ──────────────────────────────────────────────────────────────────────────

  /** Assert the channel name heading is visible and (optionally) matches text. */
  async assertChannelName(expected?: string | RegExp): Promise<void> {
    await expect(this.channelName, 'Channel name should be visible').toBeVisible();
    if (expected !== undefined) {
      await expect(this.channelName).toHaveText(expected);
    }
  }

  /** Assert that at least one content tile is visible. */
  async assertHasContent(): Promise<void> {
    await expect(this.claimTiles.first(), 'Expected at least one content tile').toBeVisible();
  }

  /** Assert the content grid is empty (no tiles). */
  async assertNoContent(): Promise<void> {
    await expect(this.claimTiles).toHaveCount(0);
  }

  /** Assert the About tab description contains the given text. */
  async assertDescriptionContains(text: string | RegExp): Promise<void> {
    if (!(await this.aboutSection.isVisible())) {
      await this.switchToAboutTab();
    }
    await expect(this.aboutDescription).toContainText(text);
  }
}
