// @flow
import React from 'react';
import Yrbl from 'component/yrbl';
import Spinner from 'component/spinner';
import MembershipRow from './internal/membershipRow';

type Props = {
  // -- redux --
  myMembershipSubs: Array<MembershipSub>,
  isFetchingMembershipSubs: boolean,
  doMembershipMine: () => Promise<MembershipSub>,
  activeChannelClaim: ChannelClaim,
  doResolveClaimIds: (claimIds: Array<string>) => Promise<any>,
};

function PledgesTab(props: Props) {
  const { myMembershipSubs, isFetchingMembershipSubs, doMembershipMine, doResolveClaimIds } = props;
  React.useEffect(() => {
    if (myMembershipSubs === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myMembershipSubs]);
  const subChannelIds = React.useMemo(() => {
    return myMembershipSubs ? myMembershipSubs.map(sub => sub.membership.channel_claim_id) : [];
  }, [myMembershipSubs]);

  const [resolved, setResolved] = React.useState(false);
  React.useEffect(() => {
    if (!resolved && subChannelIds && subChannelIds.length) {
      setResolved(true);
      doResolveClaimIds(subChannelIds);
    }
  }, [subChannelIds, doResolveClaimIds, resolved]);

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
                <th>{__('Paid Until')}</th>
                <th>{__('Months Supported')}</th>
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
