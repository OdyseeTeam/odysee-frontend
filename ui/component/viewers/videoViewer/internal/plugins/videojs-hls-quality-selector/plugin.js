/* eslint-disable */
import videojs from 'video.js';
import p from 'package.json';
import ConcreteButton from './ConcreteButton';
import ConcreteMenuItem from './ConcreteMenuItem';
import * as QUALITY_OPTIONS from 'constants/player';
import { VJS_EVENTS } from 'constants/player';

const { version: VERSION } = p;

// Default options for the plugin.
const defaults = {};

// Cross-compatibility for Video.js 5 and 6.
const registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * VideoJS HLS Quality Selector Plugin class.
 */
class HlsQualitySelectorPlugin {
  /**
   * Plugin Constructor.
   *
   * @param {Player} player - The videojs player instance.
   * @param {Object} options - The plugin options.
   */
  constructor(player, options) {
    this.player = player;
    this.config = options;

    // Ensure dependencies are met
    if (!this.player.qualityLevels) {
      console.error(`Error: Missing video.js quality levels plugin (required) - videojs-hls-quality-selector`);
      return;
    }

    this.setupPlugin();
  }

  setupPlugin() {
    // Create the quality button.
    this.createQualityButton();

    // Hide quality selector by default
    this._qualityButton.hide();

    // Bind event listeners
    this.bindPlayerEvents();

    // Listen for source changes
    this.player.on('loadedmetadata', (e) => {
      const { claimSrcVhs } = this.player;

      const initialQuality = this.createIOSQualityList() || this._initialQuality;

      // if there was a quality option selected to default to, set it using the setQuality function
      // as if it was being clicked on, on loadedmetadata
      if (initialQuality && !this._initialQualityHandled && claimSrcVhs) {
        this.setQuality(initialQuality);

        // Add this attribute to the video player so later it can be checked and avoid switching again
        // Since this is only for initial load, based on the default quality setting
        this._initialQualityHandled = true;
      }
      this.updatePlugin();
    });
  }

  updatePlugin() {
    if (videojs.browser.IS_IOS && this.player.isLivestream) {
      this._qualityButton.hide();
      return;
    }

    if (this.player?.appState?.originalVideoHeight || this.player.claimSrcVhs || this.player.isLivestream) {
      this._qualityButton.show();
    }
  }

  updateConfig() {
    this.config = {
      ...this.config,
      defaultQuality: this.player.appState.defaultQuality,
      originalVideoHeight: this.player.appState.originalVideoHeight,
    };
  }

  handleNoQualities() {
    if (
      this.player?.appState?.originalVideoHeight &&
      this._qualityButton &&
      !(this.player?.claimSrcVhs || this.player?.isLivestream)
    ) {
      const levelItem = this.getQualityMenuItem.call(this, {
        label: `${this.player.appState.originalVideoHeight}p`,
        value: this.player.appState.originalVideoHeight,
        selected: true,
      });
      this._qualityButton.createItems = function () {
        return [levelItem];
      };
      this._qualityButton.update();
      this.setButtonInnerText(`${this.player.appState.originalVideoHeight}p`);
    }
  }

  /**
   * Deprecated, returns VHS plugin
   *
   * @return {*} - videojs-http-streaming plugin.
   */
  getHls() {
    console.warn('hls-quality-selector: WARN: Using getHls options is deprecated. Use getVhs instead.');
    return this.getVhs();
  }

  /**
   * Returns VHS Plugin
   *
   * @return {*} - videojs-http-streaming plugin.
   */
  getVhs() {
    return this.player.tech({ IWillNotUseThisInPlugins: true }).vhs;
  }

  /**
   * Binds listener for quality level changes.
   */
  bindPlayerEvents() {
    this.player.qualityLevels().on('addqualitylevel', this.onAddQualityLevel.bind(this));
    this.player.on(VJS_EVENTS.SRC_CHANGED, this.updateConfig.bind(this));
    this.player.on(VJS_EVENTS.PLAYER_CLOSED, this.playerClosed.bind(this));

    // Handles quality selector with non-transcoded content (not sure where should be done, but works for now)
    this.player.on(VJS_EVENTS.SRC_CHANGED, this.handleNoQualities.bind(this));
  }

