import React from 'react';
import * as SETTINGS from 'constants/settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectPrefsReady } from 'redux/selectors/sync';
import './style.scss';

type Props = {
  onEnable: () => void;
};

export default function LivestreamWebrtcOptIn({ onEnable }: Props) {
  const dispatch = useAppDispatch();
  const p2pEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const dismissed = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_OPT_IN_DISMISSED));
  const prefsReady = useAppSelector(selectPrefsReady);

  if (p2pEnabled || dismissed) return null;

  function handleEnableOnce() {
    dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true));
    onEnable();
  }

  function handleEnableAlways() {
    dispatch(doSetClientSetting(SETTINGS.P2P_DELIVERY, true, prefsReady));
    onEnable();
  }

  function handleDismiss() {
    dispatch(doSetClientSetting(SETTINGS.P2P_OPT_IN_DISMISSED, true, prefsReady));
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
          <p className="webrtc-opt-in__title">{__('P2P streaming available')}</p>
          <p className="webrtc-opt-in__subtitle">
            {__('Share stream data with other viewers to reduce load. Your IP may be visible to peers.')}
          </p>
        </div>
        <div className="webrtc-opt-in__actions">
          <button className="webrtc-opt-in__btn webrtc-opt-in__btn--primary" onClick={handleEnableOnce}>
            {__('Try it')}
          </button>
          <button className="webrtc-opt-in__btn webrtc-opt-in__btn--secondary" onClick={handleEnableAlways}>
            {__('Always')}
          </button>
          <button className="webrtc-opt-in__btn webrtc-opt-in__btn--dismiss" onClick={handleDismiss} title={__('Dismiss')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
