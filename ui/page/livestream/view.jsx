// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import Page from 'component/page';
import LivestreamLayout from 'component/livestreamLayout';
import analytics from 'analytics';
import moment from 'moment';
import watchLivestreamStatus from '$web/src/livestreaming/long-polling';
import { LIVESTREAM_STARTS_SOON_BUFFER, LIVESTREAM_STARTED_RECENTLY_BUFFER } from 'constants/livestream';

const LivestreamComments = lazyImport(() => import('component/livestreamComments' /* webpackChunkName: "comments" */));

type Props = {
  uri: string,
  claim: StreamClaim,
  doSetPlayingUri: ({ uri: ?string }) => void,
  isAuthenticated: boolean,
  doUserSetReferrer: (string) => void,
  channelClaimId: ?string,
  chatDisabled: boolean,
  doCommentSocketConnect: (string, string) => void,
  doCommentSocketDisconnect: (string) => void,
  currentlyLiveClaim?: any,
  doFetchActiveLivestream: (string) => void,
  checkedActiveLiveStream: boolean,
};

export default function LivestreamPage(props: Props) {
  const {
    uri,
    claim,
    doSetPlayingUri,
    isAuthenticated,
    doUserSetReferrer,
    channelClaimId,
    chatDisabled,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
    currentlyLiveClaim,
    doFetchActiveLivestream,
    checkedActiveLiveStream,
  } = props;

  React.useEffect(() => {
    // TODO: This should not be needed one we unify the livestream player (?)
    analytics.playerLoadedEvent('livestream', false);
  }, []);

  const claimId = claim && claim.claim_id;
  React.useEffect(() => {
    if (claimId) {
      doCommentSocketConnect(uri, claimId);
    }

    return () => {
      if (claimId) {
        doCommentSocketDisconnect(claimId);
      }
    };
  }, [claimId, uri, doCommentSocketConnect, doCommentSocketDisconnect]);

  const [isBroadcastingInitialized, setIsBroadcastingInitialized] = React.useState(false);
  const [isChannelBroadcasting, setIsChannelBroadcasting] = React.useState('pending');
  const [isCurrentClaimLive, setIsCurrentClaimLive] = React.useState(false);
  const livestreamChannelId = channelClaimId || '';

  React.useEffect(() => {
    if (isChannelBroadcasting !== 'pending') setIsBroadcastingInitialized(true);
  }, [isChannelBroadcasting]);

  React.useEffect(() => {
    if (!livestreamChannelId) {
      setIsChannelBroadcasting(false);
      return;
    }
    return watchLivestreamStatus(livestreamChannelId, (state) => {
      setIsChannelBroadcasting(state);
    });
  }, [livestreamChannelId, setIsChannelBroadcasting]);

  // Find out which claim is considered live.
  React.useEffect(() => {
    if (isChannelBroadcasting) {
      doFetchActiveLivestream(livestreamChannelId);
      const intervalId = setInterval(() => {
        doFetchActiveLivestream(livestreamChannelId);
      }, 30000);
      return () => clearInterval(intervalId);
    }
  }, [livestreamChannelId, isChannelBroadcasting, doFetchActiveLivestream]);

  React.useEffect(() => {
    if (currentlyLiveClaim) setIsCurrentClaimLive(currentlyLiveClaim.claimId === claimId);
  }, [currentlyLiveClaim, claimId]);

  // $FlowFixMe
  const release = moment.unix(claim.value.release_time);

  const [showLivestream, setShowLivestream] = React.useState(false);
  const [showScheduledInfo, setShowScheduledInfo] = React.useState(false);
  const [hideComments, setHideComments] = React.useState(false);

  React.useEffect(() => {
    if (!isBroadcastingInitialized) return;

    const claimReleaseInFuture = () => release.isAfter();

    const claimReleaseInPast = () => release.isBefore();

    const claimReleaseStartingSoon = () =>
      release.isBetween(moment(), moment().add(LIVESTREAM_STARTS_SOON_BUFFER, 'minutes'));

    const claimReleaseStartedRecently = () =>
      release.isBetween(moment().subtract(LIVESTREAM_STARTED_RECENTLY_BUFFER, 'minutes'), moment());

    const checkShowLivestream = () =>
      isChannelBroadcasting === true && isCurrentClaimLive && (claimReleaseInPast() || claimReleaseStartingSoon());

    const checkShowScheduledInfo = () =>
      (isChannelBroadcasting === false && (claimReleaseInFuture() || claimReleaseStartedRecently())) ||
      (isChannelBroadcasting === true &&
        ((!isCurrentClaimLive && (claimReleaseInFuture() || claimReleaseStartedRecently())) ||
          (isCurrentClaimLive && claimReleaseInFuture() && !claimReleaseStartingSoon())));

    const checkCommentsDisabled = () => chatDisabled || (claimReleaseInFuture() && !claimReleaseStartingSoon());

    const calculateStreamReleaseState = () => {
      setShowLivestream(checkShowLivestream());
      setShowScheduledInfo(checkShowScheduledInfo());
      setHideComments(checkCommentsDisabled());
    };

    calculateStreamReleaseState();
    const intervalId = setInterval(calculateStreamReleaseState, 1000);

    if (isCurrentClaimLive && claimReleaseInPast() && isChannelBroadcasting === true) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isBroadcastingInitialized, chatDisabled, isChannelBroadcasting, release, isCurrentClaimLive]);

  const stringifiedClaim = JSON.stringify(claim);

  React.useEffect(() => {
    if (uri && stringifiedClaim) {
      const jsonClaim = JSON.parse(stringifiedClaim);
      if (!isAuthenticated) {
        const uri = jsonClaim.signing_channel && jsonClaim.signing_channel.permanent_url;
        if (uri) {
          doUserSetReferrer(uri.replace('lbry://', '')); //
        }
      }
    }
  }, [uri, stringifiedClaim, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    // Set playing uri to null so the popout player doesnt start playing the dummy claim if a user navigates back
    // This can be removed when we start using the app video player, not a LIVESTREAM iframe
    doSetPlayingUri({ uri: null });
  }, [doSetPlayingUri]);

  return (
    isChannelBroadcasting !== 'pending' &&
    checkedActiveLiveStream && (
      <Page
        className="file-page"
        noFooter
        livestream
        chatDisabled={hideComments}
        rightSide={
          !hideComments && (
            <React.Suspense fallback={null}>
              <LivestreamComments uri={uri} />
            </React.Suspense>
          )
        }
      >
        <LivestreamLayout
          uri={uri}
          hideComments={hideComments}
          release={release}
          isCurrentClaimLive={isCurrentClaimLive}
          showLivestream={showLivestream}
          showScheduledInfo={showScheduledInfo}
        />
      </Page>
    )
  );
}
