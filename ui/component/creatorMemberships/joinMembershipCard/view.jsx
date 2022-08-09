// @flow
import { Form } from 'component/common/form';
import Card from 'component/common/card';
import React, { useEffect } from 'react';
import ConfirmationPage from './confirmationPage';
import PreviewPage from './previewPage';
import { Lbryio } from 'lbryinc';
import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

type Props = {
  uri: string,
  closeModal?: () => void,
  isChannelTab: boolean,
};

export default function JoinMembershipCard(props: Props) {
  const { uri, closeModal, isChannelTab, channelName, channelId } = props;

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

  async function getExistingTiers() {
    const response = await Lbryio.call(
      'membership',
      'list',
      {
        environment: stripeEnvironment,
        channel_name: channelName,
        channel_id: channelId,
      },
      'post'
    );

    console.log('response');
    console.log(response);

    if (response === null) {
      setCreatorMemberships([]);
    } else {
      setCreatorMemberships(response);
    }

    return response;
  }

  useEffect(() => {
    if (channelName && channelId) {
      getExistingTiers();
    }
  }, [channelName, channelId]);

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
              tabButtonProps={tabButtonProps}
              isChannelTab={isChannelTab}
              expandedTabs={expandedTabs}
              seeAllTiers={seeAllTiers}
              creatorMemberships={creatorMemberships}
              setCreatorMemberships={setCreatorMemberships}
              setMembershipIndex={setMembershipIndex}
              setExpandedTabs={setExpandedTabs}
              handleConfirm={() => setConfirmationPage(true)}
              setSeeAllTiers={setSeeAllTiers}
            />
          )
        }
      />
    </Form>
  );
}