  /**
   * Adds the quality menu button to the player control bar.
   */
  createQualityButton() {
    const player = this.player;

    this._qualityButton = new ConcreteButton(player);

    const placementIndex = player.controlBar.children().length - 2;
    const concreteButtonInstance = player.controlBar.addChild(
      this._qualityButton,
      { componentClass: 'qualitySelector' },
      this.config.placementIndex || placementIndex
    );

    concreteButtonInstance.addClass('vjs-quality-selector');
    if (!this.config.displayCurrentQuality) {
      const icon = ` ${this.config.vjsIconClass || 'vjs-icon-hd'}`;

      concreteButtonInstance.menuButton_.$('.vjs-icon-placeholder').className += icon;
    } else {
      this.setButtonInnerText(QUALITY_OPTIONS.AUTO);
    }
    concreteButtonInstance.removeClass('vjs-hidden');
  }

  resolveOriginalQualityLabel(abbreviatedForm, includeResolution) {
    const { originalVideoHeight: videoHeight } = this.config;

    if (includeResolution && videoHeight) {
      return abbreviatedForm
        ? __('Orig (%quality%) --[Video quality popup. Short form.]--', { quality: videoHeight + 'p' })
        : __('Original (%quality%) --[Video quality popup. Long form.]--', {
            quality: videoHeight + 'p',
          });
    } else {
      // The allocated space for the button is fixed and happened to fit
      // "Original", so we don't abbreviate for English. But it will most likely
      // not fit for other languages, hence the 2 strings.
      return abbreviatedForm
        ? __('Original --[Video quality button. Abbreviate to fit space.]--')
        : __('Original --[Video quality button. Long form.]--');
    }
  }

  /**
   *Set inner button text.
   *
   * @param {string} text - the text to display in the button.
   */
  setButtonInnerText(text) {
    let str;
    switch (text) {
      case QUALITY_OPTIONS.AUTO:
        str = QUALITY_OPTIONS.AUTO;
        break;
      case QUALITY_OPTIONS.ORIGINAL:
        str = this.resolveOriginalQualityLabel(true, false);
        break;
      default:
        str = text;
        break;
    }

    this._qualityButton.menuButton_.$('.vjs-icon-placeholder').innerHTML = str;
  }

  /**
   * Builds individual quality menu items.
   *
   * @param {Object} item - Individual quality menu item.
   * @return {ConcreteMenuItem} - Menu item
   */
  getQualityMenuItem(item) {
    const player = this.player;

    return new ConcreteMenuItem(player, item, this._qualityButton, this);
  }

  playerClosed() {
    this._qualityButton.hide();
    delete this._initialQuality;
    delete this._initialQualityHandled;
  }

  createIOSQualityList() {
    // iOS doesn't have MSE to support manual quality selection. But the
    // native one sucks, so we provide "Auto" and "Original" so that users
    // can at least try with full resolution. 'addqualitylevel' will never
    // hit, so this change will be final.
    if (!videojs.browser.IS_IOS || this.player.isLivestream) {
      return null;
    }

    const player = this.player;
    const { defaultQuality } = this.config;
    const levelItems = [];

    const selectOriginal = defaultQuality ? defaultQuality === QUALITY_OPTIONS.ORIGINAL : false;

    levelItems.push(
      this.getQualityMenuItem.call(this, {
        label: this.resolveOriginalQualityLabel(false, false),
        value: QUALITY_OPTIONS.ORIGINAL,
        selected: false, // selectOriginal,
      })
    );

    levelItems.push(
      this.getQualityMenuItem.call(this, {
        label: QUALITY_OPTIONS.AUTO,
        value: QUALITY_OPTIONS.AUTO,
        selected: false, // !selectOriginal,
      })
    );

    if (this._qualityButton) {
      this._qualityButton.createItems = () => levelItems;
      this._qualityButton.update();
    }

    return selectOriginal ? QUALITY_OPTIONS.ORIGINAL : QUALITY_OPTIONS.AUTO;
  }

