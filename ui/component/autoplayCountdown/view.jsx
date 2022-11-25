// @flow
import React from 'react';
import Button from 'component/button';
import UriIndicator from 'component/uriIndicator';
import I18nMessage from 'component/i18nMessage';
import { withRouter } from 'react-router';
import debounce from 'util/debounce';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';

const DEBOUNCE_SCROLL_HANDLER_MS = 150;
const CLASSNAME_AUTOPLAY_COUNTDOWN = 'autoplay-countdown';

/* this value is coupled with CSS timing variables on .autoplay-countdown__timer */
const COUNTDOWN_TIME = 5;

type Props = {
  uri?: string,
  playNextUri: string,
  playPreviousUri?: string,
  doReplay: () => void,
  onCancel: () => void,
  // -- redux --
  playNextClaimTitle: ?string,
  modal: { id: string, modalProps: {} },
  isMature: boolean,
  isFloating: boolean,
  canPlayback: ?boolean,
  doOpenModal: (id: string, props: {}) => void,
  doPlayNextUri: (params: { uri: string }) => void,
  doSetShowAutoplayCountdownForUri: (params: { uri: string, show: boolean }) => void,
};

function AutoplayCountdown(props: Props) {
  const {
    uri,
    playNextUri,
    playPreviousUri,
    doReplay,
    onCancel,
    // -- redux --
    playNextClaimTitle,
    modal,
    isMature,
    isFloating,
    canPlayback,
    doOpenModal,
    doPlayNextUri,
    doSetShowAutoplayCountdownForUri,
  } = props;

  const [timer, setTimer] = React.useState(COUNTDOWN_TIME);
  const [timerCanceled, setTimerCanceled] = React.useState(false);
  const [timerPaused, setTimerPaused] = React.useState(false);
  const anyModalPresent = modal !== undefined && modal !== null;
  const isTimerPaused = timerPaused || anyModalPresent;
  const skipPaid = false;

  const handleCloseCountdown = React.useCallback(() => setTimerCanceled(true), []);

  const handlePlayNext = React.useCallback(
    (uri: string) => {
      handleCloseCountdown();
      doPlayNextUri({ uri });
    },
    [doPlayNextUri, handleCloseCountdown]
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
                  setTimerCanceled(true);
                  handleCloseCountdown();
                  if (!isFloating) {
                    doSetShowAutoplayCountdownForUri({ uri, show: false });
                  }
                  if (onCancel) onCancel();
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

          <div>
            <Button
              label={isMature ? undefined : skipPaid ? __('Purchase?') : __('Replay?')}
              button="link"
              icon={isMature ? undefined : skipPaid ? ICONS.WALLET : ICONS.REPLAY}
              onClick={() => {
                setTimerCanceled(true);
                if (skipPaid) {
                  doOpenModal(MODALS.AFFIRM_PURCHASE, { uri, cancelCb: () => setTimerCanceled(false) });
                } else {
                  doReplay();
                  handleCloseCountdown();
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(AutoplayCountdown);
