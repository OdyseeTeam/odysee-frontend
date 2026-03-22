import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useIsMobile } from 'effects/use-screensize';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';
import { makeSelectTagInClaimOrChannelForUri, selectClaimForUri } from 'redux/selectors/claims';
import { getChannelIdFromClaim } from 'util/claim';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectArweaveTipDataForId } from 'redux/selectors/stripe';
import { doTipAccountCheckForUri } from 'redux/actions/stripe';

const DISABLE_SUPPORT_TAG = 'disable-support';
const DISABLED_SUPPORT = process.env.DISABLED_SUPPORT_CHANNELS ? process.env.DISABLED_SUPPORT_CHANNELS.split(',') : [];

type Props = {
  uri: string;
  fileAction?: boolean;
  shrinkOnMobile?: boolean;
};

export default function ClaimSupportButton(props: Props) {
  const { uri, fileAction, shrinkOnMobile = false } = props;
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const isRepost = claim && claim.repost_url;
  const channelClaimId = claim && getChannelIdFromClaim(claim);

  const disableSupport = useAppSelector((state) => {
    const tagDisabled = makeSelectTagInClaimOrChannelForUri(uri, DISABLE_SUPPORT_TAG)(state);
    return tagDisabled || (channelClaimId && DISABLED_SUPPORT.includes(channelClaimId));
  });

  const preferredCurrency = useAppSelector(selectPreferredCurrency);
  const tipData = useAppSelector((state) => selectArweaveTipDataForId(state, channelClaimId));
  const canReceiveTips = tipData?.status === 'active' && tipData?.default;

  const isMobile = useIsMobile();

  React.useEffect(() => {
    dispatch(doTipAccountCheckForUri(uri));
  }, [canReceiveTips, dispatch, uri]);

  if (disableSupport) return null;

  const label =
    isMobile && shrinkOnMobile ? '' : isRepost ? __('Support Repost') : __('Support --[button to support a claim]--');
  const iconSizes = {
    [STRIPE.CURRENCIES.EUR]: 16,
    [STRIPE.CURRENCIES.USD]: fileAction ? 22 : undefined,
  };
  return (
    <FileActionButton
      className={canReceiveTips ? 'monetized-account__button' : undefined}
      title={__('Support this content')}
      label={label}
      icon={STRIPE.CURRENCY[preferredCurrency].icon}
      iconSize={iconSizes[preferredCurrency]}
      onClick={() =>
        dispatch(
          doOpenModal(MODALS.SEND_TIP, {
            uri,
            isSupport: true,
          })
        )
      }
      noStyle={!fileAction}
      requiresAuth
    />
  );
}