  /**
   * Executed when a quality level is added from HLS playlist.
   */
  onAddQualityLevel(e, qualityOption) {
    const player = this.player;
    const defaultQuality = qualityOption || this.config.defaultQuality;
    const qualityList = player.qualityLevels();
    const levels = qualityList.levels_ || [];

    let levelItems = [];
    let nextLowestQualityItem;
    let nextLowestQualityItemObj;

    for (let i = 0; i < levels.length; ++i) {
      const currentHeight = levels[i].height;

      if (!levelItems.filter((_existingItem) => _existingItem.item?.value === currentHeight).length) {
        const heightStr = currentHeight + 'p';

        const levelItem = this.getQualityMenuItem.call(this, {
          label: heightStr,
          value: currentHeight,
          selected: defaultQuality ? currentHeight === defaultQuality : undefined,
        });

        // Stop at index 0 since the list starts from max quality
        const isLiveOriginal = defaultQuality === QUALITY_OPTIONS.ORIGINAL && player.isLivestream && i === 0;
        const shouldCheckHeight =
          defaultQuality && !nextLowestQualityItem && (currentHeight <= defaultQuality || isLiveOriginal);

        if (shouldCheckHeight) {
          nextLowestQualityItem = levelItem;
          nextLowestQualityItemObj = {
            label: heightStr,
            value: currentHeight,
            selected: true,
          };
        }

        levelItems.push(levelItem);
      }
    }

    if (nextLowestQualityItem) {
      levelItems = levelItems.map((item) =>
        item === nextLowestQualityItem ? this.getQualityMenuItem.call(this, nextLowestQualityItemObj) : item
      );
    }

    levelItems.sort((current, next) => {
      if (typeof current !== 'object' || typeof next !== 'object') {
        return -1;
      }
      if (current.item.value < next.item.value) {
        return -1;
      }
      if (current.item.value > next.item.value) {
        return 1;
      }
      return 0;
    });

    if (!player.isLivestream) {
      levelItems.push(
        this.getQualityMenuItem.call(this, {
          label: this.resolveOriginalQualityLabel(false, true),
          value: QUALITY_OPTIONS.ORIGINAL,
          selected: defaultQuality ? defaultQuality === QUALITY_OPTIONS.ORIGINAL : false,
        })
      );
      if (defaultQuality === QUALITY_OPTIONS.ORIGINAL && !this._initialQualityHandled) {
        this.swapSrcTo(QUALITY_OPTIONS.ORIGINAL);
      }
    }

    levelItems.push(
      this.getQualityMenuItem.call(this, {
        label: QUALITY_OPTIONS.AUTO,
        value: QUALITY_OPTIONS.AUTO,
        selected: !defaultQuality ? true : defaultQuality === QUALITY_OPTIONS.AUTO,
      })
    );

    // initial button inner text based on default quality setting, or next lowest
    if (!this._initialQualityHandled) {
      this.setButtonInnerText(
        nextLowestQualityItemObj ? nextLowestQualityItemObj.label : defaultQuality || QUALITY_OPTIONS.AUTO
      );
    }

    if (this._qualityButton) {
      this._qualityButton.createItems = function () {
        return levelItems;
      };
      this._qualityButton.update();
    }

    if (defaultQuality) {
      this._initialQuality =
        nextLowestQualityItemObj?.value ||
        (defaultQuality === QUALITY_OPTIONS.ORIGINAL && QUALITY_OPTIONS.ORIGINAL) ||
        QUALITY_OPTIONS.AUTO;
    } else {
      delete this._initialQuality;
    }
  }

  swapSrcTo(mode = QUALITY_OPTIONS.ORIGINAL) {
    const currentTime = this.player.currentTime();
    const isAlreadyPlaying = !this.player.paused();
    this.player.src(mode === 'vhs' ? this.player.claimSrcVhs : this.player.claimSrcOriginal);

    // run this when new source is loaded
    this.player.one('loadstart', () => {
      // fixes a bug where when reusing vjs instance the player doesn't play
      // when it should and the control bar is hidden when changing quality
      this.player.currentTime(currentTime);
      if (isAlreadyPlaying) {
        this.player.play();
      } else {
        // show control bar
        this.player.addClass('vjs-has-started');
        this.player.addClass('vjs-playing');
        this.player.addClass('vjs-paused');
      }
    });
    this.player.load();

    assert(mode === 'vhs' || mode === QUALITY_OPTIONS.ORIGINAL, 'Unexpected input');
  }

