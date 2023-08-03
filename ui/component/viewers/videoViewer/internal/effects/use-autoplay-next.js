/**
 * Videojs "Autoplay Next" button.
 *
 * --- How to use ---
 * Apply `useAutoplayNext` in your React component. It registers an effect that
 * listens to the given Redux state, and returns a callback for you to mount the
 * custom videojs component.
 *
 * --- Notes ---
 * Usually, custom videojs components can just listen to videojs events, query
 * states from `player` (e.g. player.paused()) and update accordingly. But since
 * the state comes from Redux, there will be a need to listen and pass the info
 * to videojs somehow.
 *
 * Instead of going through an 'effect->css->videojs' trip, we'll just listen to
 * the Redux state through a normal effect to update the component.
 *
 * This file aims to encapsulate both the React and Videojs side of things
 * through a single `useAutoplayNext` call.
 */

// @flow
import React from 'react';
import videojs from 'video.js';
import type { Player } from '../videojs';
import { VJS_COMP } from 'constants/player';

// ****************************************************************************
// AutoplayNextButton
// ****************************************************************************

class AutoplayNextButton extends videojs.getComponent('Button') {
  constructor(player, options = {}, autoplayNext) {
    super(player, options, autoplayNext);
    const title = __(autoplayNext ? 'Autoplay Next On' : 'Autoplay Next Off');

    this.controlText(title);
    this.addClass('vjs-button--autoplay-next');
    this.setAttribute('aria-label', title);
    this.setAttribute('aria-checked', autoplayNext);

    this.hide();
  }
}

function addAutoplayNextButton(player: Player, toggleAutoplayNext: () => void, autoplayNext: boolean) {
  const controlBar = player.controlBar;

  const autoplayButton = new AutoplayNextButton(
    player,
    {
      name: VJS_COMP.AUTOPLAY_NEXT_BUTTON,
      text: 'Autoplay Next',
      clickHandler: () => {
        toggleAutoplayNext();
      },
    },
    autoplayNext
  );

  if (controlBar) {
    controlBar.addChild(autoplayButton);
  }
}

// ****************************************************************************
// useAutoplayNext
// ****************************************************************************

export default function useAutoplayNext(playerRef: any, autoplayNext: boolean, isMarkdownOrComment: boolean) {
  React.useEffect(() => {
    const player = playerRef.current;
    if (player && !isMarkdownOrComment) {
      const touchOverlay = player.getChild('TouchOverlay');
      const controlBar = player.getChild('controlBar') || touchOverlay.getChild('controlBar');
      const autoplayButton = controlBar.getChild(VJS_COMP.AUTOPLAY_NEXT_BUTTON);

      if (autoplayButton) {
        const title = autoplayNext ? __('Autoplay Next On') : __('Autoplay Next Off');

        autoplayButton.controlText(title);
        autoplayButton.setAttribute('aria-label', title);
        autoplayButton.setAttribute('aria-checked', autoplayNext);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [autoplayNext, isMarkdownOrComment]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.trigger(`${VJS_COMP.AUTOPLAY_NEXT_BUTTON}::onState`, autoplayNext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- I think listening to refs don't work?
  }, [autoplayNext]);

  return addAutoplayNextButton;
}
