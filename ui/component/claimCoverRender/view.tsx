import React from 'react';
import classnames from 'classnames';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as SETTINGS from 'constants/settings';
import { useIsMobile } from 'effects/use-screensize';
import { EmbedContext } from 'contexts/embed';
import useGetPoster from 'effects/use-get-poster';
import Button from 'component/button';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import { getThumbnailFromClaim, isClaimShort } from 'util/claim';
import { selectShortsSidePanelOpen } from 'redux/selectors/shorts';
import { selectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectFileRenderModeForUri, selectPlayingUri } from 'redux/selectors/content';
type Props = {
  uri: string;
  children: any;
  passedRef: any;
  href?: string;
  transparent?: boolean;
  onClick?: () => void;
  onSwipeNext?: () => void;
  onSwipePrevious?: () => void;
  enableSwipe?: boolean;
  isShortsContext?: boolean;
  isFloatingContext?: boolean;
  obscurePreview: boolean;
};

const ClaimCoverRender = (props: Props) => {
  const {
    uri,
    children,
    passedRef,
    href,
    transparent,
    onClick,
    onSwipeNext,
    onSwipePrevious,
    enableSwipe,
    isShortsContext,
    isFloatingContext,
    obscurePreview,
  } = props;
  // -- redux --
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimThumbnail = getThumbnailFromClaim(claim);
  const isShortClaim = isClaimShort(claim);
  const playingUri = useAppSelector(selectPlayingUri);
  const isCurrentlyPlaying = playingUri && playingUri.uri === uri;
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const renderMode = useAppSelector((state) => selectFileRenderModeForUri(state, uri));
  const sidePanelOpen = useAppSelector(selectShortsSidePanelOpen);
  const videoTheaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const autoplayMedia = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA));
  const isEmbed = React.useContext(EmbedContext);
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const isShortsParam = urlParams.get('view') === 'shorts';
  const isMobile = useIsMobile();
  const theaterMode = RENDER_MODES.FLOATING_MODES.includes(renderMode) && videoTheaterMode;
  const isShorts = typeof isShortsContext === 'boolean' ? isShortsContext : isShortsParam || isShortClaim;
  const shouldUseShortsCoverLayout = isShorts && !isFloatingContext;
  const thumbnail = useGetPoster(claimThumbnail, isShorts);
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
      ref={shouldUseShortsCoverLayout ? swipeRef : passedRef}
      href={href}
      onClick={onClick}
      style={
        thumbnail &&
        !obscurePreview &&
        !(isCurrentlyPlaying && shouldUseShortsCoverLayout) &&
        !(shouldUseShortsCoverLayout && autoplayMedia)
          ? {
              backgroundImage: `url("${thumbnail}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}
      }
      className={classnames('content__cover', {
        'content__cover--shorts': shouldUseShortsCoverLayout,
        'content__cover--embed': isEmbed,
        'content__cover--black-background': !transparent,
        'content__cover--disabled': !onClick && !href,
        'content__cover--theater-mode': theaterMode && !isMobile,
        'content__cover--link': isNavigateLink,
        'card__media--nsfw': obscurePreview,
        'content__cover--side-panel-open': sidePanelOpen && !isMobile,
      })}
    >
      {children}
    </Wrapper>
  );
};

export default ClaimCoverRender;
