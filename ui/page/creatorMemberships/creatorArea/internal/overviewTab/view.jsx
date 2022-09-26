// @flow
import React from 'react';

import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';

import * as ICONS from 'constants/icons';

import CopyableText from 'component/copyableText';
import ChannelThumbnail from 'component/channelThumbnail';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import HelpHub from 'component/common/help-hub';
import TruncatedText from 'component/common/truncated-text';

import './style.scss';

type Props = {
  onChannelSelect: () => void,
  // -- redux --
  myChannelClaims: Array<ChannelClaim>,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
};

function OverviewTab(props: Props) {
  const { onChannelSelect, myChannelClaims, doSetActiveChannel } = props;

  function selectChannel(channelClaim) {
    doSetActiveChannel(channelClaim.claim_id, true);
    onChannelSelect();
  }

  return (
    <>
      <table className="table table-total">
        <tr>
          <td>
            {__('Total Supporters:')} <span>{0}</span>
          </td>
          <td>
            {__('Total Monthly Income:')} <span>${0}</span>
          </td>
          <td>
            {__('Total Received:')} <span>${0}</span>
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
              <th>{__('Total Received')}</th>
              <th className="membership-table__page">{__('Page')}</th>
              <th className="membership-table__url">{__('URL')}</th>
            </tr>
          </thead>

          <tbody>
            {myChannelClaims.map((channelClaim) => (
              <tr key={channelClaim.claim_id} onClick={() => selectChannel(channelClaim)}>
                <td className="channelThumbnail">
                  <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />
                </td>
                <td>
                  <TruncatedText text={channelClaim.value.title || channelClaim.name} lines={1} />
                </td>
                <td>0</td>
                <td>$0</td>
                <td>$0</td>
                <td>
                  <ButtonNavigateChannelId
                    button="primary"
                    // className="membership_button"
                    // label={__('View your membership page')}
                    icon={ICONS.MEMBERSHIP}
                    navigate={`${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
                  />
                </td>
                <td className="membership-table__url">
                  <CopyableText
                    onlyCopy
                    primaryButton
                    copyable={`${URL}${formatLbryUrlForWeb(channelClaim.canonical_url)}?view=membership`}
                    snackMessage={__('Page location copied')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HelpHub
        href="https://help.odysee.tv/category-memberships/"
        image="Spaceman"
        text="Want to increase your channel growth? Spaceman has whipped up some marketing concepts in the %help_hub%."
      />
    </>
  );
}

export default OverviewTab;
