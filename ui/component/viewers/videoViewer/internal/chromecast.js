// @flow

let gTitle = '';
let gChannelTitle = '';

/**
 * Wrapper for @silvermine/videojs-chromecast to consolidate all things related
 * to chromecast.
 */
export default class Chromecast {
  /**
   * Actions that need to happen after initializing 'videojs'
   */
  static initialize(player: any) {
    // --- Wrap player methods to be safe after disposal ---
    // The silvermine chromecast plugin has an interval that may fire after player disposal
    // and try to call player.on()/trigger(), causing "Invalid target for null#..." errors
    const originalOn = player.on.bind(player);
    player.on = function (...args: any) {
      if (player.isDisposed()) {
        return player; // Return player for chaining, but do nothing
      }
      return originalOn(...args);
    };

    const originalTrigger = player.trigger.bind(player);
    player.trigger = function (...args: any) {
      if (player.isDisposed()) {
        return player;
      }
      return originalTrigger(...args);
    };

    // --- Start plugin ---
    // player.chromecast();
    // window.odysee.chromecast.createChromecastButton()
    // --- Init cast framework ---
    /*
    const CHROMECAST_API_SCRIPT_ID = 'chromecastApi';
    const existingChromecastScript = document.getElementById(CHROMECAST_API_SCRIPT_ID);
    if (!existingChromecastScript) {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.id = CHROMECAST_API_SCRIPT_ID;
      // $FlowFixMe
      document.body.appendChild(script);
    }
    */
  }

  /**
   * Clean up chromecast plugin before player disposal.
   * The silvermine-chromecast plugin has an internal interval that can cause
   * errors if it fires after the player is disposed.
   */
  static cleanup(player: any) {
    if (!player) return;

    try {
      // Try to access and dispose the chromecast plugin if it exists
      const chromecastPlugin = player.chromecast_;
      if (chromecastPlugin) {
        // Manually clear the interval that waits for Cast framework
        // The silvermine plugin stores it on _intervalID
        if (chromecastPlugin._intervalID) {
          clearInterval(chromecastPlugin._intervalID);
          chromecastPlugin._intervalID = null;
        }
        // Also check the session manager for any intervals
        if (chromecastPlugin._sessionManager && chromecastPlugin._sessionManager._intervalID) {
          clearInterval(chromecastPlugin._sessionManager._intervalID);
          chromecastPlugin._sessionManager._intervalID = null;
        }
        if (typeof chromecastPlugin.dispose === 'function') {
          chromecastPlugin.dispose();
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  /**
   * A React-to-vjs interface to pass the new content and channel titles to the
   * chromecast plugin.  Inline functions cannot be used in the `chromecast`
   * property in `videoJsOptions` due to stale closure, since we no longer
   * dispose the player when the src changes.
   *
   * We need this info from React because are unable to derive them from the
   * `src` argument of `requestTitleFn | requestSubtitleFn`.
   *
   * @param title
   * @param channelTitle
   */
  static updateTitles(title: ?string, channelTitle: ?string) {
    gTitle = title;
    gChannelTitle = channelTitle;
  }

  /**
   * Returns the required 'chromecast' options to be appended to the videojs
   * options object.
   */
  static getOptions() {
    return {
      chromecast: {
        requestTitleFn: (src: ?string) => gTitle || '',
        requestSubtitleFn: (src: ?string) => gChannelTitle || '',
        receiverAppID: 'FD107797',
      },
    };
  }
}
