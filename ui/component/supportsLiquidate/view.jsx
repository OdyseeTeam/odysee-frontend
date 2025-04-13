// @flow
import * as ICONS from 'constants/icons';
import React, { useEffect, useState } from 'react';
import CreditAmount from 'component/common/credit-amount';
import Button from 'component/button';
import { Form, FormField } from 'component/common/form';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import ErrorText from 'component/common/error-text';

type Props = {
  balance: number,
  totalBalance: number,
  claimsBalance: number,
  supportsBalance: number,
  tipsBalance: number,
  claim: any,
  handleClose: () => void,
  abandonSupportForClaim: (string, string, boolean | string, boolean) => any,
  abandonClaimError: ?string,
};

const SupportsLiquidate = (props: Props) => {
  const defaultAmountPercent = 25;
  const { claim, abandonSupportForClaim, handleClose, abandonClaimError } = props;
  const [previewBalance, setPreviewBalance] = useState(-1);
  const [amount, setAmount] = useState(-1);
  const [sliderPosition, setSliderPosition] = useState(defaultAmountPercent);
  const [error, setError] = useState(false);
  const initialMessage = __('How much would you like to unlock?');
  const [message, setMessage] = useState(initialMessage);
  const keep =
    Number(amount) >= 0
      ? Boolean(previewBalance) && Number.parseFloat(String(Number(previewBalance) - Number(amount))).toFixed(8)
      : Boolean(previewBalance) && Number.parseFloat(String((Number(previewBalance) / 4) * 3)).toFixed(8); // default unlock 25%
  const claimId = claim && claim.claim_id;
  const type = claim.value_type;

  useEffect(() => {
    if (claimId && abandonSupportForClaim) {
      abandonSupportForClaim(claimId, type, false, true).then((r) => {
        setPreviewBalance(r.total_input);
      });
    }
  }, [abandonSupportForClaim, claimId, type, setPreviewBalance]);

  function handleSubmit() {
    abandonSupportForClaim(claimId, type, keep, false).then((r) => {
      if (r) {
        handleClose();
      }
    });
  }

  function handleChange(a, isFromSlider) {
    if (!isNaN(Number(a))) setSliderPosition((Number(a) / previewBalance) * 100);
    setAmount((isFromSlider && !isNaN(Number(a)) && Number(a).toFixed(2)) || a);

    if (a === undefined || isNaN(Number(a))) {
      setMessage(__('Amount must be a number'));
      setError(true);
    } else if (a === '') {
      setError(true);
      setMessage(__('Amount cannot be blank'));
    } else if (Number(a) > Number(previewBalance)) {
      setMessage(__('Amount cannot be more than available'));
      setError(true);
    } else if (Number(a) === Number(previewBalance)) {
      setMessage(__(`She's about to close up the library!`));
      setError(false);
    } else if (Number(a) > Number(previewBalance) / 2) {
      setMessage(__('Your content will do better with more staked on it'));
      setError(false);
    } else if (Number(a) === 0) {
      setMessage(__('Amount cannot be zero'));
      setError(true);
    } else if (Number(a) <= Number(previewBalance) / 2) {
      setMessage(__('A prudent choice'));
      setError(false);
    } else {
      setMessage(initialMessage);
      setError(false);
    }
  }

  React.useEffect(() => {
    if (previewBalance) handleChange(previewBalance * (defaultAmountPercent / 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBalance]); //

  return (
    <Card
      icon={ICONS.UNLOCK}
      title={__('Unlock tips')}
      subtitle={
        <>
          <p>
            {__('You can unlock all or some of these LBRY Credits at any time.')}{' '}
            {__('Keeping it locked improves the trust and discoverability of your content.')}
          </p>
          <p>
            <I18nMessage
              tokens={{
                learn_more: (
                  <Button
                    button="link"
                    label={__('Learn More')}
                    href="https://help.odysee.tv/category-blockchain/category-staking/increase/"
                  />
                ),
              }}
            >
              It's usually only worth unlocking what you intend to use immediately. %learn_more%
            </I18nMessage>
          </p>
        </>
      }
      actions={
        <React.Fragment>
          {abandonClaimError ? (
            <div className="error__wrapper--no-overflow">
              <ErrorText>{abandonClaimError}</ErrorText>
            </div>
          ) : (
            <>
              <div className="section">
                <I18nMessage
                  tokens={{
                    amount: (
                      <strong>
                        <CreditAmount amount={Number(previewBalance)} precision={8} />
                      </strong>
                    ),
                  }}
                >
                  %amount% available to unlock
                </I18nMessage>
              </div>
              <div className="section">
                {previewBalance === 0 && <p>{__('No unlockable tips available')}</p>}
                {previewBalance === undefined && <p>{__('Loading...')}</p>}
                {previewBalance && (
                  <Form onSubmit={handleSubmit}>
                    <label htmlFor="supports_liquidate_range">{__('Amount to unlock')}</label>
                    <FormField
                      name="supports_liquidate_range"
                      type={'range'}
                      value={sliderPosition}
                      onChange={(e) => handleChange((e.target.value / 100) * previewBalance, true)}
                    />
                    <label className="range__label">
                      <span>0</span>
                      <span>{previewBalance / 2}</span>
                      <span>{previewBalance}</span>
                    </label>
                    <FormField
                      type="text"
                      value={amount || ''}
                      helper={message}
                      onChange={(e) => handleChange(e.target.value, false)}
                    />
                  </Form>
                )}
              </div>
            </>
          )}
          <div className="section__actions">
            <Button
              disabled={error}
              button="primary"
              onClick={abandonClaimError ? handleClose : handleSubmit}
              label={abandonClaimError ? __('Done') : __('Unlock')}
            />
          </div>
        </React.Fragment>
      }
    />
  );
};

export default SupportsLiquidate;
