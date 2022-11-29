// @flow
import React from 'react';
import Button from 'component/button';
import UriIndicator from 'component/uriIndicator';
import I18nMessage from 'component/i18nMessage';
import debounce from 'util/debounce';
import * as ICONS from 'constants/icons';

const DEBOUNCE_SCROLL_HANDLER_MS = 150;
const CLASSNAME_AUTOPLAY_COUNTDOWN = 'autoplay-countdown';

/* this value is coupled with CSS timing variables on .autoplay-countdown__timer */
const COUNTDOWN_TIME = 5;

type Props = {
  uri?: string,
  onCancel: () => void,

  // -- withPlaybackUris HOC --
  playNextUri: ?string,
  playPreviousUri?: string,

  // -- redux --
  playNextClaimTitle: ?string,
  modal: { id: string, modalProps: {} },
  isMature: boolean,
  isFloating: boolean,
  canPlayback: ?boolean,
  hasUriPlaying: boolean,
  doPlayNextUri: (params: { uri: string }) => void,
  doSetShowAutoplayCountdownForUri: (params: { uri: string, show: boolean }) => void,
};

function AutoplayCountdown(props: Props) {
  const {
    uri,
    onCancel,

    // -- withPlaybackUris HOC --
    playNextUri,
    playPreviousUri,

    // -- redux --
    playNextClaimTitle,
    modal,
    isMature,
    isFloating,
    canPlayback,
    hasUriPlaying,
    doPlayNextUri,
    doSetShowAutoplayCountdownForUri,
  } = props;

  const [timer, setTimer] = React.useState(COUNTDOWN_TIME);
  const [timerCanceled, setTimerCanceled] = React.useState(false);
  const [timerPaused, setTimerPaused] = React.useState(false);
  const anyModalPresent = modal !== undefined && modal !== null;
  const isTimerPaused = timerPaused || anyModalPresent;

  const handleStopCountdown = React.useCallback(() => {
    setTimerCanceled(true);
    onCancel();
  }, [onCancel]);

  const handleCloseCountdown = React.useCallback(() => {
    handleStopCountdown();
    doSetShowAutoplayCountdownForUri({ uri, show: false });
  }, [doSetShowAutoplayCountdownForUri, handleStopCountdown, uri]);

  const handlePlayNext = React.useCallback(
    (uri: string) => {
      handleStopCountdown();
      doPlayNextUri({ uri });
    },
    [doPlayNextUri, handleStopCountdown]
  );

  function isAnyInputFocused() {
    const activeElement = document.activeElement;
    const inputTypes = ['input', 'select', 'textarea'];
    return activeElement && inputTypes.includes(activeElement.tagName.toLowerCase());
  }

  function shouldPauseAutoplay() {
    // TODO: use ref instead querySelector
    const elm = document.querySelector(`.${CLASSNAME_AUTOPLAY_COUNTDOWN}`);
    return isAnyInputFocused() || (elm && elm.getBoundingClientRect().top < 0);
  }

  React.useEffect(() => {
    setTimerCanceled(false);
  }, [uri]);

  // Update 'setTimerPaused'.
  React.useEffect(() => {
    // Ensure correct 'setTimerPaused' on initial render.
    setTimerPaused(shouldPauseAutoplay());

    const handleScroll = debounce((e) => {
      setTimerPaused(shouldPauseAutoplay());
    }, DEBOUNCE_SCROLL_HANDLER_MS);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update countdown timer.
  React.useEffect(() => {
    let interval;
    if (!timerCanceled && playNextUri) {
      if (isTimerPaused || isAnyInputFocused()) {
        clearInterval(interval);
        setTimer(COUNTDOWN_TIME);
      } else {
        interval = setInterval(() => {
          const newTime = timer - 1;
          if (newTime === 0) {
            if (isMature) setTimer(COUNTDOWN_TIME);
            handlePlayNext(playNextUri);
          } else {
            setTimer(timer - 1);
          }
        }, 1000);
      }
    }
    return () => {
      clearInterval(interval);
    };
  }, [handlePlayNext, isTimerPaused, playNextUri, isMature, timer, timerCanceled]);

  if (timerCanceled || !playNextUri) {
    return null;
  }

  return (
    <div className="file-viewer__overlay">
      <div className={CLASSNAME_AUTOPLAY_COUNTDOWN}>
        <div className="file-viewer__overlay-secondary">
          <I18nMessage tokens={{ channel: <UriIndicator link uri={playNextUri} /> }}>Up Next by %channel%</I18nMessage>
        </div>

        <div className="file-viewer__overlay-title">{playNextClaimTitle}</div>
        <div className="autoplay-countdown__timer">
          <div className={'autoplay-countdown__button autoplay-countdown__button--' + (timer % 5)}>
            <Button
              onClick={() => handlePlayNext(playNextUri)}
              iconSize={30}
              title={__('Play')}
              className="button--icon button--play"
            />
          </div>

          {isTimerPaused ? (
            <div className="file-viewer__overlay-secondary autoplay-countdown__counter">
              {__('Autoplay timer paused.')}
            </div>
          ) : (
            <div className="file-viewer__overlay-secondary autoplay-countdown__counter">
              {__(
                !canPlayback
                  ? 'Skipping to next playable content in %seconds_left% seconds...'
                  : 'Playing in %seconds_left% seconds...',
                { seconds_left: timer }
              ) + ' '}

              <Button
                label={__('Cancel')}
                button="link"
                onClick={() => {
                  handleStopCountdown();

                  // Don't close the floating player when cancelling an auto-skip unplayable countdown
                  // so that it can still be used for navigation
                  if (!isFloating || canPlayback) {
                    doSetShowAutoplayCountdownForUri({ uri, show: false });
                  }
                }}
              />
            </div>
          )}

          {playPreviousUri && (
            <Button
              label={__('Play Previous')}
              button="link"
              icon={ICONS.PLAY_PREVIOUS}
              onClick={() => handlePlayNext(playPreviousUri)}
            />
          )}

          {hasUriPlaying && window.player && (
            <div>
              <Button
                label={__('Replay?')}
                button="link"
                icon={ICONS.REPLAY}
                onClick={() => {
                  handleCloseCountdown();

                  window.player.currentTime(0);
                  window.player.play();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutoplayCountdown;
