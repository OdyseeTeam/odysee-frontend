// @flow
import React from 'react';
import moment from 'moment';

import { buildURI } from 'util/lbryURI';

import ChannelThumbnail from 'component/channelThumbnail';
import Yrbl from 'component/yrbl';
import Button from 'component/button';
import ErrorBubble from 'component/common/error-bubble';
import UriIndicator from 'component/uriIndicator';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  switchToTiersTab: () => void,
  // -- redux --
  supportersList: ?SupportersList,
  channelMembershipTiers: ?CreatorMemberships,
  doResolveClaimIds: (claimIds: Array<string>) => void,
  paymentsBySubscriber: { [channelId: string]: Array<MembershipPayment> }, // payments by id { [id]: [{ paymentobj }...] }
};

const SupportersTab = (props: Props) => {
  const {
    channelsToList,
    switchToTiersTab,
    // -- redux --
    supportersList,
    channelMembershipTiers,
    doResolveClaimIds,
    paymentsBySubscriber,
  } = props;

  // const sl = [
  //   {
  //     subscriber_channel_name: '@iostest', || 'anonymous'
  //     subscriber_channel_claim_id: 'b2de35a63ab37f9c4ec1c65f8135ed0306b7f67f', || ''
  //     supported_channel_name: '@shirely',
  //     membership_name: 'The worst',
  //     price: 10,
  //     currency: 'AR',
  //     interval: 'Monthly',
  //     joined_at: '2025-05-10T04:39:27.822Z',
  //   },
  // ];
  //
  // const supportersList = sl;

  const hasAnySupporters = React.useMemo(() => {
    return Boolean(
      channelsToList &&
        channelsToList.some((channel) => {
          const channelHasSupporters =
            supportersList && supportersList.some((supporter) => channel.name === supporter.supported_channel_name);

          return channelHasSupporters;
        })
    );
  }, [channelsToList, supportersList]);

  const isViewingSingleChannel = channelsToList && channelsToList.length === 1;

  React.useEffect(() => {
    if (supportersList) {
      const supportersClaimIds = supportersList.map((channel) => channel.subscriber_channel_claim_id);
      doResolveClaimIds(supportersClaimIds);
    }
  }, [supportersList, doResolveClaimIds]);

  if (isViewingSingleChannel && !channelMembershipTiers) {
    return (
      <ErrorBubble
        title={__(`This channel doesn't have any Tiers`)}
        subtitle={__('To be able to begin receiving payments you have to add at least 1 Tier to your channel.')}
        action={<Button button="primary" label={__('Add a Tier')} onClick={switchToTiersTab} />}
      />
    );
  }

  if (!hasAnySupporters) {
    return (
      <Yrbl
        title={isViewingSingleChannel ? __('This channel has no supporters yet') : __('No supporters yet')}
        subtitle={__('Once you have supporters, they will appear here.')}
      />
    );
  }

  return (
    <>
      <div className="membership-table__wrapper">
        {channelsToList &&
          channelsToList.map((listedChannelClaim) => {
            const supportersForChannel = supportersList
              ? supportersList
                  .filter((supporter) => listedChannelClaim.name === supporter.supported_channel_name)
                  .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
              : [];

            const supportersWithChannel = supportersForChannel
              ? supportersForChannel.filter((supporter) => supporter.subscriber_channel_name !== 'anonymous')
              : [];

            const anonymousSupporters = supportersForChannel
              ? supportersForChannel.filter((supporter) => supporter.subscriber_channel_name === 'anonymous')
              : [];

            const totalAnonSupport = anonymousSupporters.reduce((ac, cur) => {
              const newac = ac + cur.price;
              return newac;
            }, 0);

            return (
              supportersWithChannel &&
              supportersWithChannel.length > 0 && (
                <React.Fragment key={listedChannelClaim.claim_id}>
                  <div className="table-channel-header">
                    {(!isViewingSingleChannel || !channelMembershipTiers) && (
                      <ChannelThumbnail xsmall uri={listedChannelClaim.canonical_url} />
                    )}
                    {(!isViewingSingleChannel || !channelMembershipTiers) &&
                      (listedChannelClaim.value.title || listedChannelClaim.name)}
                  </div>
                  <div>
                    {anonymousSupporters.length
                      ? `${anonymousSupporters.length} anonymous supporters contributed $${(
                          totalAnonSupport / 100
                        ).toFixed(2)}!`
                      : null}
                  </div>

                  <div className="membership-table__wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="channelName-header" colSpan="2">
                            {__('Channel Name')}
                          </th>
                          <th>{__('Tier')}</th>
                          <th>{__('Amount')}</th>
                          <th>{__('Joined On')}</th>
                          <th>{__('Months Supporting')}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {supportersWithChannel.map((supporter, i) => {
                          const supporterUri =
                            supporter.subscriber_channel_name === ''
                              ? undefined
                              : buildURI({
                                  channelName: supporter.subscriber_channel_name,
                                  channelClaimId: supporter.subscriber_channel_claim_id,
                                });

                          return (
                            <tr key={i}>
                              <td className="channelThumbnail">
                                {supporterUri ? (
                                  <UriIndicator focusable={false} uri={supporterUri} link>
                                    <ChannelThumbnail xsmall link uri={supporterUri} />
                                  </UriIndicator>
                                ) : (
                                  // <ChannelThumbnail xsmall uri={supporterUri} />
                                  __('Anonymous')
                                )}
                              </td>
                              <td>
                                <span dir="auto" className="button__label">
                                  {supporter.subscriber_channel_name === '' ? (
                                    __('Anonymous')
                                  ) : (
                                    <UriIndicator link uri={supporterUri} />
                                  )}
                                </span>
                              </td>
                              <td>{supporter.membership_name}</td>
                              <td>${supporter.price / 100} USD / Month</td>
                              <td>{moment(new Date(supporter.joined_at)).format('LL')}</td>
                              <td>
                                {/* need to put  */}
                                {paymentsBySubscriber[supporter.subscriber_channel_claim_id] &&
                                  paymentsBySubscriber[supporter.subscriber_channel_claim_id].filter(
                                    (p) => p.status === 'paid' || p.status === 'submitted'
                                  ).length}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </React.Fragment>
              )
            );
          })}
      </div>
    </>
  );
};

export default SupportersTab;
