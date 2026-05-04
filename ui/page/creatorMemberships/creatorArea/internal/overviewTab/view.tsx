import React from 'react';
import HelpHub from 'component/common/help-hub';
import ChannelOverview from './internal/channelOverview';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import {
  selectMyTotalSupportersAmount,
  selectMyTotalMonthlyIncome,
  selectPreviousMonthlyIncome,
} from 'redux/selectors/memberships';
import { doSetActiveChannel } from 'redux/actions/app';
import './style.scss';
type Props = {
  onChannelSelect: () => void;
};

function OverviewTab(props: Props) {
  const { onChannelSelect } = props;
  const dispatch = useAppDispatch();
  const myChannelClaims = useAppSelector(selectMyChannelClaims);
  const totalSupportersAmount = useAppSelector(selectMyTotalSupportersAmount);
  const totalMonthlyIncome = useAppSelector(selectMyTotalMonthlyIncome);
  const previousMonthlyIncome = useAppSelector(selectPreviousMonthlyIncome);

  function selectChannel(channelClaim) {
    dispatch(doSetActiveChannel(channelClaim.claim_id, true));
    onChannelSelect();
  }

  return (
    <>
      <div className="membership-overview-stats">
        <div className="membership-overview-stat">
          <span>{__('Total Supporters')}</span>
          <strong>{totalSupportersAmount}</strong>
        </div>
        <div className="membership-overview-stat">
          <span>{__('Income Last Month')}</span>
          <strong>${(previousMonthlyIncome / 100).toFixed(2)}</strong>
        </div>
        <div className="membership-overview-stat">
          <span>{__('Projected Monthly Income')}</span>
          <strong>${(totalMonthlyIncome / 100).toFixed(2)}</strong>
        </div>
      </div>

      <div className="membership-overview-list">
        <div className="membership-overview-list__header">
          <span>{__('Channel Name')}</span>
          <span>{__('Supporters')}</span>
          <span>{__('Estimated Monthly Income')}</span>
          <span>{__('Page')}</span>
          <span>{__('URL')}</span>
        </div>

        {myChannelClaims.map((channelClaim: ChannelClaim) => (
          <div key={channelClaim.claim_id} className="membership-overview-channel">
            <ChannelOverview channelClaim={channelClaim} onSelect={() => selectChannel(channelClaim)} />
          </div>
        ))}
      </div>

      <HelpHub
        href="https://help.odysee.tv/category-memberships/"
        image="Spaceman"
        text={__(
          'Want to increase your channel growth? Spaceman has whipped up some marketing concepts in the %help_hub%.'
        )}
      />
    </>
  );
}

export default OverviewTab;
