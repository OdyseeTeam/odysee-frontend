// @flow
import React from 'react';
import Yrbl from 'component/yrbl';
import Spinner from 'component/spinner';
import MembershipRow from './internal/membershipRow';
import { buildURI } from 'util/lbryURI';

type Props = {
  // -- redux --
  myMembershipSubs: Array<MembershipSub>,
  isFetchingMembershipSubs: boolean,
  doMembershipMine: () => Promise<MembershipSub>,
  activeChannelClaim: ChannelClaim,
  doResolveUris: (uris: Array<string>, cache: boolean) => Promise<any>,
};

function PledgesTab(props: Props) {
  const { myMembershipSubs, isFetchingMembershipSubs, doMembershipMine, doResolveUris } = props;
  React.useEffect(() => {
    if (myMembershipSubs === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myMembershipSubs]);
  const subChannelUris = React.useMemo(() => {
    return myMembershipSubs ? myMembershipSubs.map(sub => {
      const creatorUri = buildURI({
        channelName: sub.membership.name,
        channelClaimId: sub.membership.channel_claim_id,
      });
      return creatorUri;
    }) : [];
  }, [myMembershipSubs]);

  const [resolved, setResolved] = React.useState(false);
  React.useEffect(() => {
    if (!resolved && subChannelUris && subChannelUris.length) {
      setResolved(true);
      doResolveUris(subChannelUris);
    }
  }, [subChannelUris, doResolveUris, resolved]);

  if (myMembershipSubs === undefined && isFetchingMembershipSubs) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  } else if (myMembershipSubs === undefined && !isFetchingMembershipSubs) {
    return (
      <div className="main--empty">
        <p>{__('Failed to fetch memberships')}</p>
      </div>
    );
  }

  if (!myMembershipSubs || myMembershipSubs.length === 0) {
    return (
      <div className="membership__mypledges-wrapper">
        <div className="membership__mypledges-content">
          <Yrbl
            type="happy"
            subtitle={__('Find creators that you like and support them. Your pledges will show up on this page.')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="membership__mypledges-wrapper">
      <div className="membership__mypledges-content">
        <div className="membership-table__wrapper">
          <table className="table table--pledges">
            <thead>
              <tr>
                <th className="channelName-header" colSpan="2">
                  {__('Channel Name')}
                </th>
                <th>{__('Tier')}</th>
                <th>{__('Total Supporting Time')}</th>
                <th>{__('Amount')}</th>
                <th>{__('Status')}</th>
                <th className="membership-table__page">{__('Page')}</th>
              </tr>
            </thead>
            <tbody>
              {myMembershipSubs.map((membershipSub) => {
                  return (
                    <MembershipRow membershipSub={membershipSub} key={membershipSub.id} />
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default PledgesTab;
