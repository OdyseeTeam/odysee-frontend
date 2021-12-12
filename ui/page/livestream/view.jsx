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
  const [isBroadcasting, setIsBroadcasting] = React.useState('pending');
  const livestreamChannelId = channelClaimId;

  React.useEffect(() => {
    if (isBroadcasting !== 'pending') setIsBroadcastingInitialized(true);
  }, [isBroadcasting]);

  React.useEffect(() => {
    if (!livestreamChannelId) {
      setIsBroadcasting(false);
      return;
    }
    return watchLivestreamStatus(livestreamChannelId, (state) => {
      setIsBroadcasting(state);
    });
  }, [livestreamChannelId, setIsBroadcasting]);

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

    const checkShowLivestream = () => isBroadcasting === true && (claimReleaseInPast() || claimReleaseStartingSoon());

    const checkShowScheduledInfo = () =>
      (!isBroadcasting && (claimReleaseInFuture() || claimReleaseStartedRecently())) ||
      (isBroadcasting === true && claimReleaseInFuture() && !claimReleaseStartingSoon());

    const checkCommentsDisabled = () => chatDisabled || (claimReleaseInFuture() && !claimReleaseStartingSoon());

    const calculateStreamReleaseState = () => {
      setShowLivestream(checkShowLivestream());
      setShowScheduledInfo(checkShowScheduledInfo());
      setHideComments(checkCommentsDisabled());
    };

    calculateStreamReleaseState();
    const intervalId = setInterval(calculateStreamReleaseState, 1000);
    return () => clearInterval(intervalId);
  }, [isBroadcastingInitialized, chatDisabled, isBroadcasting, release]);

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
    isBroadcasting !== 'pending' && (
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
          isBroadcasting={isBroadcasting}
          showLivestream={showLivestream}
          showScheduledInfo={showScheduledInfo}
        />
      </Page>
    )
  );
}
