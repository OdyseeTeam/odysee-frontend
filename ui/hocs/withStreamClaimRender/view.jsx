// @flow
import React from 'react';
import analytics from 'analytics';

import * as RENDER_MODES from 'constants/file_render_modes';
import * as COLLECTIONS_CONSTS from 'constants/collections';

import ProtectedContentOverlay from './internal/protectedContentOverlay';
import ClaimCoverRender from 'component/claimCoverRender';
import PaidContentOverlay from './internal/paidContentOverlay';
import LoadingScreen from 'component/common/loading-screen';
import Button from 'component/button';

type Props = {
  uri: string,
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
  renderMode: string,
  streamingUrl: any,
  isLivestreamClaim: ?boolean,
  isCurrentClaimLive: ?boolean,
  playingUri: PlayingUri,
  playingCollectionId: ?string,
  pendingFiatPayment: ?boolean,
  sdkFeePending: ?boolean,
  pendingUnlockedRestrictions: ?boolean,
  canViewFile: ?boolean,
  alreadyListeningForIsLive: boolean,
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doFileGetForUri: (uri: string) => void,
  doMembershipMine: () => void,
  doStartFloatingPlayingUri: (playingOptions: PlayingUri) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  doFetchChannelIsLiveForId: (channelClaimId: string) => void,
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
      renderMode,
      streamingUrl,
      isLivestreamClaim,
      isCurrentClaimLive,
      playingUri,
      playingCollectionId,
      pendingFiatPayment,
      sdkFeePending,
      pendingUnlockedRestrictions,
      canViewFile,
      alreadyListeningForIsLive,
      doCheckIfPurchasedClaimId,
      doFileGetForUri,
      doMembershipMine,
      doStartFloatingPlayingUri,
      doMembershipList,
      doFetchChannelIsLiveForId,

      ...otherProps
    } = props;

    const alreadyPlaying = React.useRef(Boolean(playingUri.uri));

    const [currentStreamingUri, setCurrentStreamingUri] = React.useState();
    const [clickProps, setClickProps] = React.useState();

    const { search, href, state: locationState, pathname } = location;
    const { forceAutoplay: forceAutoplayParam, forceDisableAutoplay } = locationState || {};
    const urlParams = search && new URLSearchParams(search);
    const collectionId =
      (urlParams && urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID)) || (playingUri.uri === uri && playingCollectionId);
    const livestreamUnplayable = isLivestreamClaim && !isCurrentClaimLive;

    const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode);
    const isAPurchaseOrPreorder = purchaseTag || preorderTag || rentalTag;

    // check if there is a time or autoplay parameter, if so force autoplay
    const urlTimeParam = href && href.indexOf('t=') > -1;
    const autoplayEnabled =
      !forceDisableAutoplay &&
      (!embedded || (urlParams && urlParams.get('autoplay'))) &&
      (forceAutoplayParam || urlTimeParam || autoplay);

    const autoplayVideo =
      isLivestreamClaim ||
      ((autoplayEnabled || playingCollectionId) && (!alreadyPlaying.current || playingUri.uri === uri) && isPlayable);
    const autoRenderClaim = !embedded && RENDER_MODES.AUTO_RENDER_MODES.includes(renderMode);
    const shouldAutoplay = autoplayVideo || autoRenderClaim;
    const shouldStartFloating = playingUri.uri !== uri;

    const streamStarted = currentStreamingUri === uri;
    const streamStartPending = canViewFile && shouldAutoplay && !streamStarted;

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
      if (isAPurchaseOrPreorder) {
        doCheckIfPurchasedClaimId(claimId);
      }
    }, [claimId, doCheckIfPurchasedClaimId, isAPurchaseOrPreorder]);

    const streamClaim = React.useCallback(() => {
      const playingOptions: PlayingUri = {
        uri,
        collection: { collectionId },
        location: { pathname, search },
        source: undefined,
        sourceId: claimLinkId,
        commentId: undefined,
      };

      if (parentCommentId) {
        playingOptions.source = 'comment';
        playingOptions.commentId = parentCommentId;
      } else if (isMarkdownPost) {
        playingOptions.source = 'markdown';
      }

      if (!isLivestreamClaim) doFileGetForUri(uri);
      if (shouldStartFloating) doStartFloatingPlayingUri(playingOptions);

      analytics.event.playerLoaded(renderMode, embedded);

      setCurrentStreamingUri(uri);
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
      if (canViewFile && shouldAutoplay && !streamStarted) {
        streamClaim();
      }
    }, [canViewFile, streamStarted, shouldAutoplay, streamClaim]);

    React.useEffect(() => {
      if (isLivestreamClaim && !alreadyListeningForIsLive) {
        doFetchChannelIsLiveForId(channelClaimId);
      }
    }, [alreadyListeningForIsLive, channelClaimId, doFetchChannelIsLiveForId, isLivestreamClaim]);

    // -- Restricted State -- render instead of component, until no longer restricted
    if (!canViewFile) {
      return (
        <ClaimCoverRender uri={uri} transparent {...clickProps}>
          {pendingFiatPayment || sdkFeePending ? (
            <PaidContentOverlay uri={uri} passClickPropsToParent={setClickProps} />
          ) : pendingUnlockedRestrictions ? (
            <ProtectedContentOverlay uri={uri} fileUri={uri} passClickPropsToParent={setClickProps} />
          ) : null}
        </ClaimCoverRender>
      );
    }

    // -- Loading State -- return before component render
    if (!streamingUrl) {
      if (streamStarted && livestreamUnplayable) {
        // -- Nothing to show, render cover --
        return <ClaimCoverRender uri={uri} />;
      }

      if (streamStarted || streamStartPending) {
        return <LoadingScreen transparent={!isPlayable} />;
      }

      return (
        <ClaimCoverRender uri={uri} onClick={streamClaim}>
          <Button onClick={streamClaim} iconSize={30} title={__('Play')} className="button--icon button--play" />
        </ClaimCoverRender>
      );
    }

    // -- Main Component Render -- return when already has the claim's contents
    return <StreamClaimComponent uri={uri} streamClaim={streamClaim} {...otherProps} />;
  };

  return StreamClaimWrapper;
};

export default withStreamClaimRender;
