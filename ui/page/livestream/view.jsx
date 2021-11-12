// @flow
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import Page from 'component/page';
import LivestreamLayout from 'component/livestreamLayout';
import analytics from 'analytics';
import Lbry from 'lbry';
import moment from 'moment';
import watchLivestreamStatus from '$web/src/livestreaming/long-polling';

const LivestreamComments = lazyImport(() => import('component/livestreamComments' /* webpackChunkName: "comments" */));

type Props = {
  uri: string,
  claim: StreamClaim,
  doSetPlayingUri: ({ uri: ?string }) => void,
  isAuthenticated: boolean,
  doUserSetReferrer: (string) => void,
  channelClaimId: ?string,
  chatDisabled: boolean,
};

export default function LivestreamPage(props: Props) {
  const { uri, claim, doSetPlayingUri, isAuthenticated, doUserSetReferrer, channelClaimId, chatDisabled } = props;
  const [isLive, setIsLive] = React.useState('pending');
  const [isScheduled, setIsScheduled] = React.useState(false);
  const livestreamChannelId = channelClaimId;
  const [hasLivestreamClaim, setHasLivestreamClaim] = React.useState(false);
  const hideComments = chatDisabled || isScheduled;

  const LIVESTREAM_CLAIM_POLL_IN_MS = 60000;

  React.useEffect(() => {
    // TODO: This should not be needed one we unify the livestream player (?)
    analytics.playerLoadedEvent('livestream', false);
  }, []);

  // Manage isLive status
  React.useEffect(() => {
    if (!livestreamChannelId) {
      setIsLive(false);
      return;
    }
    return watchLivestreamStatus(livestreamChannelId, (state) => setIsLive(state));
  }, [livestreamChannelId, setIsLive]);

  React.useEffect(() => {
    const checkIsScheduled = () => setIsScheduled(Number(claim.value.release_time) > moment().unix());
    checkIsScheduled();
    const interval = setInterval(checkIsScheduled, 1000);
    return () => clearInterval(interval);
  }, []);

  const stringifiedClaim = JSON.stringify(claim);
  React.useEffect(() => {
    if (uri && stringifiedClaim) {
      const jsonClaim = JSON.parse(stringifiedClaim);

      if (jsonClaim) {
        const { txid, nout, claim_id: claimId } = jsonClaim;
        const outpoint = `${txid}:${nout}`;

        analytics.apiLogView(uri, outpoint, claimId);
      }

      if (!isAuthenticated) {
        const uri = jsonClaim.signing_channel && jsonClaim.signing_channel.permanent_url;
        if (uri) {
          doUserSetReferrer(uri.replace('lbry://', ''));
        }
      }
    }
  }, [uri, stringifiedClaim, isAuthenticated]);

  React.useEffect(() => {
    // Set playing uri to null so the popout player doesnt start playing the dummy claim if a user navigates back
    // This can be removed when we start using the app video player, not a LIVESTREAM iframe
    doSetPlayingUri({ uri: null });
  }, [doSetPlayingUri]);

  return (
    isLive !== 'pending' && (
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
          isLive={isLive}
          hideComments={Boolean(hideComments)}
          isScheduled={Boolean(isScheduled)}
      />
      </Page>
    )
  );
}
