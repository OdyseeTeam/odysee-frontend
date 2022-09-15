// @flow
import React from 'react';
import { URL } from 'config';
import { formatLbryUrlForWeb } from 'util/url';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import ChannelThumbnail from 'component/channelThumbnail';
import ButtonNavigateChannelId from 'component/buttonNavigateChannelId';
import Page from 'component/page';

import './style.scss';

type Props = {
  channelsToList: ?Array<ChannelClaim>,
  onTabChange: (tabIndex: number) => void,
  hasTiers: ?boolean,
  // -- redux --
  bankAccountConfirmed: ?boolean,
  doSetActiveChannel: (claimId: ?string, override?: boolean) => void,
};

function MembershipsLandingPage(props: Props) {
  const { channelsToList, onTabChange, hasTiers, bankAccountConfirmed, doSetActiveChannel } = props;

  function selectChannel(channelClaim) {
    doSetActiveChannel(channelClaim.claim_id, true);
    onTabChange(1);
  }

  return (
    <>
      <Page className="premium-wrapper">
        <div>
          <h1 className="creator-memberships-header">Creator Memberships</h1>
          <hr className="creator-memberships-seperator"/>
        </div>
        <div className="membership__mypledges-wrapper">
          <div className="membership__mypledges-header">
            <div />
            <label>Donor Portal</label>
          </div>
          <div className="membership__mypledges-content">
            <h1 className="portal-tagline">Find creators you like and support them</h1>
            <Button
              button="primary"
              navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`}
              label={__('Enter Donor Portal')}
            />
          </div>
        </div>

        <div className="membership__mychannels-wrapper">
          <div className="membership__mychannels-header">
            <div />
            <label>Membership Portal</label>
          </div>
          <div className="membership__mychannels-content">
            <h1 className="portal-tagline">Create memberships and have users subscribe to them to support you</h1>
            <Button
              button="primary"
              navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`}
              label={__('Manage Memberships')}
            />
          </div>
        </div>

        <div className="creator-memberships-help-div">
          <h1>Click here to read more information in the&nbsp;</h1>
          <a rel="noopener noreferrer" href="https://help.odysee.tv/category-memberships/" target="_blank">
            <h1 className="help-hub-link">Help Hub</h1>
          </a>
        </div>

      </Page>
    </>
  );
}

export default MembershipsLandingPage;
