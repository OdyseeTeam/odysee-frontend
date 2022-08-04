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
    description: 'Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend! Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
  {
    displayName: 'Community MVP2',
    description: 'Where would this creator be without you? You are a true legend!',
    monthlyContributionInUSD: 20,
    perks: ['exclusiveAccess', 'earlyAccess', 'badge', 'emojis', 'custom-badge'],
  },
  {
    displayName: 'Community MVP3',
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

  let expandedTabsState = {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
  };

  const [expandedTabs, setExpandedTabs] = React.useState(expandedTabsState);
  const [seeAllTiers, setSeeAllTiers] = React.useState(false);
  const [creatorMemberships, setCreatorMemberships] = React.useState([]);

  return (
    <Form>
      <Card
        className={isChannelTab ? 'membership-join-tab' : 'membership-join-card'}
        body={
          isOnConfirmationPage ? (
            <ConfirmationPage
              uri={uri}
              selectedTier={creatorMemberships[membershipIndex]}
              onCancel={() => setConfirmationPage(false)}
              closeModal={closeModal}
            />
          ) : (
            <PreviewPage
              uri={uri}
              selectedTier={creatorMemberships[membershipIndex]}
              handleConfirm={() => setConfirmationPage(true)}
              tabButtonProps={tabButtonProps}
              isChannelTab={isChannelTab}
              setMembershipIndex={setMembershipIndex}
              setExpandedTabs={setExpandedTabs}
              expandedTabs={expandedTabs}
              setSeeAllTiers={setSeeAllTiers}
              seeAllTiers={seeAllTiers}
              setCreatorMemberships={setCreatorMemberships}
              creatorMemberships={creatorMemberships}
            />
          )
        }
      />
    </Form>
  );
}
