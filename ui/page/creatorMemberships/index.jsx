// @flow
import React from 'react';

import * as PAGES from 'constants/pages';

import Button from 'component/button';
import Page from 'component/page';
import HelpHub from 'component/common/help-hub';
import BalanceText from 'react-balance-text';

import './style.scss';

const MembershipsLandingPage = () => (
  <Page className="premium-wrapper">
    <div>
      <h1 className="creator-memberships-header">{__('Creator Memberships')}</h1>
      <hr className="creator-memberships-seperator" />
    </div>

    <div className="membership-wrapper">
      <img src="/public/img/my_pledges.jpg" />

      <div className="membership-content supporter">
        <h2>{__('Donor Portal')}</h2>
        <div className="separator">
          <div />
        </div>
        <p className="portal-tagline">{__('Find creators you like and support them')}</p>
        <Button button="primary" navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`} label={__('Enter Donor Portal')} />
      </div>
    </div>

    <div className="membership-wrapper">
      <img src="/public/img/my_channels.jpg" />

      <div className="membership-content memberships">
        <h2>{__('Membership Portal')}</h2>
        <div className="separator">
          <div />
        </div>

          <p className="portal-tagline">
            <BalanceText>
              {__('Create memberships and have users subscribe to them to support you.')}
          </BalanceText>
          </p>

        <Button button="primary" navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} label={__('Manage Memberships')} />
        {/*
        <div className="ugly-alien-box">
          <I18nMessage
            tokens={{
              help_hub: (
                <a rel="noopener noreferrer" href="https://help.odysee.tv/category-memberships/" target="_blank">
                  {__('Help Hub')}
                </a>
              ),
            }}
          >
            Click here to read more information in the %help_hub%.
          </I18nMessage>
          <img src="/public/img/lady_fungus.png" />
        </div>
        */}
      </div>
    </div>
    <HelpHub
      href="https://help.odysee.tv/category-memberships/"
      image="lady_fungus.png"
      text="What are Memberships? Lady Fungus can explain it in the %help_hub%."
    />
  </Page>
);

export default MembershipsLandingPage;
