import React from 'react';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { formatLbryUrlForWeb, getModalUrlParam } from 'util/url';
import { AppContext } from 'contexts/app';
import { EmbedContext } from 'contexts/embed';
import Icon from 'component/common/icon';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { getChannelTitleFromClaim } from 'util/claim';
import {
  selectClaimForUri,
  selectClaimIsMine,
  selectProtectedContentTagForUri,
  selectScheduledStateForUri,
} from 'redux/selectors/claims';
import {
  selectMyProtectedContentMembershipForId,
  selectUserIsMemberOfProtectedContentForId,
  selectPriceOfCheapestPlanForClaimId,
  selectCheapestProtectedContentMembershipForId,
} from 'redux/selectors/memberships';
import { doOpenModal as doOpenModalAction } from 'redux/actions/app';
type Props = {
  fileUri?: string;
  uri: string;
  passClickPropsToParent?: (props?: { href?: string; onClick?: () => void }) => void;
};

const ProtectedContentOverlay = (props: Props) => {
  const { uri, passClickPropsToParent } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim && claim.claim_id;
  const cheapestPlan = useAppSelector((state) => selectCheapestProtectedContentMembershipForId(state, claimId));
  const joinEnabled = cheapestPlan && cheapestPlan.prices.some((p: any) => p.address);
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const channelName = getChannelTitleFromClaim(claim);
  const isProtected = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));
  const userIsAMember = useAppSelector((state) => selectUserIsMemberOfProtectedContentForId(state, claimId));
  const myMembership = useAppSelector((state) => selectMyProtectedContentMembershipForId(state, claimId));
  const cheapestPlanPrice = useAppSelector((state) => selectPriceOfCheapestPlanForClaimId(state, claimId));
  const doOpenModal = (id: string, params: {}) => dispatch(doOpenModalAction(id, params));
  const appFileUri = React.useContext(AppContext)?.uri;
  const fileUri = props.fileUri || appFileUri;
  const isEmbed = React.useContext(EmbedContext);
  const membershipFetching = myMembership === undefined;
  const clickProps = React.useMemo(() => {
    if (!joinEnabled) return;
    return isEmbed
      ? {
          href: `${formatLbryUrlForWeb(uri)}?${getModalUrlParam(MODALS.JOIN_MEMBERSHIP, {
            uri,
            fileUri,
          })}`,
        }
      : {
          onClick: () =>
            doOpenModal(MODALS.JOIN_MEMBERSHIP, {
              uri,
              fileUri,
            }),
        };
  }, [doOpenModal, fileUri, isEmbed, uri, joinEnabled]);
  React.useEffect(() => {
    if (passClickPropsToParent) {
      passClickPropsToParent(clickProps);
    }
  }, [clickProps, passClickPropsToParent]);
  if (membershipFetching || !isProtected || userIsAMember || claimIsMine) return null;

  if (scheduledState === 'scheduled') {
    return null;
  }

  // know if membership is disabled.. no address..
  return (
    <div className="protected-content-overlay">
      <Icon icon={ICONS.LOCK} />
      {!joinEnabled && (
        <>
          <span>
            {__('Only @%channel_name% members can view this content.', {
              channel_name: channelName,
            })}
          </span>
          <span>{__('New members are not currently accepted.')}</span>
        </>
      )}
      {joinEnabled && (
        <>
          <span>
            {__('Only @%channel_name% members can view this content.', {
              channel_name: channelName,
            })}
          </span>
          <Button
            button="primary"
            icon={ICONS.MEMBERSHIP}
            label={
              cheapestPlanPrice
                ? __(
                    isEmbed
                      ? 'Join on Odysee now for $%membership_price% per month!'
                      : 'Join for $%membership_price% per month',
                    {
                      membership_price: cheapestPlanPrice,
                    }
                  )
                : __('Membership options')
            }
            title={__('Become a member')}
            {...clickProps}
          />
        </>
      )}
    </div>
  );
};

export default ProtectedContentOverlay;
