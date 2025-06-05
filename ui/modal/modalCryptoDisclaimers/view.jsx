// @flow
import React from 'react';
import * as SETTINGS from 'constants/settings';
import Button from 'component/button';
import { FormField } from 'component/common/form-components/form-field';
import { Modal } from 'modal/modal';
import './style.scss';

type Props = {
  clientSettings: any,
  doHideModal: () => void,
  doSetClientSetting: (string, boolean, ?boolean) => void,
};

export default function ModalCryptoDisclaimers(props: Props) {
  const {
    clientSettings,
    doHideModal,
    doSetClientSetting,
  } = props;

  const showDisclaimersLS = clientSettings[SETTINGS.CRYPTO_DISCLAIMERS];
  const [showDisclaimers, setShowDisclaimers] = React.useState(showDisclaimersLS);

  const handleShowDisclaimers = () => {
    doSetClientSetting(SETTINGS.CRYPTO_DISCLAIMERS, !showDisclaimers);
    setShowDisclaimers(!showDisclaimers)
  }

  const handleSignIn = () => {
    window.wanderInstance.open();
    doHideModal();
  }

  return (
    <Modal className="cryptoDisclaimersModal" type="card" isOpen onAborted={doHideModal}>
      <h2>Disclaimers & Important Information</h2>
      <ul>
        <li>
          <b>Cryptocurrency Risk Notice</b>
          <p>Purchasing, holding, and transacting in cryptocurrencies involves significant risk. Prices are highly volatile and may fluctuate widely in a short period of time. You could lose some or all of your investment.</p>
        </li>
        <li>
          <b>Third-Party Payment Processing</b>
          <p>All purchases made via card payment are processed by third-party providers. By proceeding, you acknowledge that you are subject to their terms of service and privacy policies. We do not control or assume responsibility for the actions of third-party processors.</p>
        </li>
        <li>
          <b>No Investment Advice</b>
          <p>The information provided on this site does not constitute financial, investment, or trading advice. We do not make recommendations or endorsements regarding any cryptocurrency. Please consult a licensed financial advisor before making any investment decisions.</p>
        </li>
        <li>
          <b>Transaction Finality</b>
          <p>All crypto transactions are irreversible. Please verify the amount and recipient details before confirming your purchase. We are not responsible for user errors or mistyped wallet addresses.</p>
        </li>
        <li>
          <b>Availability & Jurisdiction</b>
          <p>Services may not be available in all regions and are subject to local laws and regulations. It is your responsibility to ensure that you are compliant with your local jurisdiction before buying or using cryptocurrency.</p>
        </li>
        <li>
          <b>KYC/AML Requirements</b>
          <p>In some cases, identity verification may be required by the payment provider in accordance with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations.</p>
        </li>
        <li>
          <b>Tax Responsibilities</b>
          <p>You are solely responsible for complying with your local tax regulations regarding crypto purchases and reporting. Please consult a tax professional for advice related to your jurisdiction.</p>
        </li>
        <li>
          <b>System Availability</b>
          <p>Prices shown are estimates and may change at the time of execution. Platform access and pricing may be impacted by third-party service outages or blockchain congestion.</p>
        </li>
      </ul>

      <FormField
        type="checkbox"
        name="show_crypto_disclaimers"
        label={__('Don’t show me this message again')}
        checked={!showDisclaimers}
        onChange={handleShowDisclaimers}
      />

      <Button
        button="primary"
        label={__('Sign in')}
        onClick={handleSignIn}
      />

    </Modal>
  );
}
