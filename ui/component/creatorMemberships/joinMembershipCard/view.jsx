// @flow
import { Form } from 'component/common/form';
import Card from 'component/common/card';
import React from 'react';
import ConfirmationPage from './internal/confirmationPage';
import PreviewPage from './internal/previewPage';

type Props = {
  uri: string,
  isChannelTab: boolean,
  closeModal?: () => void,
  // -- redux --
  channelName: ?string,
  channelClaimId: ?string,
  creatorMemberships: any,
  doMembershipList: (params: MembershipListParams) => void,
};

function JoinMembershipCard(props: Props) {
  const { uri, isChannelTab, closeModal, creatorMemberships, channelName, channelClaimId, doMembershipList } = props;

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(false);
  const [membershipIndex, setMembershipIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('Tier 1');

  const [expandedTabs, setExpandedTabs] = React.useState({
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [seeAllTiers, setSeeAllTiers] = React.useState(false);

  React.useEffect(() => {
    if (channelClaimId && channelName && !creatorMemberships) {
      doMembershipList({ channel_name: channelName, channel_id: channelClaimId });
    }
  }, [channelClaimId, channelName, creatorMemberships, doMembershipList]);

  const tabButtonProps = { setMembershipIndex, activeTab, setActiveTab };
  const pageProps = { uri, selectedTier: creatorMemberships && creatorMemberships[membershipIndex] };

  return (
    <Form>
      <Card
        title={isChannelTab ? __('Join Membership') : __('Join Creator Membership')}
        className={isChannelTab ? 'membership-join-tab' : 'membership-join-card'}
        subtitle={!isOnConfirmationPage && __("Join this creator's channel for access to exclusive content and perks")}
        body={
          isOnConfirmationPage ? (
            <ConfirmationPage {...pageProps} onCancel={() => setConfirmationPage(false)} closeModal={closeModal} />
          ) : (
            <PreviewPage
              {...pageProps}
              handleConfirm={() => setConfirmationPage(true)}
              tabButtonProps={tabButtonProps}
              isChannelTab={isChannelTab}
              setMembershipIndex={setMembershipIndex}
              setExpandedTabs={setExpandedTabs}
              expandedTabs={expandedTabs}
              setSeeAllTiers={setSeeAllTiers}
              seeAllTiers={seeAllTiers}
            />
          )
        }
      />
    </Form>
  );
}

export default JoinMembershipCard;
