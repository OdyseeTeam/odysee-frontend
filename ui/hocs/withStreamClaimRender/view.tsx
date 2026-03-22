import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { doStartFloatingPlayingUri, doClearPlayingUri } from 'redux/actions/content';
import { doFileGetForUri } from 'redux/actions/file';
import { doCheckIfPurchasedClaimId } from 'redux/actions/stripe';
import { doMembershipMine, doMembershipList } from 'redux/actions/memberships';

// Bounded set to prevent repeated 'isHome' updateClaim calls (avoids loops on homepage)
const HOME_INIT_FLAGS_MAX_SIZE = 100;
const homeInitFlags: Set<string> = new Set();
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
    const [currentStreamingUri, setCurrentStreamingUri] = React.useState();
    const [clickProps, setClickProps] = React.useState();
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
    } = currentLocation;
    const { forceDisableAutoplay } = locationState || {};
    const currentUriPlaying = playingUri.uri === uri && claimLinkId === playingUri.sourceId;
    const urlParams = search ? new URLSearchParams(search) : null;
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
        signature: urlParams.get('signature') || '',
        signature_ts: urlParams.get('signature_ts') || '',
      };
      fileGetOptions.uriAccessKey = uriAccessKey;
    }

    // check if there is a time or autoplay parameter, if so force autoplay
    const urlTimeParam = href && href.indexOf('t=') > -1;
    const autoplayEnabled =
      !forceDisableAutoplay &&
      (!embedded || (urlParams && urlParams.get('autoplay'))) &&
      (forceAutoplayParam ||
        urlTimeParam ||
        (isLivestreamClaim ? isCurrentClaimLive : autoplay) ||
        (isShortsContext && autoplayNextShort));
    const autoplayVideo =
      !claimLinkId &&
      (autoplayEnabled || playingCollectionId) &&
      (!alreadyPlaying.current || currentUriPlaying) &&
      isPlayable;
    const shouldStartFloating = !currentUriPlaying || (claimLinkId !== playingUri.sourceId && !isLivestreamClaim);
    const streamStarted = isPlayable ? playingUri.uri === uri : currentStreamingUri === uri;
    const embeddedLivestreamPendingStart = embedded && isCurrentClaimLive && !streamStarted;
    // For live livestreams, the streaming URL comes from activeLivestreamForChannel, not streamingUrl
    const hasStreamSource = streamingUrl || (isLivestreamClaim && isCurrentClaimLive);

    function handleClick() {
      streamClaim();

      // In case of inline player where play button is reachable -> set is expanded
      if (setExpanded && disableExpanded) {
        setExpanded(true);
        disableExpanded(true);
      }
    }

    React.useEffect(() => {
      if (channelClaimId && channelName) {
        dispatch(
          doMembershipList({
            channel_claim_id: channelClaimId,
          })
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
      const uriChannel = pathname.substring(pathname.indexOf('/@') + 2, pathname.indexOf(':'));
      let cut = pathname.substring(pathname.indexOf('/') + 1, pathname.length);
      cut = cut.substring(cut.indexOf('/') + 1, cut.length);
      cut = cut.substring(0, cut.indexOf(':'));
      const isExternaleEmbed = pathname.includes('/$/embed');
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
            if (autoplay) updateClaim('a & d & !claimLinkId video');
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
    }, [pathname, sourceLoaded, canViewFile, uri]);
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
      shouldClearPlayingUri.current = claimLinkId && currentUriPlaying;
    }, [claimLinkId, currentUriPlaying]);
    React.useEffect(() => {
      return () => {
        if (shouldClearPlayingUri.current) {
          dispatch(doClearPlayingUri());
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
          {...clickProps}
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

    // -- Loading State -- return before component render
    if (
      (!playingUri && !streamStarted) ||
      !hasStreamSource ||
      embeddedLivestreamPendingStart ||
      livestreamUnplayable ||
      (isPlayable && !currentUriPlaying && !forceRenderStream)
    ) {
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
      } else if (isPlayable && !autoplayVideo) {
        return (
          <ClaimCoverRender
            onSwipeNext={onSwipeNext}
            onSwipePrevious={onSwipePrevious}
            enableSwipe={enableSwipe}
            uri={uri}
            onClick={handleClick}
            isShortsContext={isShortsContext}
            isFloatingContext={isFloatingContext}
          >
            {embedded && <FileViewerEmbeddedTitle uri={uri} uriAccessKey={uriAccessKey} />}
            <Button onClick={handleClick} iconSize={30} title={__('Play')} className="button--icon button--play" />
          </ClaimCoverRender>
        );
      } else if (renderMode === 'md') {
        return <LoadingScreen />;
      }
    }

    // -- Main Component Render -- return when already has the claim's contents
    return (
      <>
        {currentUriPlaying && claimLinkId && !sourceLoaded && !embedded && !forceRenderStream ? (
          <LoadingScreen />
        ) : (
          <StreamClaimComponent
            {...props}
            uri={uri}
            streamClaim={streamClaim}
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
  };

  StreamClaimWrapper.displayName = `withStreamClaimRender(${Component.displayName || Component.name || 'Component'})`;
  return StreamClaimWrapper;
};

export default withStreamClaimRender;
