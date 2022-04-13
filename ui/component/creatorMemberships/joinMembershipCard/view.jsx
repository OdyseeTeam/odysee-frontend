// @flow
import { Form } from 'component/common/form';
import Card from 'component/common/card';
import React from 'react';
import ConfirmationPage from './confirmation-page';
import PreviewPage from './preview-page';

const testChannel = {
  membership_id: 7,
  channel_id: '0b67b972c8e9a15ebc5fd1f316ad38460767c939',
  channel_name: '@test35234',
  price_id: 'price_1KlXw8IrsVv9ySuhFJJ4HSgq',
};

let membershipTiers = [
  {
    displayName: 'Helping Hand',
    description: "You're doing your part, thank you!",
    monthlyContributionInUSD: 5,
    perks: ['exclusiveAccess', 'badge'],
  },
  {
    displayName: 'Big-Time Supporter',
    description: 'You are a true fan and are helping in a big way!',
    monthlyContributionInUSD: 10,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis'],
  },
  {
    displayName: 'Community MVP',
    description: 'Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
];

type Props = {
  uri: string,
  isModal?: boolean,
  closeModal?: () => void,
  // -- redux --
  channelName: ?string,
  fetchStarted: ?boolean,
  canReceiveFiatTips: ?boolean,
  hasSavedCard: ?boolean,
  doMembershipBuy: (any: any) => void,
  doTipAccountCheckForUri: (uri: string) => void,
  doGetCustomerStatus: () => void,
};

export default function JoinMembership(props: Props) {
  const {
    uri,
    isModal,
    closeModal,
    channelName,
    fetchStarted,
    canReceiveFiatTips,
    hasSavedCard,
    doMembershipBuy,
    doTipAccountCheckForUri,
    doGetCustomerStatus,
  } = props;

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [membershipIndex, setMembershipIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('Tier 1');

  // if a membership can't be purchased from the creator
  // const shouldDisableSelector = !canReceiveFiatTips || !hasSavedCard;
  const shouldDisableSelector = channelName !== '@test35234';

  function handleJoinMembership() {
    if (!isOnConfirmationPage) {
      setConfirmationPage(true);
    } else {
      doMembershipBuy(testChannel, closeModal);
    }
  }

  React.useEffect(() => {
    if (hasSavedCard === undefined) {
      doGetCustomerStatus();
    }
  }, [doGetCustomerStatus, hasSavedCard]);

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  const tabButtonProps = { isOnConfirmationPage, activeTab, setActiveTab, setMembershipIndex };

  return (
    <Form>
      <Card
        title={__('Join Creator Membership')}
        className="membership-join"
        subtitle={
          isOnConfirmationPage ? (
            <ConfirmationPage
              channelName={channelName}
              membershipTier={membershipTiers[membershipIndex]}
              fetchStarted={fetchStarted}
              handleJoinMembership={handleJoinMembership}
              onCancel={() => setConfirmationPage(false)}
            />
          ) : (
            <PreviewPage
              membershipTier={membershipTiers[membershipIndex]}
              handleJoinMembership={handleJoinMembership}
              isModal={isModal}
              shouldDisableSelector={shouldDisableSelector}
              hasSavedCard={hasSavedCard}
              activeTab={activeTab}
              tabButtonProps={tabButtonProps}
            />
          )
        }
      />
    </Form>
  );
}
