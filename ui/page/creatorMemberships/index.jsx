// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import Page from 'component/page';
import HelpHub from 'component/common/help-hub';

import './style.scss';
import { useHistory } from 'react-router-dom';

const MembershipsLandingPage = () => {
  const { push } = useHistory();

  function handleNavigateToPage(page: string) {
    push(page);
  }
  return (
    <Page className="memberships-wrapper">
      <div className="memberships-header-wrapper">
        <div className="memberships-header">
          <h1>
            <Icon icon={ICONS.MEMBERSHIP} size={10} />
            {__('Memberships')}
          </h1>
        </div>
      </div>

      <div className="memberships-content">
        <div className="memberships">

          <div className="membership-wrapper supporter" onClick={() => handleNavigateToPage(PAGES.MEMBERSHIPS_SUPPORTER)}>
            <div className="membership-content">
              <div>
                <h2>{__('Donor Portal')}</h2>
                <p className="portal-tagline">{__('Find creators you like and support them.')}</p>
                <Button button="primary" navigate={`/$/${PAGES.MEMBERSHIPS_SUPPORTER}`} label={__('Enter Donor Portal')} />
              </div>
            </div>
          </div>

          <div className="membership-wrapper memberships" onClick={() => handleNavigateToPage(PAGES.CREATOR_MEMBERSHIPS)}>
            <div className="membership-content">
              <div>
                <h2>{__('Creator Portal')}</h2>
                <p className="portal-tagline">
                  {__('Create memberships and have users subscribe to them to support you.')}
                </p>
                <Button button="primary" navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} label={__('Manage Memberships')} />
              </div>
            </div>
          </div>
        </div>
        <HelpHub
          href="https://help.odysee.tv/category-memberships/"
          image="LadyFungus"
          text={__('What are Memberships? Lady Fungus can explain it in the %help_hub%.')}
        />
      </div>
    </Page>
  );
};

export default MembershipsLandingPage;
