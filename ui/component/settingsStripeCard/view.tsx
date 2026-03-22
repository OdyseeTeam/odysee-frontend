import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import './style.scss';

type Props = {
  isModal?: boolean;
  setIsBusy?: (isBusy: boolean) => void;
};

export default function SettingsStripeCard(props: Props) {
  const { isModal, setIsBusy } = props;

  React.useEffect(() => {
    if (setIsBusy) {
      setIsBusy(false);
    }
  }, [setIsBusy]);

  return (
    <Card
      className="add-payment-card"
      title={isModal ? undefined : __('Payment methods retired')}
      body={
        <div className="card__body-actions">
          <h3>{__('Credit-card payment methods have been retired on this app.')}</h3>
          <p>
            {__(
              'Legacy Stripe-based card management is no longer available. Use wallet and Arweave account flows instead.'
            )}
          </p>
        </div>
      }
      actions={
        <div className="section__actions">
          <Button button="secondary" icon={ICONS.WALLET} label={__('Open Wallet')} navigate={`/$/${PAGES.WALLET}`} />
          <Button
            button="primary"
            icon={ICONS.AR}
            label={__('Open Arweave Account')}
            navigate={`/$/${PAGES.ARACCOUNT}`}
          />
        </div>
      }
    />
  );
}
