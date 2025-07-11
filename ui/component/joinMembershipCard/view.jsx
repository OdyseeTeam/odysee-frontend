// @flow
import React from 'react';

// $FlowFixMe
import { Global } from '@emotion/react';

import { Form } from 'component/common/form';
import { useHistory } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import Card from 'component/common/card';
import ConfirmationPage from './internal/confirmationPage';
import PreviewPage from './internal/previewPage';
import Spinner from 'component/spinner';
import classnames from 'classnames';
import { ModalContext } from 'contexts/modal';
import './style.scss';

type Props = {
  uri: string,
  doHideModal: () => void,
  membershipIndex: number,
  passedTierIndex?: number,
  shouldNavigate?: boolean,
  membersOnly?: boolean,
  // -- redux --
  activeChannelClaim: ChannelClaim,
  channelName: ?string,
  channelClaimId: ?string,
  creatorMemberships: ?CreatorMemberships,
  incognito: boolean,
  unlockableTierIds: Array<number>,
  cheapestMembership: ?CreatorMembership,
  isLivestream: ?boolean,
  purchasedChannelMembership: MembershipSub,
  membershipMine: any,
  doMembershipList: (params: MembershipListParams) => Promise<CreatorMemberships>,
  doMembershipBuy: (membershipParams: MembershipBuyParams) => Promise<Membership>,
  doToast: (params: { message: string }) => void,
  isChannelTab?: boolean,
  isRenewal?: boolean,
};

const JoinMembershipCard = (props: Props) => {
  const {
    uri,
    doHideModal,
    membershipIndex = 0,
    passedTierIndex,
    shouldNavigate,
    membersOnly,
    // -- redux --
    activeChannelClaim,
    channelName,
    channelClaimId,
    creatorMemberships,
    incognito,
    unlockableTierIds,
    cheapestMembership,
    isLivestream,
    purchasedChannelMembership,
    membershipMine,
    doMembershipList,
    doMembershipBuy,
    doToast,
    isChannelTab,
    isRenewal,
  } = props;

  const isUrlParamModal = React.useContext(ModalContext)?.isUrlParamModal;

  const isPurchasing = React.useRef(false);

  const { push } = useHistory();

  const skipToConfirmation = Number.isInteger(passedTierIndex);

  const cheapestPlanIndex = React.useMemo(() => {
    if (cheapestMembership) {
      return (
        creatorMemberships &&
        creatorMemberships.findIndex((membership) => membership.membership_id === cheapestMembership.membership_id)
      );
    }
  }, [cheapestMembership, creatorMemberships]);

  const [isOnConfirmationPage, setConfirmationPage] = React.useState(skipToConfirmation);
  const [selectedMembershipIndex, setMembershipIndex] = React.useState(
    passedTierIndex || cheapestPlanIndex || membershipIndex
  );
  const selectedCreatorMembership: CreatorMembership = creatorMemberships && creatorMemberships[selectedMembershipIndex];

  function handleJoinMembership() {
    if (!selectedCreatorMembership || isPurchasing.current) return; // TODO handle error
    isPurchasing.current = true;

    const membershipBuyParams: MembershipBuyParams = {
      tippedChannelId: channelClaimId,
      priceId: selectedCreatorMembership.prices[0].id,
      membershipId: selectedCreatorMembership.membership_id,
    };

    if (activeChannelClaim && !incognito) {
      Object.assign(membershipBuyParams, {
        subscriberChannelId: activeChannelClaim.claim_id,
      });
    }

    doMembershipBuy(membershipBuyParams)
      .then(() => {
        isPurchasing.current = false;
        doMembershipList({ channel_claim_id: channelClaimId });

        if (doHideModal) {
          doHideModal();
        } else {
          window.pendingMembership = true;
          setConfirmationPage(false);
        }

        doToast({
          message: __(
            "You are now a '%membership_tier_name%' member for %creator_channel_name%, enjoy the perks and special features!",
            {
              membership_tier_name: selectedCreatorMembership.name,
              creator_channel_name: selectedCreatorMembership.channel_name,
            }
          ),
        });

        const purchasingUnlockableContentTier = unlockableTierIds && unlockableTierIds.includes(selectedCreatorMembership.membership_id);

        if (shouldNavigate && purchasingUnlockableContentTier) {
          push(formatLbryUrlForWeb(uri));
        }
      })
      .catch((e) => {
        doToast({
          message: __(
            e?.message || e
          ),
          isError: true,
        });
        isPurchasing.current = false;
      });
  }

  React.useEffect(() => {
    if (channelClaimId && channelName && !creatorMemberships) {
      doMembershipList({ channel_claim_id: channelClaimId });
    }
  }, [channelClaimId, channelName, creatorMemberships, doMembershipList]);

  const pageProps = React.useMemo(() => {
    return { uri, selectedCreatorMembership, selectedMembershipIndex, isRenewal };
  }, [selectedMembershipIndex, selectedCreatorMembership, uri, isRenewal]);

  React.useEffect(() => {
    if (isUrlParamModal && purchasedChannelMembership) {
      // -- close url param modal when already has membership --
      doHideModal();
    }
  }, [doHideModal, isUrlParamModal, membershipMine, purchasedChannelMembership]);

  if (
    isUrlParamModal &&
    (membershipMine === undefined || creatorMemberships === undefined || purchasedChannelMembership)
  ) {
    // -- hide modal until a pendingPurchase condition is found to show it --
    return <Global styles={{ '.ReactModalPortal': { display: 'none' } }} />;
  }

  if (window.pendingMembership || creatorMemberships === undefined) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <Form onSubmit={handleJoinMembership}>
      <Card
        className={classnames('card--join-membership', {
          'membership-tier1': selectedMembershipIndex === 0,
          'membership-tier2': selectedMembershipIndex === 1,
          'membership-tier3': selectedMembershipIndex === 2,
          'membership-tier4': selectedMembershipIndex === 3,
          'membership-tier5': selectedMembershipIndex === 4,
          'membership-tier6': selectedMembershipIndex === 5,
        })}
        body={
          <>
            {isOnConfirmationPage && creatorMemberships.length ? (
              <ConfirmationPage {...pageProps} onCancel={isChannelTab ? doHideModal : () => setConfirmationPage(false)} />
            ) : (
              <PreviewPage
                {...pageProps}
                handleSelect={() => setConfirmationPage(true)}
                setMembershipIndex={setMembershipIndex}
                unlockableTierIds={unlockableTierIds}
                membersOnly={membersOnly}
                isLivestream={isLivestream}
              />
            )}
          </>
        }
      />
    </Form>
  );
};

export default JoinMembershipCard;
