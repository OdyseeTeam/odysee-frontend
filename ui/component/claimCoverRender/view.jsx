// @flow
import React from 'react';
import classnames from 'classnames';

import * as RENDER_MODES from 'constants/file_render_modes';

import { useIsMobile } from 'effects/use-screensize';
import { EmbedContext } from 'contexts/embed';

import useGetPoster from 'effects/use-get-poster';
import Button from 'component/button';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import { useHistory } from 'react-router-dom';

type Props = {
  children: any,
  passedRef: any,
  href?: string,
  transparent?: boolean,
  onClick?: () => void,
  onSwipeNext?: () => void,
  onSwipePrevious?: () => void,
  enableSwipe?: boolean,
  // -- redux --
  claimThumbnail?: string,
  obscurePreview: boolean,
  renderMode: string,
  videoTheaterMode: boolean,
  sidePanelOpen: boolean,
};

const ClaimCoverRender = (props: Props) => {
  const {
    children,
    passedRef,
    href,
    transparent,
    onClick,
    onSwipeNext,
    onSwipePrevious,
    enableSwipe,
    // -- redux --
    claimThumbnail,
    obscurePreview,
    renderMode,
    videoTheaterMode,
    sidePanelOpen,
  } = props;

  const isEmbed = React.useContext(EmbedContext);
    const {
    location: { search },
  } = useHistory();

  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';

  const isMobile = useIsMobile();
  const theaterMode = RENDER_MODES.FLOATING_MODES.includes(renderMode) && videoTheaterMode;
  const thumbnail = useGetPoster(claimThumbnail, isShortsParam);

  const swipeRef = useSwipeNavigation({
    onSwipeNext,
    onSwipePrevious,
    isEnabled: enableSwipe && isMobile,
    minSwipeDistance: 50,
    tapDuration: 200,
    onTap: enableSwipe ? onClick : undefined,
  });

  const isNavigateLink = href;
  const Wrapper = isNavigateLink ? Button : 'div';

  return (
    <Wrapper
      ref={isShortsParam ? swipeRef : passedRef}
      href={href}
      onClick={onClick}
      style={thumbnail && !obscurePreview ? { backgroundImage: `url("${thumbnail}")` } : {}}
      className={classnames('content__cover', {
        'content__cover--embed': isEmbed,
        'content__cover--black-background': !transparent,
        'content__cover--disabled': !onClick && !href,
        'content__cover--theater-mode': theaterMode && !isMobile,
        'content__cover--link': isNavigateLink,
        'card__media--nsfw': obscurePreview,
        'content__cover--side-panel-open': sidePanelOpen,
      })}
    >
      {children}
    </Wrapper>
  );
};

export default ClaimCoverRender;