  /**
   * Sets quality (based on media height)
   *
   * @param {number} height - A number representing HLS playlist.
   * @param {boolean} fromUser - true if the change is from the user (click), false if called internally.
   */
  setQuality(height, fromUser = false) {
    if (this.setQualityIOS(height)) {
      this.player.trigger(fromUser ? 'hlsQualitySelector:changed:user' : 'hlsQualitySelector:changed:internal');
      return;
    }

    const qualityList = this.player.qualityLevels();

    // Set quality on plugin
    this._currentQuality = height;

    if (this.config.displayCurrentQuality) {
      this.setButtonInnerText(
        height === QUALITY_OPTIONS.AUTO
          ? QUALITY_OPTIONS.AUTO
          : height === QUALITY_OPTIONS.ORIGINAL
          ? QUALITY_OPTIONS.ORIGINAL
          : `${height}p`
      );
    }

    for (let i = 0; i < qualityList.length; ++i) {
      const quality = qualityList[i];
      quality.enabled =
        quality.height === height || height === QUALITY_OPTIONS.AUTO || height === QUALITY_OPTIONS.ORIGINAL;
    }

    if (height === QUALITY_OPTIONS.ORIGINAL) {
      if (this.player.currentSrc() !== this.player.claimSrcOriginal.src) {
        setTimeout(() => this.swapSrcTo(QUALITY_OPTIONS.ORIGINAL));
      }
    } else {
      if (!this.player.isLivestream && this.player.currentSrc() !== this.player.claimSrcVhs.src) {
        setTimeout(() => this.swapSrcTo('vhs'));

        if (height !== 'auto') {
          // -- Re-select quality --
          // Until we have "persistent quality" implemented, we need to do this
          // because the VHS internals default to "auto" when initialized,
          // causing a GUI mismatch.
          setTimeout(() => {
            this.setQuality(height);
            this.onAddQualityLevel(undefined, height);
          }, 1000);
        }
      }
    }

    this._qualityButton.unpressButton();
    this.player.trigger(fromUser ? 'hlsQualitySelector:changed:user' : 'hlsQualitySelector:changed:internal');
  }

  /**
   *
   * @param height
   * @returns {boolean} true if completely overridden and handled (no more action needed), false otherwise.
   */
  setQualityIOS(height) {
    if (!videojs.browser.IS_IOS || this.player.isLivestream) {
      return false;
    }

    assert(height === QUALITY_OPTIONS.AUTO || height === QUALITY_OPTIONS.ORIGINAL);

    this._currentQuality = height;

    if (this.config.displayCurrentQuality) {
      this.setButtonInnerText(height === QUALITY_OPTIONS.ORIGINAL ? QUALITY_OPTIONS.ORIGINAL : QUALITY_OPTIONS.AUTO);
    }

    if (height === QUALITY_OPTIONS.ORIGINAL) {
      if (this.player.currentSrc() !== this.player.claimSrcOriginal.src) {
        console.log('swaping to original');
        setTimeout(() => this.swapSrcTo(QUALITY_OPTIONS.ORIGINAL));
      }
    } else {
      if (!this.player.isLivestream && this.player.currentSrc() !== this.player.claimSrcVhs.src) {
        setTimeout(() => this.swapSrcTo('vhs'));
      }
    }

    this._qualityButton.unpressButton();
    return true;
  }

  /**
   * Return the current set quality or 'auto'
   *
   * @return {string} the currently set quality
   */
  getCurrentQuality() {
    return this._currentQuality || QUALITY_OPTIONS.AUTO;
  }
}

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */
const onPlayerReady = (player, options) => {
  player.addClass('vjs-hls-quality-selector');
  player.hlsQualitySelector = new HlsQualitySelectorPlugin(player, options);
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * ====================================
 * --Spewed events--
 *   "hlsQualitySelector:changed:internal" - Selection changed from internal event, e.g. new video loaded.
 *   "hlsQualitySelector:changed:user"     - Selection changed by the user.
 * ====================================
 *
 * @function hlsQualitySelector
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
const hlsQualitySelector = function (options: HlsQualitySelectorOptions) {
  this.ready(() => {
    onPlayerReady(this, videojs.mergeOptions(defaults, options));
  });
};

// Register the plugin with video.js.
registerPlugin('hlsQualitySelector', hlsQualitySelector);

// Include the version number.
hlsQualitySelector.VERSION = VERSION;

export default hlsQualitySelector;
/* eslint-enable */
