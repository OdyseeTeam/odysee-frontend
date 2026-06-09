import React from 'react';
import classnames from 'classnames';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { isCastSessionActive } from 'component/viewers/videoViewer/internal/hooks/useChromecast';
import analytics from 'analytics';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import { ExpandableContext } from 'contexts/expandable';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import ProtectedContentOverlay from './internal/protectedContentOverlay';
import ClaimCoverRender from 'component/claimCoverRender';
import PaidContentOverlay from './internal/paidContentOverlay';
import LoadingScreen from 'component/common/loading-screen';
import ScheduledInfo from 'component/scheduledInfo';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectIsFetchingPurchases,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
  selectIsStreamPlaceholderForUri,
  selectPendingFiatPaymentForUri,
  selectSdkFeePendingForUri,
  selectScheduledStateForUri,
} from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import {
  makeSelectFileRenderModeForUri,
  selectPlayingUri,
  selectPlayingCollectionId,
  selectCanViewFileForUri,
} from 'redux/selectors/content';
import { selectMembershipMineFetched, selectPendingUnlockedRestrictionsForUri } from 'redux/selectors/memberships';
import {
  selectIsActiveLivestreamForUri,
  selectIsActiveLivestreamForClaimId,
  selectActiveLivestreamForChannel,
  selectChannelIsLiveFetchedForUri,
} from 'redux/selectors/livestream';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectVideoSourceLoadedForUri } from 'redux/selectors/app';
import { doStartFloatingPlayingUri, doClearPlayingUri, doClearPlayingSource } from 'redux/actions/content';
import { doFileGetForUri } from 'redux/actions/file';
import { doCheckIfPurchasedClaimId } from 'redux/actions/payments';
import { doMembershipMine, doMembershipList } from 'redux/actions/memberships';

// Bounded set to prevent repeated 'isHome' updateClaim calls (avoids loops on homepage)
const HOME_INIT_FLAGS_MAX_SIZE = 100;
const homeInitFlags: Set<string> = new Set();
const HYPERBEAM_STARTUP_READY_EVENT = 'odysee-hyperbeam-startup-ready';

type Props = {
  uri: string;
  children?: any;
  embedded?: boolean;
  claimLinkId?: string;
  isMarkdownPost?: boolean;
  parentCommentId?: string;
  onSwipeNext?: () => void;
  onSwipePrevious?: () => void;
  enableSwipe?: boolean;
  isShortsContext?: boolean;
  isFloatingContext?: boolean;
  forceRenderStream?: boolean;
};

