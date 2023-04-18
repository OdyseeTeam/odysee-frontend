// @flow
import React from 'react';
import analytics from 'analytics';

import * as RENDER_MODES from 'constants/file_render_modes';
import * as COLLECTIONS_CONSTS from 'constants/collections';

import { ExpandableContext } from 'contexts/expandable';
import FileViewerEmbeddedTitle from 'component/fileViewerEmbeddedTitle';
import ProtectedContentOverlay from './internal/protectedContentOverlay';
import ClaimCoverRender from 'component/claimCoverRender';
import PaidContentOverlay from './internal/paidContentOverlay';
import LoadingScreen from 'component/common/loading-screen';
import ScheduledInfo from 'component/scheduledInfo';
import Button from 'component/button';

type Props = {
  uri: string,
  children?: any,
  embedded?: boolean,
  claimLinkId?: string,
  isMarkdownPost?: boolean,
  location: {
    search: ?string,
    pathname: string,
    href: string,
    state: ?{ forceAutoplay?: boolean, forceDisableAutoplay?: boolean },
  },
  parentCommentId?: string,
  // -- redux --
  channelName: string,
  channelClaimId: string,
  claimId: string,
  myMembershipsFetched: boolean,
  preorderTag: number,
  purchaseTag: number,
  rentalTag: string,
  autoplay: boolean,
  isFetchingPurchases: ?boolean,
  renderMode: string,
  streamingUrl: any,
  isLivestreamClaim: ?boolean,
  isCurrentClaimLive: ?boolean,
  scheduledState: ClaimScheduledState,
  playingUri: PlayingUri,
  playingCollectionId: ?string,
  pendingFiatPayment: ?boolean,
  sdkFeePending: ?boolean,
  pendingUnlockedRestrictions: ?boolean,
  canViewFile: ?boolean,
  channelLiveFetched: boolean,
  sourceLoaded: boolean,
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doFileGetForUri: (uri: string, opt?: ?FileGetOptions) => void,
  doMembershipMine: () => void,
  doStartFloatingPlayingUri: (playingOptions: PlayingUri) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  doClearPlayingUri: () => void,
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
      location,
      parentCommentId,
      // -- redux --
      channelName,
      channelClaimId,
      claimId,
      myMembershipsFetched,
      preorderTag,
      purchaseTag,
      rentalTag,
      autoplay,
      isFetchingPurchases,
      renderMode,
      streamingUrl,
      isLivestreamClaim,
      isCurrentClaimLive,
      scheduledState,
      playingUri,
      playingCollectionId,
      pendingFiatPayment,
      sdkFeePending,
      pendingUnlockedRestrictions,
      canViewFile,
      channelLiveFetched,
      sourceLoaded,
      doCheckIfPurchasedClaimId,
      doFileGetForUri,
      doMembershipMine,
      doStartFloatingPlayingUri,
      doMembershipList,
      doClearPlayingUri,
    } = props;

    const { setExpanded, disableExpanded } = React.useContext(ExpandableContext) || {};

    const alreadyPlaying = React.useRef(Boolean(playingUri.uri));
    const shouldClearPlayingUri = React.useRef(false);

    const [currentStreamingUri, setCurrentStreamingUri] = React.useState();
    const [clickProps, setClickProps] = React.useState();

    const { search, href, state: locationState, pathname } = location;
    const { forceDisableAutoplay } = locationState || {};
    const currentUriPlaying = playingUri.uri === uri && claimLinkId === playingUri.sourceId;

    const urlParams = search ? new URLSearchParams(search) : null;
    const forceAutoplayParam = (urlParams && urlParams.get('autoplay')) || false;

    const collectionId =
      (urlParams && urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID)) ||
      (currentUriPlaying && playingCollectionId) ||
      undefined;
    const livestreamUnplayable = isLivestreamClaim && !isCurrentClaimLive;

    const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode);
    const isAPurchaseOrPreorder = purchaseTag || preorderTag || rentalTag;

    const fileGetOptions: FileGetOptions = {};

    if (urlParams && urlParams.get('signature') && urlParams.get('signature_ts')) {
      fileGetOptions.uriAccessKey = {
        signature: urlParams.get('signature') || '',
        signature_ts: urlParams.get('signature_ts') || '',
      };
    }

    // check if there is a time or autoplay parameter, if so force autoplay
    const urlTimeParam = href && href.indexOf('t=') > -1;
    const autoplayEnabled =
      !forceDisableAutoplay &&
      (!embedded || (urlParams && urlParams.get('autoplay'))) &&
      (forceAutoplayParam || urlTimeParam || (isLivestreamClaim ? isCurrentClaimLive : autoplay));

    const autoplayVideo =
      !claimLinkId &&
      (autoplayEnabled || playingCollectionId) &&
      (!alreadyPlaying.current || currentUriPlaying) &&
      isPlayable;
    const shouldStartFloating = !currentUriPlaying || (claimLinkId !== playingUri.sourceId && !isLivestreamClaim);

    const streamStarted = isPlayable ? playingUri.uri === uri : currentStreamingUri === uri;
    const embeddedLivestreamPendingStart = embedded && isCurrentClaimLive && !streamStarted;

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
        doMembershipList({ channel_name: channelName, channel_id: channelClaimId });
      }
    }, [channelClaimId, channelName, doMembershipList]);

    React.useEffect(() => {
      if (!myMembershipsFetched) {
        doMembershipMine();
      }
    }, [doMembershipMine, myMembershipsFetched]);

    React.useEffect(() => {
      if (isAPurchaseOrPreorder && isFetchingPurchases === undefined) {
        doCheckIfPurchasedClaimId(claimId);
      }
    }, [claimId, doCheckIfPurchasedClaimId, isAPurchaseOrPreorder, isFetchingPurchases]);

    const streamClaim = React.useCallback(() => {
      updateClaim('callback');
      // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
    }, [
      claimLinkId,
      collectionId,
      doFileGetForUri,
      doStartFloatingPlayingUri,
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
      // $FlowIgnore
      const playingUriIsActive = playingUri?.uri?.includes(uriChannel) && playingUri?.uri?.includes(cut);
      const isHome = pathname === '/';

      if (canViewFile) {
        if (isHome) updateClaim('isHome');
        if (uriIsActive && !playingUriIsActive && !isHome && !claimLinkId && !isExternaleEmbed) {
          if (renderMode === 'video') {
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
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- SIGH
    }, [pathname, sourceLoaded]);

    function updateClaim(trigger: string) {
      const playingOptions: PlayingUri = {
        uri,
        collection: { collectionId },
        location: { pathname, search },
        source: undefined,
        sourceId: claimLinkId,
        commentId: undefined,
      };

      // console.log('updateClaim: ', trigger);

      let check = playingOptions.uri === currentStreamingUri;

      if (parentCommentId) {
        playingOptions.source = 'comment';
        playingOptions.commentId = parentCommentId;
      } else if (isMarkdownPost) {
        playingOptions.source = 'markdown';
      }

      if (!isLivestreamClaim) {
        doFileGetForUri(uri, fileGetOptions);
      }
      if (shouldStartFloating || !check) {
        doStartFloatingPlayingUri(playingOptions);
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
          doClearPlayingUri();
        }
      };
      // -- only on unmount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -- Restricted State -- render instead of component, until no longer restricted
    if (!canViewFile) {
      // console.log('doCheckIfPurchasedClaimId: ', doCheckIfPurchasedClaimId)
      return (
        <ClaimCoverRender uri={uri} transparent {...clickProps}>
          {pendingFiatPayment || sdkFeePending ? (
            <>
              {embedded && <FileViewerEmbeddedTitle uri={uri} />}
              <PaidContentOverlay uri={uri} passClickPropsToParent={setClickProps} />
            </>
          ) : pendingUnlockedRestrictions ? (
            <>
              {embedded && <FileViewerEmbeddedTitle uri={uri} />}
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
      !streamingUrl ||
      embeddedLivestreamPendingStart ||
      livestreamUnplayable ||
      (isPlayable && !currentUriPlaying)
    ) {
      if (channelLiveFetched && livestreamUnplayable) {
        // -- Nothing to show, render cover --
        return (
          <>
            {embedded && <FileViewerEmbeddedTitle uri={uri} />}
            <ClaimCoverRender uri={uri}>{children}</ClaimCoverRender>
          </>
        );
      } else if (isPlayable && !autoplayVideo) {
        return (
          <ClaimCoverRender uri={uri} onClick={handleClick}>
            {embedded && <FileViewerEmbeddedTitle uri={uri} />}
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
        {currentUriPlaying && claimLinkId && !sourceLoaded && !embedded ? (
          <LoadingScreen />
        ) : (
          <StreamClaimComponent {...props} uri={uri} streamClaim={streamClaim} />
        )}
      </>
    );
  };

  return StreamClaimWrapper;
};

export default withStreamClaimRender;
