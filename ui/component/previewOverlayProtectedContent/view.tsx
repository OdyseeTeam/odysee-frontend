import * as ICONS from 'constants/icons';
import * as React from 'react';
import Icon from 'component/common/icon';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { getChannelFromClaim } from 'util/claim';
import { selectClaimForUri, selectClaimIsMine, selectProtectedContentTagForUri } from 'redux/selectors/claims';
import {
  selectUserIsMemberOfProtectedContentForId,
  selectPriceOfCheapestPlanForClaimId,
  selectProtectedContentMembershipsForContentClaimId,
} from 'redux/selectors/memberships';
import { doMembershipList } from 'redux/actions/memberships';
type Props = {
  uri: string;
};

const PreviewOverlayProtectedContent = (props: Props) => {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim && claim.claim_id;
  const channel = getChannelFromClaim(claim);
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const protectedMembershipIds = useAppSelector(
    (state) => claimId && selectProtectedContentMembershipsForContentClaimId(state, claimId)
  );
  const userIsAMember = useAppSelector((state) => selectUserIsMemberOfProtectedContentForId(state, claimId));
  const cheapestPlanPrice = useAppSelector((state) => selectPriceOfCheapestPlanForClaimId(state, claimId));
  const hasProtectedContentTag = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  React.useEffect(() => {
    if (channel && protectedMembershipIds && cheapestPlanPrice === undefined) {
      dispatch(
        doMembershipList({
          channel_claim_id: channel.claim_id,
        })
      );
    }
  }, [channel, cheapestPlanPrice, dispatch, protectedMembershipIds]);

  if (userIsAMember || (protectedMembershipIds && claimIsMine)) {
    return (
      <div className="protected-content__wrapper--unlocked">
        <Icon icon={ICONS.UNLOCK} size={64} />
      </div>
    );
  }

  if (hasProtectedContentTag) {
    return (
      <div className="protected-content__wrapper">
        <div className="protected-content__lock">
          <Icon icon={ICONS.LOCK} />
        </div>
        {userIsAMember !== undefined && protectedMembershipIds && cheapestPlanPrice && (
          <div className="protected-content__label-wrapper">
            <div className="protected-content__label-container">
              <div className="protected-content__label">
                {__('Members Only')}
                <span>
                  {__('Join for $%membership_price% per month', {
                    membership_price: cheapestPlanPrice,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PreviewOverlayProtectedContent;
