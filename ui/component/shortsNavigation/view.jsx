// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

type Props = {
  hasPlaylist: boolean,
  onNext: () => void,
  onPrevious: () => void,
  isLoading?: boolean,
  currentIndex?: number,
  totalVideos?: number,
  isAtStart?: boolean,
  isAtEnd?: boolean,
};

const ShortsNavigation = React.memo<Props>(
  ({ hasPlaylist, onNext, onPrevious, isLoading, currentIndex = -1, totalVideos = 0, isAtStart, isAtEnd }: Props) => {
    if (!hasPlaylist) return null;

    return (
      <div className="shorts-page__navigation">
        <Button
          className="shorts-page__nav-button shorts-page__nav-button--previous"
          onClick={onPrevious}
          icon={ICONS.UP}
          iconSize={24}
          title={__('Previous Short')}
          disabled={isLoading || isAtStart}
        />
        <Button
          className="shorts-page__nav-button shorts-page__nav-button--next"
          onClick={onNext}
          icon={ICONS.DOWN}
          iconSize={24}
          title={__('Next Short')}
          description={totalVideos > 0 ? `${Math.max(currentIndex + 1, 1)} of ${totalVideos}` : undefined}
          disabled={isLoading || isAtEnd}
        />
      </div>
    );
  }
);

export default ShortsNavigation;
