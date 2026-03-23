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
      <table className="table table-total">
        <tr>
          {/* todo: allow sorting */}
          <td>
            {/* todo: make this a link to the supporters tab with all channel set to on */}
            {/* so they can see all their supporters */}
            {__('Total Supporters')} <span>{totalSupportersAmount}</span>
          </td>
          <td>
            {__('Income Last Month')} <span>${(previousMonthlyIncome / 100).toFixed(2)}</span>
          </td>
          <td>
            {__('Projected Monthly Income')} <span>${(totalMonthlyIncome / 100).toFixed(2)}</span>
          </td>
        </tr>
      </table>

      <div className="membership-table__wrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="channelName-header" colSpan="2">
                {__('Channel Name')}
              </th>
              <th>{__('Supporters')}</th>
              <th>{__('Estimated Monthly Income')}</th>
              <th className="membership-table__page">{__('Page')}</th>
              <th className="membership-table__url">{__('URL')}</th>
            </tr>
          </thead>

          <tbody>
            {myChannelClaims.map((channelClaim) => (
              <tr key={channelClaim.claim_id} onClick={() => selectChannel(channelClaim)}>
                <ChannelOverview channelClaim={channelClaim} />
              </tr>
            ))}
          </tbody>
        </table>
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
