import React from 'react';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import './style.scss';

type Props = {
  /** Called when the user enables WebRTC (either permanently or just this session) */
  onEnable: () => void;
};

export default function LivestreamWebrtcOptIn({ onEnable }: Props) {
  const dispatch = useAppDispatch();
  const webrtcEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const prefsReady = useAppSelector(selectPrefsReady);
  const [dismissed, setDismissed] = React.useState(false);

  // If already enabled globally, don't show
  if (webrtcEnabled || dismissed) return null;

  function handleEnableOnce() {
    onEnable();
    setDismissed(true);
  }

  function handleEnableAlways() {
    dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true, prefsReady));
    onEnable();
    setDismissed(true);
  }

  return (
    <div className="webrtc-opt-in">
      <div className="webrtc-opt-in__content">
        <div className="webrtc-opt-in__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="webrtc-opt-in__text">
          <p className="webrtc-opt-in__title">{__('Low-latency P2P stream available')}</p>
          <p className="webrtc-opt-in__subtitle">
            {__('WebRTC provides near-instant latency. Your IP address will be visible to the streaming server.')}
          </p>
        </div>
        <div className="webrtc-opt-in__actions">
          <button className="webrtc-opt-in__btn webrtc-opt-in__btn--primary" onClick={handleEnableOnce}>
            {__('Try it')}
          </button>
          <button className="webrtc-opt-in__btn webrtc-opt-in__btn--secondary" onClick={handleEnableAlways}>
            {__('Always use')}
          </button>
        </div>
      </div>
    </div>
  );
}
