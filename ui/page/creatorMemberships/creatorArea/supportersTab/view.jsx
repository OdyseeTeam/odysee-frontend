// @flow
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import moment from 'moment';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import Button from 'component/button';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  onTabChange: (tabIndex: number) => void,
  // -- redux --
  myChannelClaims: ?Array<ChannelClaim>,
  supportersList: ?SupportersList,
  channelMembershipTiers: ?CreatorMemberships,
  doGetMembershipSupportersList: () => void,
};

const SupportersTab = (props: Props) => {
  const {
    channelsToList,
    onTabChange,
    // -- redux --
    myChannelClaims,
    supportersList,
    channelMembershipTiers,
    doGetMembershipSupportersList,
  } = props;

  const isViewingSingleChannel = channelsToList && channelsToList.length === 1;

  const supportedChannels = React.useMemo(() => {
    if (!channelsToList || channelsToList.length > 1) return channelsToList;

    // no tiers for the current channel -> show all others
    if (!channelMembershipTiers) return myChannelClaims;

    return channelsToList;
  }, [channelMembershipTiers, channelsToList, myChannelClaims]);

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

  return (
    <div className="membership-table__wrapper">
      {isViewingSingleChannel && !channelMembershipTiers && (
        <div className="bank-account-status">
          <div>
            <label>{__(`This channel doesn't have any Tiers`)}</label>
            <span>{__('To be able to begin receiving payments you have to add at least 1 Tier to your channel.')}</span>
          </div>
          <Button button="primary" label={__('Add a Tier')} onClick={() => onTabChange(1)} />
        </div>
      )}

      {supportedChannels &&
        supportedChannels.map((channelClaim) => {
          const supportersForChannel =
            supportersList &&
            supportersList.filter((supporter) => channelClaim.name === supporter.ChannelBeingSupported);

          return supportersForChannel && supportersForChannel.length > 0 ? (
            <React.Fragment key={channelClaim.claim_id}>
              {(!isViewingSingleChannel || !channelMembershipTiers) && (
                <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
              )}
              {(!isViewingSingleChannel || !channelMembershipTiers) && (channelClaim.value.title || channelClaim.name)}

              <table className="table">
                <thead>
                  <tr>
                    <th className="date-header">{__('Channel Name')}</th>
                    <th className="channelName-header">{__('Tier')}</th>
                    <th className="location-header">{__('Amount')}</th>
                    <th className="amount-header">{__('Joined On')}</th>
                    <th className="channelName-header">{__('Months Supporting')}</th>
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
                      <td>{Math.ceil(moment(new Date()).diff(new Date(supporter.JoinedAtTime), 'months', true))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </React.Fragment>
          ) : (
            isViewingSingleChannel && channelMembershipTiers && (
              <div className="main--empty">
                <Yrbl type="sad" subtitle={__('No supporters yet...')} />
              </div>
            )
          );
        })}
    </div>
  );
};

export default SupportersTab;
