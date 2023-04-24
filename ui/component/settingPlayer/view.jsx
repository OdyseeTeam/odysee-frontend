// @flow
import React from 'react';
import * as SETTINGS from 'constants/settings';
import { SETTINGS_GRP } from 'constants/settings';
import Card from 'component/common/card';
import { FormField } from 'component/common/form';
import SettingsRow from 'component/settingsRow';
import SettingDefaultQuality from 'component/settingDefaultQuality';

type Props = {
  // --- select ---
  floatingPlayer: boolean,
  autoplayMedia: boolean,
  autoplayNext: boolean,
  isFloating: boolean,
  // --- perform ---
  setClientSetting: (string, boolean | string | number) => void,
  clearPlayingUri: () => void,
};

export default function SettingPlayer(props: Props) {
  const { floatingPlayer, autoplayMedia, autoplayNext, isFloating, setClientSetting, clearPlayingUri } = props;

  return (
    <>
      <div className="card__title-section">
        <h2 className="card__title">{__('Player settings')}</h2>
      </div>
      <Card
        id={SETTINGS_GRP.PLAYER}
        background
        isBodyList
        body={
          <>
            <SettingsRow title={__('Floating video player')} subtitle={__(HELP.FLOATING_PLAYER)}>
              <FormField
                type="checkbox"
                name="floating_player"
                onChange={() => {
                  setClientSetting(SETTINGS.FLOATING_PLAYER, !floatingPlayer);
                  if (isFloating && !floatingPlayer === false) clearPlayingUri();
                }}
                checked={floatingPlayer}
              />
            </SettingsRow>

            <SettingsRow title={__('Autoplay media files')} subtitle={__(HELP.AUTOPLAY_MEDIA)}>
              <FormField
                type="checkbox"
                name="autoplay media"
                onChange={() => setClientSetting(SETTINGS.AUTOPLAY_MEDIA, !autoplayMedia)}
                checked={autoplayMedia}
              />
            </SettingsRow>

            <SettingsRow title={__('Autoplay next recommended content')} subtitle={__(HELP.AUTOPLAY_NEXT)}>
              <FormField
                type="checkbox"
                name="autoplay next"
                onChange={() => setClientSetting(SETTINGS.AUTOPLAY_NEXT, !autoplayNext)}
                checked={autoplayNext}
              />
            </SettingsRow>

            <SettingsRow title={__('Default Video Quality')} subtitle={__(HELP.DEFAULT_VIDEO_QUALITY)}>
              <SettingDefaultQuality />
            </SettingsRow>
          </>
        }
      />
    </>
  );
}

// prettier-ignore
const HELP = {
  FLOATING_PLAYER: 'Keep content playing in the corner when navigating to a different page.',
  AUTOPLAY_MEDIA: 'Autoplay video and audio files when navigating to a file.',
  AUTOPLAY_NEXT: 'Autoplay the next related item when a file (video or audio) finishes playing.',
  DEFAULT_VIDEO_QUALITY: 'Set a default quality for video playback. If the default choice is not available, the next lowest will be used when playback starts.',
};
