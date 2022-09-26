// @flow
import React from 'react';
import moment from 'moment';

import ChannelThumbnail from 'component/channelThumbnail';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import Button from 'component/button';
import ErrorBubble from 'component/common/error-bubble';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  onTabChange: (tabIndex: number) => void,
  // -- redux --
  supportersList: ?SupportersList,
  channelMembershipTiers: ?CreatorMemberships,
  doGetMembershipSupportersList: () => void,
};

const SupportersTab = (props: Props) => {
  const {
    channelsToList,
    onTabChange,
    // -- redux --
    supportersList,
    channelMembershipTiers,
    doGetMembershipSupportersList,
  } = props;

  const hasAnySupporters = React.useMemo(() => {
    return Boolean(
      channelsToList &&
        channelsToList.some((channel) => {
          const channelHasSupporters =
            supportersList && supportersList.some((supporter) => channel.name === supporter.ChannelBeingSupported);

          return channelHasSupporters;
        })
    );
  }, [channelsToList, supportersList]);

  const isViewingSingleChannel = channelsToList && channelsToList.length === 1;

  React.useEffect(() => {
    if (supportersList === undefined) {
      doGetMembershipSupportersList();
    }
  }, [doGetMembershipSupportersList, supportersList]);

  if (supportersList === undefined) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  if (isViewingSingleChannel && !channelMembershipTiers) {
    return (
      <ErrorBubble
        title={__(`This channel doesn't have any Tiers`)}
        subtitle={__('To be able to begin receiving payments you have to add at least 1 Tier to your channel.')}
        action={<Button button="primary" label={__('Add a Tier')} onClick={() => onTabChange(2)} />}
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
            const supportersForChannel =
              supportersList &&
              supportersList.filter((supporter) => listedChannelClaim.name === supporter.ChannelBeingSupported);

            return (
              supportersForChannel &&
              supportersForChannel.length > 0 && (
                <React.Fragment key={listedChannelClaim.claim_id}>
                  <div className="table-channel-header">
                    {__('Supporters for:')}
                    {(!isViewingSingleChannel || !channelMembershipTiers) && (
                      <ChannelThumbnail xsmall uri={listedChannelClaim.canonical_url} />
                    )}
                    {(!isViewingSingleChannel || !channelMembershipTiers) &&
                      (listedChannelClaim.value.title || listedChannelClaim.name)}
                  </div>

                  <table className="table">
                    <thead>
                      <tr>
                        <th>{__('Channel Name')}</th>
                        <th className="channelName-header">{__('Tier')}</th>
                        <th>{__('Amount')}</th>
                        <th>{__('Joined On')}</th>
                        <th>{__('Months Supporting')}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {supportersForChannel.map((supporter, i) => (
                        <tr key={i}>
                          <td>
                            <span dir="auto" className="button__label">
                              {supporter.ChannelName === '' ? __('Anonymous') : supporter.ChannelName}
                            </span>
                          </td>
                          <td>{supporter.MembershipName}</td>
                          <td>${supporter.Price / 100} USD / Month</td>
                          <td>{moment(new Date(supporter.JoinedAtTime)).format('MMMM Do YYYY')}</td>
                          <td>
                            {Math.ceil(moment(new Date()).diff(new Date(supporter.JoinedAtTime), 'months', true))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </React.Fragment>
              )
            );
          })}
      </div>
    </>
  );
};

export default SupportersTab;
