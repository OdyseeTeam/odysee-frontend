import React from 'react';
// @ts-expect-error
import { Global } from '@emotion/react';
import { Form } from 'component/common/form';
import { useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import Card from 'component/common/card';
import ConfirmationPage from './internal/confirmationPage';
import PreviewPage from './internal/previewPage';
import Spinner from 'component/spinner';
import classnames from 'classnames';
import { ModalContext } from 'contexts/modal';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectArEnabledMembershipTiersForChannelUri,
  selectProtectedContentMembershipsForContentClaimId,
  selectMembersOnlyChatMembershipIdsForCreatorId,
  selectCheapestPlanForRestrictedIds,
  selectNoRestrictionOrUserIsMemberForContentClaimId,
  selectMyPurchasedMembershipTierForCreatorUri,
  selectMembershipMineData,
} from 'redux/selectors/memberships';
import { selectAPIArweaveDefaultAddress } from 'redux/selectors/stripe';
import { selectChannelNameForUri, selectChannelClaimIdForUri, selectClaimForUri } from 'redux/selectors/claims';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import {
  selectLivestreamChatMembersOnlyForChannelId,
  selectMembersOnlyCommentsForChannelId,
} from 'redux/selectors/comments';
import { doMembershipList, doMembershipBuy, doMembershipBuyClear } from 'redux/actions/memberships';
import { doToast } from 'redux/actions/notifications';
import { getChannelIdFromClaim, isStreamPlaceholderClaim } from 'util/claim';
import './style.scss';

type Props = {
  uri: string;
  fileUri?: string;
  doHideModal: () => void;
  membershipIndex: number;
  passedTierIndex?: number;
  shouldNavigate?: boolean;
  membersOnly?: boolean;
  isChannelTab?: boolean;
  isRenewal?: boolean;
};

const JoinMembershipCard = (props: Props) => {
  const {
    uri,
    fileUri,
    doHideModal,
    membershipIndex = 0,
    passedTierIndex,
    shouldNavigate,
    membersOnly,
    isChannelTab,
    isRenewal,
  } = props;

  const dispatch = useAppDispatch();

  // -- redux selectors --
  const claim = useAppSelector((state) => selectClaimForUri(state, fileUri));
  const fileClaimId = claim && claim.claim_id;
  const channelId = getChannelIdFromClaim(claim);
  const isLivestream = isStreamPlaceholderClaim(claim);

  const isLiveMembersOnly = useAppSelector((state) =>
    channelId ? selectLivestreamChatMembersOnlyForChannelId(state, channelId) : false
  );
  const areCommentsMembersOnly = useAppSelector((state) =>
    channelId ? selectMembersOnlyCommentsForChannelId(state, channelId) : false
  );

  const contentUnlocked = useAppSelector((state) =>
    fileClaimId ? selectNoRestrictionOrUserIsMemberForContentClaimId(state, fileClaimId) : false
  );
  const membersOnlyDerived = contentUnlocked && (isLivestream ? isLiveMembersOnly : areCommentsMembersOnly);
  const unlockableTierIds = useAppSelector((state) => {
    if (membersOnlyDerived) {
      return channelId ? selectMembersOnlyChatMembershipIdsForCreatorId(state, channelId) : undefined;
    }
    return fileClaimId ? selectProtectedContentMembershipsForContentClaimId(state, fileClaimId) : undefined;
  });

  const channelClaimId = useAppSelector((state) => selectChannelClaimIdForUri(state, uri));
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const creatorMemberships = useAppSelector((state) => selectArEnabledMembershipTiersForChannelUri(state, uri));
  const defaultArweaveAddress = useAppSelector(selectAPIArweaveDefaultAddress);
  const channelName = useAppSelector((state) => selectChannelNameForUri(state, uri));
  const incognito = useAppSelector(selectIncognito);
  const cheapestMembership = useAppSelector((state) =>
    unlockableTierIds ? selectCheapestPlanForRestrictedIds(state, unlockableTierIds) : undefined
  );
  const purchasedChannelMembership = useAppSelector((state) =>
    selectMyPurchasedMembershipTierForCreatorUri(state, channelClaimId)
  );
  const membershipMine = useAppSelector(selectMembershipMineData);

  const isUrlParamModal = React.useContext(ModalContext)?.isUrlParamModal;
  const isPurchasing = React.useRef(false);
  const navigate = useNavigate();
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
  const selectedCreatorMembership: CreatorMembership | null | undefined =
    creatorMemberships && creatorMemberships[selectedMembershipIndex];

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

    dispatch(doMembershipBuy(membershipBuyParams))
      .then(() => {
        isPurchasing.current = false;
        dispatch(
          doMembershipList({
            channel_claim_id: channelClaimId,
          })
        );

        if (doHideModal) {
          doHideModal();
        } else {
          window.pendingMembership = true;
          setConfirmationPage(false);
        }

        dispatch(
          doToast({
            message: __(
              "You are now a '%membership_tier_name%' member for %creator_channel_name%, enjoy the perks and special features!",
              {
                membership_tier_name: selectedCreatorMembership.name,
                creator_channel_name: selectedCreatorMembership.channel_name,
              }
            ),
          })
        );
        const purchasingUnlockableContentTier =
          unlockableTierIds && unlockableTierIds.includes(selectedCreatorMembership.membership_id);

        if (shouldNavigate && purchasingUnlockableContentTier) {
          navigate(formatLbryUrlForWeb(uri));
        }
      })
      .catch((e) => {
        dispatch(
          doToast({
            message: __(e?.message || e),
            isError: true,
          })
        );
        isPurchasing.current = false;
      });
  }

  React.useEffect(() => {
    if (channelClaimId && channelName && !creatorMemberships) {
      dispatch(
        doMembershipList({
          channel_claim_id: channelClaimId,
        })
      );
    }
  }, [channelClaimId, channelName, creatorMemberships, dispatch]);
  const pageProps = React.useMemo(() => {
    return {
      uri,
      selectedCreatorMembership,
      selectedMembershipIndex,
      isRenewal,
    };
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
    return (
      <Global
        styles={{
          '.ReactModalPortal': {
            display: 'none',
          },
        }}
      />
    );
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
            {isOnConfirmationPage && creatorMemberships?.length ? (
              <ConfirmationPage
                {...pageProps}
                onCancel={isChannelTab ? doHideModal : () => setConfirmationPage(false)}
              />
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
