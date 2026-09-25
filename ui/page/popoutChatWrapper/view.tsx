import { getChannelIdFromClaim } from 'util/claim';
import { formatLbryChannelName } from 'util/url';
import { buildURI } from 'util/lbryURI';
import { lazyImport } from 'util/lazyImport';
import { useParams } from 'react-router-dom';
import Page from 'component/page';
import React from 'react';
import Yrbl from 'component/yrbl';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import {
  selectNoRestrictionOrUserIsMemberForContentClaimId,
  selectIsProtectedContentLockedFromUserForId,
} from 'redux/selectors/memberships';
import { doCommentSocketConnectAsCommenter, doCommentSocketDisconnectAsCommenter } from 'redux/actions/websocket';
import { doResolveUri } from 'redux/actions/claims';
import { doMembershipList } from 'redux/actions/memberships';

const ChatLayout = lazyImport(
  () =>
    import(
      'component/chat'
      /* webpackChunkName: "chat" */
    )
);

export default function PopoutChatPage() {
  const params = useParams();
  const { channelName, streamName } = params;
  const uri =
    buildURI({
      channelName: channelName ? channelName.replace(':', '#') : '',
      streamName: streamName ? streamName.replace(':', '#') : '',
    }) || '';

  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const isProtectedContent = useAppSelector((state) => Boolean(selectProtectedContentTagForUri(state, uri)));
  const contentUnlocked = useAppSelector((state) =>
    claim ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim.claim_id) : false
  );
  const contentRestrictedFromUser = useAppSelector((state) =>
    claim ? selectIsProtectedContentLockedFromUserForId(state, claim.claim_id) : false
  );

  React.useEffect(() => {
    if (!claim) dispatch(doResolveUri(uri, true));
  }, [claim, dispatch, uri]);
  React.useEffect(() => {
    if (!claim) return;
    const { claim_id: claimId, signing_channel: channelClaim } = claim;
    const claimChannelName = channelClaim && formatLbryChannelName(channelClaim.canonical_url);
    const reversedClaimId = claimId.split('').toReversed().join('');
    const claimIdToUse = isProtectedContent ? reversedClaimId : claimId;

    if (claimId && claimChannelName && contentUnlocked) {
      dispatch(doCommentSocketConnectAsCommenter(uri, claimChannelName, claimIdToUse, isProtectedContent));
    }

    return () => {
      if (claimId && claimChannelName && contentUnlocked)
        dispatch(doCommentSocketDisconnectAsCommenter(claimIdToUse, claimChannelName));
    };
  }, [claim, contentUnlocked, dispatch, isProtectedContent, uri]);
  React.useEffect(() => {
    if (claim) {
      const channelId = getChannelIdFromClaim(claim) || 'invalid';
      dispatch(
        doMembershipList({
          channel_claim_id: channelId,
        })
      );
    }
  }, [claim, dispatch]);

  if (contentRestrictedFromUser) {
    return (
      <div className="main--empty">
        <Yrbl type="sad" subtitle={__('No results')} />
      </div>
    );
  }

  return (
    <Page noSideNavigation noFooter noHeader isPopoutWindow>
      <ChatLayout uri={uri} isPopoutWindow />
    </Page>
  );
}
