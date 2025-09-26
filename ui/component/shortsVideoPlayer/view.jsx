// @flow
import React from 'react';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  isMobile: boolean,
  sidePanelOpen: boolean,
  onInfoButtonClick: () => void,
  primaryPlayerWrapperClass: string,
};

const ShortsVideoPlayer = React.memo<Props>(
  ({ uri, isMobile, sidePanelOpen, onInfoButtonClick, primaryPlayerWrapperClass }: Props) => {
    return (
      <div className="shorts-page__video-section">
        <div className={`${SHORTS_PLAYER_WRAPPER_CLASS} ${primaryPlayerWrapperClass}`}>
          <VideoClaimInitiator uri={uri} />
        </div>

        {!isMobile && (
          <Button
            className="shorts-page__info-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={20}
            title={sidePanelOpen ? __('Hide Details') : __('Show Details')}
          />
        )}
      </div>
    );
  }
);

export default ShortsVideoPlayer;
