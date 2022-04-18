// @flow
import { Form } from 'component/common/form';
import Card from 'component/common/card';
import React from 'react';
import ConfirmationPage from './confirmationPage';
import PreviewPage from './previewPage';

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
  closeModal?: () => void,
  isChannelTab: boolean,
};

export default function JoinMembershipCard(props: Props) {
  const { uri, closeModal, isChannelTab } = props;

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [membershipIndex, setMembershipIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('Tier 1');

  const tabButtonProps = { setMembershipIndex, activeTab, setActiveTab };

  return (
    <Form>
      <Card
        title={isChannelTab ? __('Join Membership') : __('Join Creator Membership')}
        className={isChannelTab ? 'membership-join-tab' : 'membership-join'}
        subtitle={!isOnConfirmationPage && __("Join this creator's channel for access to exclusive content and perks")}
        body={
          isOnConfirmationPage ? (
            <ConfirmationPage
              uri={uri}
              selectedTier={membershipTiers[membershipIndex]}
              onCancel={() => setConfirmationPage(false)}
              closeModal={closeModal}
            />
          ) : (
            <PreviewPage
              uri={uri}
              selectedTier={membershipTiers[membershipIndex]}
              handleConfirm={() => setConfirmationPage(true)}
              tabButtonProps={tabButtonProps}
            />
          )
        }
      />
    </Form>
  );
}
