import React from 'react';
import classnames from 'classnames';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as SETTINGS from 'constants/settings';
import { useIsMobile } from 'effects/use-screensize';
import { EmbedContext } from 'contexts/embed';
import useGetPoster from 'effects/use-get-poster';
import useLiveThumbnailFrame from 'effects/use-live-thumbnail-frame';
import Button from 'component/button';
import useSwipeNavigation from 'effects/use-swipe-navigation';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from 'redux/hooks';
import { getThumbnailFromClaim, isClaimShort } from 'util/claim';
import { selectShortsSidePanelOpen } from 'redux/selectors/shorts';
import { selectClaimForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectFileRenderModeForUri, selectPlayingUri } from 'redux/selectors/content';
import { selectLiveThumbnailForUri } from 'redux/selectors/livestream';
type Props = {
  uri: string;
  children?: any;
  passedRef?: any;
  href?: string;
  transparent?: boolean;
  onClick?: () => void;
  onSwipeNext?: () => void;
  onSwipePrevious?: () => void;
  enableSwipe?: boolean;
  isShortsContext?: boolean;
  isFloatingContext?: boolean;
  obscurePreview?: boolean;
};

function isMissingThumbLike(url: string | null | undefined) {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('missing-thumb-png') || normalized.includes('missing-thumb');
}

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
  const staticThumbnail = useGetPoster(claimThumbnail as string, isShorts);
  const liveThumbnailFromStore = useAppSelector((state) => selectLiveThumbnailForUri(state, uri));
  const liveThumbnail = isMissingThumbLike(liveThumbnailFromStore) ? null : liveThumbnailFromStore;

  const [isHovering, setIsHovering] = React.useState(false);
  const liveFrameUrl = useLiveThumbnailFrame(liveThumbnail, Boolean(isHovering && liveThumbnail));
  const [coverBufferA, setCoverBufferA] = React.useState<string | null>(liveThumbnail || staticThumbnail || null);
  const [coverBufferB, setCoverBufferB] = React.useState<string | null>(null);
  const [activeCoverBuffer, setActiveCoverBuffer] = React.useState<'a' | 'b'>('a');
  React.useEffect(() => {
    if (!liveThumbnail) {
      setCoverBufferA(staticThumbnail || null);
      setCoverBufferB(null);
      setActiveCoverBuffer('a');
      return;
    }

    if (!liveFrameUrl) return;

    if (activeCoverBuffer === 'a') {
      if (coverBufferB !== liveFrameUrl) setCoverBufferB(liveFrameUrl);
    } else if (coverBufferA !== liveFrameUrl) {
      setCoverBufferA(liveFrameUrl);
    }
  }, [activeCoverBuffer, coverBufferA, coverBufferB, liveFrameUrl, staticThumbnail, liveThumbnail]);

  const activeCoverThumb = activeCoverBuffer === 'a' ? coverBufferA : coverBufferB;
  const stableCoverThumb = activeCoverThumb || coverBufferA || coverBufferB || staticThumbnail || null;
  const enableLiveCrossfade = Boolean(isHovering && liveThumbnail && liveFrameUrl);
  const isLiveRefreshing = Boolean(liveThumbnail && isHovering && liveFrameUrl);

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
      onMouseEnter={liveThumbnail ? () => setIsHovering(true) : undefined}
      onMouseLeave={liveThumbnail ? () => setIsHovering(false) : undefined}
      style={
        !enableLiveCrossfade &&
        stableCoverThumb &&
        !obscurePreview &&
        !(isCurrentlyPlaying && shouldUseShortsCoverLayout) &&
        !(shouldUseShortsCoverLayout && autoplayMedia)
          ? {
              backgroundImage: `url("${stableCoverThumb}")`,
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
        'content__cover--live-refreshing': isLiveRefreshing,
      })}
    >
      {enableLiveCrossfade && coverBufferA && (
        <img
          src={coverBufferA}
          className={classnames('content__cover-live-img', {
            'content__cover-live-img--active': activeCoverBuffer === 'a',
          })}
          onLoad={() => setActiveCoverBuffer('a')}
          alt=""
          draggable={false}
        />
      )}
      {enableLiveCrossfade && coverBufferB && (
        <img
          src={coverBufferB}
          className={classnames('content__cover-live-img', {
            'content__cover-live-img--active': activeCoverBuffer === 'b',
          })}
          onLoad={() => setActiveCoverBuffer('b')}
          alt=""
          draggable={false}
        />
      )}
      {children}
    </Wrapper>
  );
};

export default ClaimCoverRender;
