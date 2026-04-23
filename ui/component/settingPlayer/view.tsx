import React from 'react';
import * as SETTINGS from 'constants/settings';
import { SETTINGS_GRP } from 'constants/settings';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';
import SettingDefaultQuality from 'component/settingDefaultQuality';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doClearPlayingUri } from 'redux/actions/content';
import { doSetClientSetting } from 'redux/actions/settings';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectIsPlayerFloating } from 'redux/selectors/content';

export default function SettingPlayer() {
  const dispatch = useAppDispatch();
  const floatingPlayer = useAppSelector((state) => selectClientSetting(state, SETTINGS.FLOATING_PLAYER));
  const autoplayMedia = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA));
  const autoplayNext = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT));
  const disableShortsView = useAppSelector((state) => selectClientSetting(state, SETTINGS.DISABLE_SHORTS_VIEW));
  const p2pDelivery = useAppSelector((state) => selectClientSetting(state, SETTINGS.P2P_DELIVERY));
  const pipEnabledSetting = useAppSelector((state) => selectClientSetting(state, SETTINGS.PIP_ENABLED));
  const pipEnabled = pipEnabledSetting === undefined ? true : Boolean(pipEnabledSetting);
  const isFloating = useAppSelector(selectIsPlayerFloating);

  const setClientSetting = (key: string, value: boolean | string | number) => dispatch(doSetClientSetting(key, value));
  const clearPlayingUri = () => dispatch(doClearPlayingUri());

  React.useEffect(() => {
    if (window.cordova) {
      window.odysee = window.odysee || {};
      window.odysee.settings = window.odysee.settings || {};
      window.odysee.settings.pip = pipEnabled;
    }
  }, [pipEnabled]);

  return <>
      <Card id={SETTINGS_GRP.PLAYER} background isBodyList title={__('Player settings')} body={<>
            {window.cordova && (
              <SettingsRow title={__('Picture-in-Picture')} subtitle={__(HELP.PIP_ENABLED)}>
                <FormField type="checkbox" name="pip_enabled" onChange={() => setClientSetting(SETTINGS.PIP_ENABLED, !pipEnabled)} checked={pipEnabled} />
              </SettingsRow>
            )}

            <SettingsRow title={__('Floating video player')} subtitle={__(HELP.FLOATING_PLAYER)}>
              <FormField type="checkbox" name="floating_player" onChange={() => {
          setClientSetting(SETTINGS.FLOATING_PLAYER, !floatingPlayer);
          if (isFloating && !( !floatingPlayer)) clearPlayingUri();
        }} checked={floatingPlayer} />
            </SettingsRow>

            <SettingsRow title={__('Autoplay media files')} subtitle={__(HELP.AUTOPLAY_MEDIA)}>
              <FormField type="checkbox" name="autoplay media" onChange={() => setClientSetting(SETTINGS.AUTOPLAY_MEDIA, !autoplayMedia)} checked={autoplayMedia} />
            </SettingsRow>

            <SettingsRow title={__('Autoplay next recommended content')} subtitle={__(HELP.AUTOPLAY_NEXT)}>
              <FormField type="checkbox" name="autoplay next" onChange={() => setClientSetting(SETTINGS.AUTOPLAY_NEXT, !autoplayNext)} checked={autoplayNext} />
            </SettingsRow>

            <SettingsRow title={__('Default Video Quality')} subtitle={__(HELP.DEFAULT_VIDEO_QUALITY)}>
              <SettingDefaultQuality />
            </SettingsRow>

            <SettingsRow title={__('Disable Shorts View')} subtitle={__(HELP.DISABLE_SHORTS_VIEW)}>
              <FormField type="checkbox" name="disable shorts view" onChange={() => setClientSetting(SETTINGS.DISABLE_SHORTS_VIEW, !disableShortsView)} checked={disableShortsView} />
            </SettingsRow>

            <SettingsRow title={__('P2P Stream Delivery')} subtitle={__(HELP.P2P_DELIVERY)}>
              <FormField type="checkbox" name="p2p_delivery" onChange={() => setClientSetting(SETTINGS.P2P_DELIVERY, !p2pDelivery)} checked={p2pDelivery} />
            </SettingsRow>
          </>} />
    </>;
} // prettier-ignore

const HELP = {
  FLOATING_PLAYER: 'Keep content playing in the corner when navigating to a different page.',
  AUTOPLAY_MEDIA: 'Autoplay video and audio files when navigating to a file.',
  DISABLE_SHORTS_VIEW: 'Vertical content will use the standard view and video player.',
  AUTOPLAY_NEXT: 'Autoplay the next related item when a file (video or audio) finishes playing.',
  DEFAULT_VIDEO_QUALITY:
    'Set a default quality for video playback. If the default choice is not available, the next lowest will be used when playback starts. At this time, not all videos have multiple quality options, in which case the original quality will be used.',
  P2P_DELIVERY:
    'Enable peer-to-peer delivery for livestreams. Uses WebRTC for low-latency playback and shares stream segments with other viewers. Your IP address will be visible to the streaming server and other viewers. Off by default for privacy.',
  PIP_ENABLED: 'Automatically enter Picture-in-Picture when sending the app to the background.',
};
