// @flow
import React from 'react';

import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';

import Spinner from 'component/spinner';
import Button from 'component/button';
import ErrorBubble from 'component/common/error-bubble';

type Props = {
  component: any,
  switchToTiersTab?: () => void,
  // -- redux --
  myChannelClaims: ?Array<ChannelClaim>,
  bankAccountConfirmed: ?boolean,
  accountDefaultCurrency: ?string,
  hasTiers?: boolean,
  supportersList: ?SupportersList,
  userHasExperimentalUi: boolean,
  userHasOdyseeMembership: boolean,
  doTipAccountStatus: () => Promise<StripeAccountStatus>,
};

const TabWrapper = (props: Props) => {
  const {
    component,
    switchToTiersTab,
    // -- redux --
    myChannelClaims,
    bankAccountConfirmed,
    accountDefaultCurrency,
    hasTiers,
    supportersList,
    userHasExperimentalUi,
    userHasOdyseeMembership,
    doTipAccountStatus,
  } = props;

  const isOnTiersTab = !switchToTiersTab;

  React.useEffect(() => {
    if (bankAccountConfirmed === undefined) {
      doTipAccountStatus();
    }
  }, [bankAccountConfirmed, doTipAccountStatus]);

  if (
    myChannelClaims === undefined ||
    bankAccountConfirmed === undefined ||
    (supportersList === undefined && !isOnTiersTab)
  ) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  if (!userHasExperimentalUi && !userHasOdyseeMembership) {
    return (
      <ErrorBubble
        title={__('Premium Beta')}
        subtitle={__('Sorry, this functionality is only available for Odysee Premium users currently.')}
        action={<Button button="primary" navigate={`/$/${PAGES.ODYSEE_MEMBERSHIP}`} label={__('Join Premium')} />}
      />
    );
  }

  if (!myChannelClaims || myChannelClaims.length === 0) {
    return (
      <ErrorBubble
        title={__("You don't have any channels")}
        subtitle={__('To be able to begin receiving payments you have to have at least 1 channel.')}
        action={<Button button="primary" navigate={`/$/${PAGES.CHANNEL_NEW}`} label={__('Create A Channel')} />}
      />
    );
  }

  if (!bankAccountConfirmed) {
    return (
      <ErrorBubble
        title={__('Bank Account Status')}
        subtitle={__('To be able to begin receiving payments you must connect a Bank Account first.')}
        action={
          <Button
            button="primary"
            label={__('Connect a bank account')}
            icon={ICONS.FINANCE}
            navigate={`$/${PAGES.SETTINGS_STRIPE_ACCOUNT}`}
          />
        }
      />
    );
  }

  if (accountDefaultCurrency !== 'usd') {
    return <ErrorBubble>{__('Only USD banking currently supported, please check back later!')}</ErrorBubble>;
  }

  if (!hasTiers && !isOnTiersTab) {
    return (
      <ErrorBubble
        title={__("You don't have any Tiers")}
        subtitle={__('To be able to begin receiving payments you have to add at least 1 Tier to your channel.')}
        action={<Button requiresChannel button="primary" label={__('Add a Tier')} onClick={switchToTiersTab} />}
      />
    );
  }

  return component;
};

export default TabWrapper;
