import React from 'react';
import Page from 'component/page';
import StripeCard from 'component/settingsStripeCard';
import { useAppSelector } from 'redux/hooks';
import { selectCardDetails } from 'redux/selectors/stripe';

const SettingsStripeCardPage = () => {
  const cardDetails = useAppSelector(selectCardDetails);

  return (
    <Page
      settingsPage
      noFooter
      noSideNavigation
      className="card-stack"
      backout={{
        title: __(cardDetails === null ? 'Add Card' : 'Your Card'),
        backLabel: __('Back'),
      }}
    >
      <StripeCard />
    </Page>
  );
};

export default SettingsStripeCardPage;