/**
 * HigherOrderComponent to condition a stream claim to fetch its streamingUrl, show loading states or restricted (since only stream claims can be
 * made members-only or paywalled) and then render the full stream contents by its component.
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withStreamClaimRender = (StreamClaimComponent: FunctionalComponentParam) => {
  const StreamClaimWrapper = (props: Props) => {
    const streamComponentOwnsStartupLayer = Boolean(StreamClaimComponent.rendersHyperbeamStartupLayer);
    const {
      uri,
      children,
      embedded,
      claimLinkId,
      isMarkdownPost,
      parentCommentId,
      onSwipeNext,
      onSwipePrevious,
      enableSwipe,
      isShortsContext,
      isFloatingContext,
      forceRenderStream,
    } = props;

    // -- Route props (previously injected by index.ts wrapper) --
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    const match = {
      params,
      path: location.pathname,
      url: location.pathname,
      isExact: true,
    };

    // -- Redux --
    const dispatch = useAppDispatch();
    const claim = useAppSelector((state) => selectClaimForUri(state, uri));
    const { claim_id: claimId, signing_channel: channelClaim, value_type: valueType } = claim || {};
    const { name: channelName, claim_id: channelClaimId } = channelClaim || {};

    const myMembershipsFetched = useAppSelector(selectMembershipMineFetched);
    const preorderTag = useAppSelector((state) => selectPreorderTagForUri(state, uri));
    const purchaseTag = useAppSelector((state) => selectPurchaseTagForUri(state, uri));
    const rentalTag = useAppSelector((state) => selectRentalTagForUri(state, uri));
    const autoplay = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA));
    const floatingPlayerEnabled = useAppSelector((state) => selectClientSetting(state, SETTINGS.FLOATING_PLAYER));
    const autoplayNextShort = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS));
    const isFetchingPurchases = useAppSelector(selectIsFetchingPurchases);
    const renderMode = useAppSelector((state) => makeSelectFileRenderModeForUri(uri)(state));
    const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
    const isCollectionClaim = valueType === 'collection';
    const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
    const isCurrentClaimLive = useAppSelector(
      (state) =>
        selectIsActiveLivestreamForUri(state, uri) ||
        selectIsActiveLivestreamForClaimId(state, claimId) ||
        Boolean(selectActiveLivestreamForChannel(state, channelClaimId))
    );
    const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));
    const playingUri = useAppSelector(selectPlayingUri);
    const playingCollectionId = useAppSelector(selectPlayingCollectionId);
    const pendingFiatPayment = useAppSelector((state) => selectPendingFiatPaymentForUri(state, uri));
    const sdkFeePending = useAppSelector((state) => selectSdkFeePendingForUri(state, uri));
    const pendingUnlockedRestrictions = useAppSelector((state) => selectPendingUnlockedRestrictionsForUri(state, uri));
    const canViewFile = useAppSelector((state) => selectCanViewFileForUri(state, uri));
    const channelLiveFetched = useAppSelector((state) => selectChannelIsLiveFetchedForUri(state, uri));
    const sourceLoaded = useAppSelector((state) => selectVideoSourceLoadedForUri(state, uri));

    const { setExpanded, disableExpanded } = React.useContext(ExpandableContext) || {};
    const alreadyPlaying = React.useRef(Boolean(playingUri.uri));
    const shouldClearPlayingUri = React.useRef(false);
    const floatingPlayerEnabledRef = React.useRef(floatingPlayerEnabled);
    const [currentStreamingUri, setCurrentStreamingUri] = React.useState<string | undefined>();
    const [clickProps, setClickProps] = React.useState<{ href?: string; onClick?: () => void } | undefined>();
    const [hyperbeamStartupActive, setHyperbeamStartupActive] = React.useState(false);
    const [hyperbeamStartupReady, setHyperbeamStartupReady] = React.useState(false);
    const currentLocation = location || {
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      search: typeof window !== 'undefined' ? window.location.search : '',
      href: typeof window !== 'undefined' ? window.location.href : '',
      state:
        typeof window !== 'undefined' && window.history && typeof window.history.state === 'object'
          ? window.history.state?.usr || window.history.state
          : undefined,
    };
    const {
      search,
      href = `${currentLocation.pathname || ''}${currentLocation.search || ''}`,
      state: locationState,
      pathname = '',
    } = currentLocation as { search: string; href?: string; state: any; pathname?: string };
    const { forceDisableAutoplay } = locationState || {};
    const currentUriPlaying = playingUri.uri === uri && claimLinkId === playingUri.sourceId;
    const uriQueryIndex = uri.indexOf('?');
    const uriSearch = uriQueryIndex >= 0 ? uri.slice(uriQueryIndex) : '';
    const urlParams = uriSearch || search ? new URLSearchParams(uriSearch) : null;
    if (urlParams && search) {
      new URLSearchParams(search).forEach((value, key) => urlParams.set(key, value));
    }
    const forceAutoplayParam = (urlParams && urlParams.get('autoplay')) || false;
    const collectionId =
      (urlParams && (urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID) || urlParams.get('lid'))) ||
      (currentUriPlaying && playingCollectionId) ||
      undefined;
    const livestreamUnplayable = isLivestreamClaim && !isCurrentClaimLive;
    const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode);
    const isAPurchaseOrPreorder = purchaseTag || preorderTag || rentalTag;
    let uriAccessKey: UriAccessKey | null | undefined = null;
    const fileGetOptions: FileGetOptions = {};

    if (urlParams && urlParams.get('signature') && urlParams.get('signature_ts')) {
      uriAccessKey = {
        key: 'signature',
        value: urlParams.get('signature') || '',
        signature: urlParams.get('signature') || '',
        signature_ts: urlParams.get('signature_ts') || '',
      };
      (fileGetOptions as any).uriAccessKey = uriAccessKey;
    }

    // check if there is a time or autoplay parameter, if so force autoplay
    const urlTimeParam = href && href.indexOf('t=') > -1;
    const shortsAutoPlayOverride = Boolean(window.__shortsAutoPlayNext);
    if (shortsAutoPlayOverride) {
      delete window.__shortsAutoPlayNext;
      alreadyPlaying.current = false;
    }

    const autoplayEnabled =
      !forceDisableAutoplay &&
      (!embedded || (urlParams && urlParams.get('autoplay'))) &&
      (forceAutoplayParam ||
        urlTimeParam ||
        (isLivestreamClaim ? isCurrentClaimLive : autoplay) ||
        (isShortsContext && autoplayNextShort));
    const autoplayVideo =
      !claimLinkId &&
      !isCastSessionActive() &&
      (autoplayEnabled || playingCollectionId) &&
      (!alreadyPlaying.current || currentUriPlaying || (!isFloatingContext && autoplay)) &&
      isPlayable;
    const shouldStartFloating = !currentUriPlaying || (claimLinkId !== playingUri.sourceId && !isLivestreamClaim);
    const streamStarted = isPlayable ? playingUri.uri === uri : currentStreamingUri === uri;
    const embeddedLivestreamPendingStart = embedded && isCurrentClaimLive && !streamStarted;
    // For live livestreams, the streaming URL comes from activeLivestreamForChannel, not streamingUrl
    const hasStreamSource = streamingUrl || (isLivestreamClaim && isCurrentClaimLive);

    function expandInlinePlayerContainer() {
      if (setExpanded && disableExpanded) {
        setExpanded(true);
        disableExpanded(true);
      }
    }

    function handleClick() {
      setHyperbeamStartupActive(true);
      setHyperbeamStartupReady(false);
      streamClaim();

      // In case of inline player where play button is reachable -> set is expanded
      expandInlinePlayerContainer();
    }

    const startHyperbeamStartup = React.useCallback(() => {
      setHyperbeamStartupActive(true);
      setHyperbeamStartupReady(false);
    }, []);

    const handleAnimatedHyperbeamClick = React.useCallback(() => {
      handleClick();
    }, [handleClick]);

    React.useEffect(() => {
      if (!hyperbeamStartupActive) return;
      const markStartupReady = (event: Event) => {
        const detail = (event as CustomEvent<{ uri?: string }>).detail;
        if (detail?.uri !== uri) return;
        setHyperbeamStartupReady(true);
      };
      window.addEventListener(HYPERBEAM_STARTUP_READY_EVENT, markStartupReady);

      return () => window.removeEventListener(HYPERBEAM_STARTUP_READY_EVENT, markStartupReady);
    }, [hyperbeamStartupActive, uri]);

    React.useEffect(() => {
      if (!hyperbeamStartupActive || !hyperbeamStartupReady || !sourceLoaded) return;
      let frameOne = 0;
      let frameTwo = 0;
      frameOne = window.requestAnimationFrame(() => {
        frameTwo = window.requestAnimationFrame(() => {
          setHyperbeamStartupActive(false);
          setHyperbeamStartupReady(false);
        });
      });

      return () => {
        window.cancelAnimationFrame(frameOne);
        window.cancelAnimationFrame(frameTwo);
      };
    }, [hyperbeamStartupActive, hyperbeamStartupReady, sourceLoaded]);

    React.useEffect(() => {
      if (channelClaimId && channelName) {
        dispatch(
          doMembershipList(
            {
              channel_claim_id: channelClaimId,
            },
            undefined
          )
        );
      }
    }, [channelClaimId, channelName, dispatch]);
    React.useEffect(() => {
      if (!myMembershipsFetched) {
        dispatch(doMembershipMine());
      }
    }, [dispatch, myMembershipsFetched]);
    React.useEffect(() => {
      if (isAPurchaseOrPreorder && isFetchingPurchases === undefined) {
        dispatch(doCheckIfPurchasedClaimId(claimId));
      }
    }, [claimId, dispatch, isAPurchaseOrPreorder, isFetchingPurchases]);
    const streamClaim = React.useCallback(() => {
      updateClaim('callback'); // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
    }, [
      claimLinkId,
      collectionId,
      dispatch,
      embedded,
      isLivestreamClaim,
      isMarkdownPost,
      parentCommentId,
      pathname,
      renderMode,
      search,
      shouldStartFloating,
      uri,
    ]);
    React.useEffect(() => {
      const decodedPathname = decodeURIComponent(pathname);
      const uriChannel = decodedPathname.substring(decodedPathname.indexOf('/@') + 2, decodedPathname.indexOf(':'));
      let cut = decodedPathname.substring(decodedPathname.indexOf('/') + 1, decodedPathname.length);
      cut = cut.substring(cut.indexOf('/') + 1, cut.length);
      cut = cut.substring(0, cut.indexOf(':'));
      const isExternaleEmbed = decodedPathname.includes('/$/embed');
      const uriIsActive = uri.includes(uriChannel) && uri.includes(cut);
      const playingUriIsActive = playingUri?.uri?.includes(uriChannel) && playingUri?.uri?.includes(cut);
      const isHome = pathname === '/' || pathname === '/$/embed/home';
      const hasDifferentUriAlreadyPlaying = Boolean(playingUri?.uri && !currentUriPlaying);

      if (canViewFile) {
        if (isHome) {
          // Floating player should never re-bootstrap playback on homepage transitions.
          if (isFloatingContext) return;
          // Don't let home feed items hijack an already-active floating player.
          if (hasDifferentUriAlreadyPlaying) return;

          if (!homeInitFlags.has(uri)) {
            if (homeInitFlags.size >= HOME_INIT_FLAGS_MAX_SIZE) {
              homeInitFlags.clear();
            }

            homeInitFlags.add(uri);
            updateClaim('isHome');
          }
        }

        if (uriIsActive && !playingUriIsActive && !isHome && !claimLinkId && !isExternaleEmbed) {
          if (renderMode === 'video' || renderMode === 'audio') {
            // Play next
            if (autoplay || shortsAutoPlayOverride) updateClaim('a & d & !claimLinkId video');
          } else {
            // Non video claims
            updateClaim('a & d & !claimLinkId nonVideo');
          }
        }

        // Embedded videos in Livestream chat
        if (!uriIsActive && !playingUriIsActive && !isHome && !claimLinkId && !isExternaleEmbed) {
          updateClaim('!uriIsActive & !playingUriIsActive & !claimLinkId');
        }

        // Play next
        if (uriIsActive && playingUriIsActive && !isHome && !claimLinkId && !sourceLoaded && !collectionId) {
          updateClaim('uriIsActive & playingUriIsActive & !sourceLoaded');
        }

        // Playlist
        if (uriIsActive && playingUriIsActive && !isHome && !claimLinkId && sourceLoaded) {
          updateClaim('uriIsActive & playingUriIsActive & sourceLoaded');
        }

        // External embedded autoplay
        if (!uriIsActive && !playingUriIsActive && !isHome && !claimLinkId && sourceLoaded && autoplayVideo) {
          updateClaim('!uriIsActive & !playingUriIsActive & sourceLoaded');
        }
      } // eslint-disable-next-line react-hooks/exhaustive-deps -- SIGH
    }, [pathname, sourceLoaded, canViewFile, uri, embedded, claimLinkId, forceRenderStream]);
    // Ensure non-video embeds (e.g. markdown) fetch their source in embed mode
    React.useEffect(() => {
      if (canViewFile && renderMode === 'md' && !streamingUrl) {
        dispatch(doFileGetForUri(uri, fileGetOptions));
      } // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewFile, renderMode, streamingUrl, uri]);

    function updateClaim(trigger: string) {
      const playingOptions: PlayingUri = {
        uri,
        collection: {
          collectionId,
        },
        location: {
          pathname,
          search,
        },
        source: undefined,
        sourceId: claimLinkId,
        commentId: undefined,
      };
      let check = playingOptions.uri === currentStreamingUri;

      if (parentCommentId) {
        playingOptions.source = 'comment';
        playingOptions.commentId = parentCommentId;
      } else if (isMarkdownPost) {
        playingOptions.source = 'markdown';
      }

      if (!isLivestreamClaim && !isCollectionClaim && !streamingUrl) {
        dispatch(doFileGetForUri(uri, fileGetOptions));
      }

      if (shouldStartFloating || !check) {
        dispatch(doStartFloatingPlayingUri(playingOptions));
      }

      analytics.event.playerLoaded(renderMode, embedded);

      if (!shouldStartFloating && check) {
        setCurrentStreamingUri(uri);
      }
    }

    React.useEffect(() => {
      const playingLocation = playingUri.location || {};
      const sameRoute = playingLocation.pathname === pathname && (playingLocation.search || '') === (search || '');
      const shouldAttachFloatingUriToInlinePlayer =
        claimLinkId && canViewFile && playingUri.uri === uri && !playingUri.sourceId && sameRoute;

      if (shouldAttachFloatingUriToInlinePlayer) {
        updateClaim('reattach-inline');
        expandInlinePlayerContainer();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewFile, claimLinkId, pathname, playingUri.sourceId, playingUri.uri, search, uri]);

    React.useEffect(() => {
      shouldClearPlayingUri.current = claimLinkId && currentUriPlaying;
    }, [claimLinkId, currentUriPlaying]);
    React.useEffect(() => {
      floatingPlayerEnabledRef.current = floatingPlayerEnabled;
    }, [floatingPlayerEnabled]);
    React.useEffect(() => {
      return () => {
        if (shouldClearPlayingUri.current) {
          dispatch(floatingPlayerEnabledRef.current ? doClearPlayingSource() : doClearPlayingUri());
        }
      }; // -- only on unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -- Restricted State -- render instead of component, until no longer restricted
    if (!canViewFile) {
      return (
        <ClaimCoverRender
          uri={uri}
          transparent
          isShortsContext={isShortsContext}
          isFloatingContext={isFloatingContext}
          {...(clickProps || {})}
        >
          {pendingFiatPayment || sdkFeePending ? (
            <>
              {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
              <PaidContentOverlay uri={uri} passClickPropsToParent={setClickProps} />
            </>
          ) : pendingUnlockedRestrictions ? (
            <>
              {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
              <ProtectedContentOverlay uri={uri} fileUri={uri} passClickPropsToParent={setClickProps} />
            </>
          ) : null}
          {scheduledState === 'scheduled' && <ScheduledInfo uri={uri} />}
        </ClaimCoverRender>
      );
    }

    const shouldShowPreplayCover =
      !hyperbeamStartupActive &&
      ((!playingUri && !streamStarted) ||
        !hasStreamSource ||
        embeddedLivestreamPendingStart ||
        livestreamUnplayable ||
        (isPlayable && !currentUriPlaying && !forceRenderStream && !(autoplayVideo && !isFloatingContext)));

    const renderStartupLayer = () => (
      <div
        className={classnames('content__hyperbeam-startup-layer', {
          'content__hyperbeam-startup-layer--active': hyperbeamStartupActive,
        })}
      >
        <Button
          onPointerDown={startHyperbeamStartup}
          onMouseDown={startHyperbeamStartup}
          onTouchStart={startHyperbeamStartup}
          onClick={handleAnimatedHyperbeamClick}
          iconSize={30}
          title={__('Play')}
          className={`button--icon button--play${hyperbeamStartupActive ? ' button--play-morphing' : ''}`}
        />
        <HyperbeamStartupNetwork />
      </div>
    );

    const renderStartupCover = () => (
      <ClaimCoverRender
        onSwipeNext={onSwipeNext}
        onSwipePrevious={onSwipePrevious}
        enableSwipe={enableSwipe}
        uri={uri}
        onClick={handleAnimatedHyperbeamClick}
        isShortsContext={isShortsContext}
        isFloatingContext={isFloatingContext}
        hidePreview={hyperbeamStartupActive}
      >
        {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
      </ClaimCoverRender>
    );

    const renderStartupShell = (baseLayer: React.ReactNode) => (
      <div
        className={classnames('content__hyperbeam-startup-shell', {
          'content__hyperbeam-startup-shell--active': hyperbeamStartupActive,
        })}
      >
        {baseLayer}
        {renderStartupLayer()}
      </div>
    );

    const renderComponentStartupCover = () => (
      <StreamClaimComponent
        {...props}
        uri={uri}
        streamClaim={handleClick}
        hyperbeamStartupActive={hyperbeamStartupActive}
        startHyperbeamStartup={startHyperbeamStartup}
      >
        {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
      </StreamClaimComponent>
    );

    // -- Loading State -- return before component render
    if (shouldShowPreplayCover) {
      if (channelLiveFetched && livestreamUnplayable) {
        // -- Nothing to show, render cover --
        return (
          <>
            {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
            <ClaimCoverRender uri={uri} isShortsContext={isShortsContext} isFloatingContext={isFloatingContext}>
              {children}
            </ClaimCoverRender>
          </>
        );
      } else if (isPlayable) {
        return streamComponentOwnsStartupLayer
          ? renderComponentStartupCover()
          : renderStartupShell(renderStartupCover());
      } else if (renderMode === 'md') {
        return <LoadingScreen />;
      }
    }

    // -- Main Component Render -- return when already has the claim's contents
    const renderedStream = (
      <>
        {currentUriPlaying && claimLinkId && !sourceLoaded && !embedded && !forceRenderStream ? (
          <LoadingScreen />
        ) : (
          <StreamClaimComponent
            {...props}
            uri={uri}
            streamClaim={handleClick}
            hyperbeamStartupActive={hyperbeamStartupActive}
            startHyperbeamStartup={startHyperbeamStartup}
            channelName={channelName}
            channelClaimId={channelClaimId}
            claimId={claimId}
            myMembershipsFetched={myMembershipsFetched}
            preorderTag={preorderTag}
            purchaseTag={purchaseTag}
            rentalTag={rentalTag}
            autoplay={autoplay}
            autoplayNextShort={autoplayNextShort}
            isFetchingPurchases={isFetchingPurchases}
            renderMode={renderMode}
            streamingUrl={streamingUrl}
            isCollectionClaim={isCollectionClaim}
            isLivestreamClaim={isLivestreamClaim}
            isCurrentClaimLive={isCurrentClaimLive}
            scheduledState={scheduledState}
            playingUri={playingUri}
            playingCollectionId={playingCollectionId}
            pendingFiatPayment={pendingFiatPayment}
            sdkFeePending={sdkFeePending}
            pendingUnlockedRestrictions={pendingUnlockedRestrictions}
            canViewFile={canViewFile}
            channelLiveFetched={channelLiveFetched}
            sourceLoaded={sourceLoaded}
            location={location}
            match={match}
            navigate={navigate}
          />
        )}
      </>
    );

    const shouldShowStartupLayer = isPlayable && !sourceLoaded;

    if (streamComponentOwnsStartupLayer) return renderedStream;
    if (!hyperbeamStartupActive && !shouldShowStartupLayer) return renderedStream;

    return renderStartupShell(renderedStream);
  };

  StreamClaimWrapper.displayName = `withStreamClaimRender(${StreamClaimComponent.displayName || StreamClaimComponent.name || 'Component'})`;
  return StreamClaimWrapper;
};

function HyperbeamStartupNetwork() {
  const nodes = React.useMemo(
    () =>
      [
        [50, 50],
        [37, 37],
        [63, 36],
        [34, 58],
        [66, 59],
        [47, 24],
        [54, 72],
        [24, 43],
        [76, 44],
        [25, 67],
        [74, 70],
        [42, 82],
        [59, 19],
      ].map(([x, y], index) => ({ id: index, x, y, delay: index * 42 })),
    []
  );
  const lines = React.useMemo(
    () => [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 5],
      [1, 7],
      [2, 5],
      [2, 8],
      [3, 7],
      [3, 9],
      [4, 8],
      [4, 10],
      [3, 6],
      [4, 6],
      [6, 11],
      [2, 12],
      [5, 12],
      [9, 11],
      [10, 11],
    ],
    []
  );

  return (
    <div className="content__hyperbeam-startup-network" aria-hidden="true">
      <svg className="content__hyperbeam-startup-network__graph" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map(([from, to], index) => {
          const fromNode = nodes[from];
          const toNode = nodes[to];
          return (
            <line
              key={`${from}-${to}`}
              className="content__hyperbeam-startup-network__line"
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              pathLength={1}
              style={{ animationDelay: `${index * 24}ms` }}
            />
          );
        })}
      </svg>
      {nodes.map((node) => (
        <span
          key={node.id}
          className={
            node.id === 0
              ? 'content__hyperbeam-startup-network__node content__hyperbeam-startup-network__node--root'
              : 'content__hyperbeam-startup-network__node'
          }
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: node.id === 0 ? 13 : 7,
            height: node.id === 0 ? 13 : 7,
            animationDelay: `${node.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default withStreamClaimRender;
