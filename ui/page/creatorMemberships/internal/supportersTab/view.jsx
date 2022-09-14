// @flow
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';
import moment from 'moment';
import Spinner from 'component/spinner';
import Button from 'component/button';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  // -- redux --
  supportersList: ?SupportersList,
  doGetMembershipSupportersList: () => void,
  onTabChange: (tabIndex: number) => void,
};

const SupportersTab = (props: Props) => {
  const { channelsToList, supportersList, doGetMembershipSupportersList, onTabChange } = props;

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
        {channelsToList &&
          channelsToList.map((channelClaim) => {
            const supportersForChannel =
              supportersList &&
              supportersList.filter((supporter) => channelClaim.name === supporter.ChannelBeingSupported);

            return (
              supportersForChannel &&
              supportersForChannel.length > 0 && (
                <React.Fragment key={channelClaim.claim_id}>
                  <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
                  {channelClaim.value.title || channelClaim.name}

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
                </React.Fragment>
              )
            );
          })}
      </table>
    </div>
  );
};

export default SupportersTab;
