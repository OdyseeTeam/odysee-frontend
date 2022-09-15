// @flow
import React from 'react';

import * as PAGES from 'constants/pages';

import Button from 'component/button';
import Page from 'component/page';
import I18nMessage from 'component/i18nMessage';

import './style.scss';

const MembershipsLandingPage = () => (
  <Page className="premium-wrapper">
    <div>
      <h1 className="creator-memberships-header">{__('Creator Memberships')}</h1>
      <hr className="creator-memberships-seperator" />
    </div>

    <div className="membership__mypledges-wrapper">
      <div className="membership__mypledges-header">
        <div />
        <label>{__('Donor Portal')}</label>
      </div>

      <div className="membership__mypledges-content">
        <h1 className="portal-tagline">{__('Find creators you like and support them')}</h1>
        <Button button="primary" navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`} label={__('Enter Donor Portal')} />
      </div>
    </div>

    <div className="membership__mychannels-wrapper">
      <div className="membership__mychannels-header">
        <div />
        <label>{__('Membership Portal')}</label>
      </div>

      <div className="membership__mychannels-content">
        <h1 className="portal-tagline">{__('Create memberships and have users subscribe to them to support you')}</h1>
        <Button button="primary" navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} label={__('Manage Memberships')} />
      </div>
    </div>

    <div className="creator-memberships-help-div">
      <I18nMessage
        tokens={{
          help_hub: (
            <a rel="noopener noreferrer" href="https://help.odysee.tv/category-memberships/" target="_blank">
              <h1 className="help-hub-link">{' ' + __('Help Hub')}</h1>
            </a>
          ),
        }}
      >
        Click here to read more information in the %help_hub%
      </I18nMessage>
    </div>
  </Page>
);

export default MembershipsLandingPage;
