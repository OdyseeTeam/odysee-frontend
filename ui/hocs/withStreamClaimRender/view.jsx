// @flow
import React from 'react';
import analytics from 'analytics';

import * as RENDER_MODES from 'constants/file_render_modes';
import * as COLLECTIONS_CONSTS from 'constants/collections';

import useFetchLiveStatus from 'effects/use-fetch-live';

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
  claimIsMine: boolean,
  sdkPaid: boolean,
  fiatPaid: boolean,
  fiatRequired: boolean,
  isFetchingPurchases: boolean,
  costInfo: any,
  renderMode: string,
  contentRestrictedFromUser: ?boolean,
  streamingUrl: any,
  isLivestreamClaim: ?boolean,
  doCheckIfPurchasedClaimId: (claimId: string) => void,
  doFileGetForUri: (uri: string) => void,
  doMembershipMine: () => void,
  doUriInitiatePlay: (playingOptions: PlayingUri, isPlayable: boolean) => void,
  doMembershipList: ({ channel_name: string, channel_id: string }) => Promise<CreatorMemberships>,
  doFetchChannelLiveStatus: (channelClaimId: string) => void,
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
      claimIsMine,
      sdkPaid,
      fiatPaid,
      fiatRequired,
      isFetchingPurchases,
      costInfo,
      renderMode,
      contentRestrictedFromUser,
      streamingUrl,
      isLivestreamClaim,
      doCheckIfPurchasedClaimId,
      doFileGetForUri,
      doMembershipMine,
      doUriInitiatePlay,
      doMembershipList,
      doFetchChannelLiveStatus,
    } = props;

    const [streamingUri, setStreamingUri] = React.useState();

    const { search, href, state: locationState, pathname } = location;
    const { forceAutoplay: forceAutoplayParam, forceDisableAutoplay } = locationState || {};
    const urlParams = search && new URLSearchParams(search);
    const collectionId = urlParams && urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);

    const isPlayable = RENDER_MODES.FLOATING_MODES.includes(renderMode);
    const isAPurchaseOrPreorder = purchaseTag || preorderTag || rentalTag;
    const isAnonymousFiatContent = fiatRequired && !channelClaimId;

    // check if there is a time or autoplay parameter, if so force autoplay
    const urlTimeParam = href && href.indexOf('t=') > -1;
    const autoplayEnabled =
      !forceDisableAutoplay &&
      (!embedded || (urlParams && urlParams.get('autoplay'))) &&
      (forceAutoplayParam || urlTimeParam || autoplay);
    const videoOnPage = document.querySelector('.vjs-tech');

    const autoplayVideo = autoplayEnabled && !videoOnPage && isPlayable;
    const autoRenderClaim = !embedded && RENDER_MODES.AUTO_RENDER_MODES.includes(renderMode);
    const shouldAutoplay = autoplayVideo || autoRenderClaim;

    const sdkFeePending = costInfo === undefined || (costInfo && costInfo.cost !== 0);
    const pendingFiatPayment = !claimIsMine && fiatRequired && (!fiatPaid || isFetchingPurchases);
    const pendingSdkPayment = !claimIsMine && sdkFeePending && !sdkPaid;
    const pendingPurchase = pendingFiatPayment || pendingSdkPayment;

    // false means no restrictions, undefined === fetching, true === restricted
    const pendingUnlockedRestrictions = contentRestrictedFromUser !== false;

    const cannotViewFile = pendingPurchase || pendingUnlockedRestrictions || isAnonymousFiatContent;
    const canViewFile = !cannotViewFile;

    const streamStarted = streamingUri === uri;
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

      doFileGetForUri(uri);
      doUriInitiatePlay(playingOptions, isPlayable);
      analytics.event.playerLoaded(renderMode, embedded);

      setStreamingUri(uri);
    }, [
      claimLinkId,
      collectionId,
      doFileGetForUri,
      doUriInitiatePlay,
      embedded,
      isMarkdownPost,
      isPlayable,
      parentCommentId,
      pathname,
      renderMode,
      search,
      uri,
    ]);

    React.useEffect(() => {
      if (canViewFile && shouldAutoplay && !streamStarted) {
        streamClaim();
      }
    }, [canViewFile, streamStarted, shouldAutoplay, streamClaim]);

    useFetchLiveStatus(isLivestreamClaim ? channelClaimId : undefined, doFetchChannelLiveStatus);

    // -- Restricted State -- render instead of component, until no longer restricted
    if (!canViewFile) {
      return (
        <ClaimCoverRender uri={uri}>
          {pendingFiatPayment || pendingSdkPayment ? (
            <PaidContentOverlay uri={uri} />
          ) : pendingUnlockedRestrictions ? (
            <ProtectedContentOverlay uri={uri} fileUri={uri} />
          ) : null}
        </ClaimCoverRender>
      );
    }

    // -- Loading State -- return before component render
    if (!streamingUrl) {
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
    return <StreamClaimComponent uri={uri} streamClaim={streamClaim} />;
  };

  return StreamClaimWrapper;
};

export default withStreamClaimRender;
