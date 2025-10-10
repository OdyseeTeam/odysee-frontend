// @flow
import React from 'react';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';

type Props = {
  hasPlaylist: boolean,
  onNext: () => void,
  onPrevious: () => void,
  isLoading?: boolean,
  currentIndex?: number,
  totalVideos?: number,
  isAtStart?: boolean,
  isAtEnd?: boolean,
  autoPlayNextShort: boolean,
  doToggleShortsAutoplay: () => void,
};

const ShortsNavigation = React.memo<Props>(
  ({ hasPlaylist, onNext, onPrevious, isLoading, currentIndex = -1, totalVideos = 0, isAtStart, isAtEnd, autoPlayNextShort, doToggleShortsAutoplay }: Props) => {
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
        <Button
          className={classnames('shorts-page__nav-button button-bubble', {
            'button-bubble--active': autoPlayNextShort,
          })}
          title={__('Autoplay Next')}
          onClick={doToggleShortsAutoplay}
          icon={ICONS.AUTOPLAY_NEXT}
          iconSize={24}
        />
      </div>
    );
  }
);

export default ShortsNavigation;
