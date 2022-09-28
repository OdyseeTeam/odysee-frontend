// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import Page from 'component/page';
import HelpHub from 'component/common/help-hub';

import './style.scss';

const MembershipsLandingPage = () => (
  <Page className="premium-wrapper">
    <div>
      <h1 className="membership-wrapper-title">
        <Icon icon={ICONS.MEMBERSHIP} size={10} />
        <label>{__('Memberships')}</label>
      </h1>
    </div>

    <div className="membership-wrapper supporter">
      <div className="membership-content">
        <div>
          <h2>{__('Donor Portal')}</h2>
          <p className="portal-tagline">{__('Find creators you like and support them.')}</p>
          <Button button="primary" navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`} label={__('Enter Donor Portal')} />
        </div>
      </div>
    </div>

    <div className="membership-wrapper memberships">
      <div className="membership-content">
        <div>
          <h2>{__('Membership Portal')}</h2>
          <p className="portal-tagline">{__('Create memberships and have users subscribe to them to support you.')}</p>
          <Button button="primary" navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} label={__('Manage Memberships')} />
        </div>
      </div>
    </div>
    <HelpHub
      href="https://help.odysee.tv/category-memberships/"
      image="LadyFungus"
      text={__('What are Memberships? Lady Fungus can explain it in the %help_hub%.')}
    />
  </Page>
);

export default MembershipsLandingPage;
