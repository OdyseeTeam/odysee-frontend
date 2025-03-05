// @flow
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import React from 'react';
import FileActionButton from 'component/common/file-action-button';
import { useIsMobile } from 'effects/use-screensize';

type Props = {
  uri: string,
  fileAction?: boolean,
  shrinkOnMobile?: boolean,
  // redux
  disableSupport: boolean,
  isRepost?: boolean,
  doOpenModal: (id: string, {}) => void,
  preferredCurrency: string,
  doTipAccountCheckForUri: (uri: string) => void,
  canReceiveFiatTips: ?boolean,
};

export default function ClaimSupportButton(props: Props) {
  const {
    uri,
    fileAction,
    shrinkOnMobile = false,
    isRepost,
    disableSupport,
    doOpenModal,
    preferredCurrency,
    canReceiveFiatTips,
    doTipAccountCheckForUri,
  } = props;
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  if (disableSupport) return null;

  const label =
    isMobile && shrinkOnMobile ? '' : isRepost ? __('Support Repost') : __('Support --[button to support a claim]--');

  const iconSizes = { [STRIPE.CURRENCIES.EUR]: 16, [STRIPE.CURRENCIES.USD]: fileAction ? 22 : undefined };

  return (
    <FileActionButton
      className={canReceiveFiatTips ? 'approved-bank-account__button' : undefined}
      title={__('Support this content')}
      label={label}
      icon={STRIPE.CURRENCY[preferredCurrency].icon}
      iconSize={iconSizes[preferredCurrency]}
      onClick={() => doOpenModal(MODALS.SEND_TIP, { uri, isSupport: true })}
      noStyle={!fileAction}
      requiresAuth
    />
  );
}
