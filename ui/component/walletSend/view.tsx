import * as MODALS from 'constants/modal_types';
import React from 'react';
import Button from 'component/button';
import { Form, FormField } from 'component/common/form';
import validateSendTx from 'util/form-validation';
import Card from 'component/common/card';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import classnames from 'classnames';
import ChannelSelector from 'component/channelSelector';
import ClaimPreview from 'component/claimPreview';
type Props = {
  openModal: (
    id: string,
    arg1: {
      destination: string;
      amount: string;
      isAddress: boolean;
    }
  ) => void;
  draftTransaction: {
    address: string;
    amount: string;
  };
  setDraftTransaction: (arg0: { address: string; amount: string }) => void;
  balance: number;
  isAddress: boolean;
  setIsAddress: (arg0: boolean) => void;
  contentUri: string;
  contentError: string;
  contentClaim?: StreamClaim;
  setEnteredContentUri: (arg0: string) => void;
  confirmed: boolean;
  setConfirmed: (arg0: boolean) => void;
  sendLabel: string;
  setSendLabel: (arg0: string) => void;
  snack:
    | {
        linkTarget: string | null | undefined;
        linkText: string | null | undefined;
        message: string;
        isError: boolean;
      }
    | null
    | undefined;
};

type State = {
  touched: {
    address: boolean;
    amount: boolean;
  };
};

class WalletSend extends React.PureComponent<Props, State> {
  constructor() {
    super();
    (this as any).handleSubmit = this.handleSubmit.bind(this);
    (this as any).handleClear = this.handleClear.bind(this);
    this.state = {
      touched: {
        address: false,
        amount: false,
      },
    };
  }

  handleSubmit() {
    const { draftTransaction, openModal, isAddress, contentUri, setConfirmed } = this.props;
    const destination = isAddress ? draftTransaction.address : contentUri;
    const amount = draftTransaction.amount;
    const modalProps = {
      destination,
      amount,
      isAddress,
      setConfirmed,
    };
    openModal(MODALS.CONFIRM_TRANSACTION, modalProps);
  }

  handleClear() {
    const { setDraftTransaction, setConfirmed } = this.props;
    setDraftTransaction({
      address: '',
      amount: '',
    });
    setConfirmed(false);
  }

  componentDidUpdate(prevProps: Props) {
    const { confirmed, snack, setSendLabel } = this.props;

    if (!prevProps.confirmed && confirmed) {
      this.handleClear();
      setSendLabel('Sending...');
    }

    if (!prevProps.snack && snack) {
      setSendLabel('Send');
    }
  }

  handleBlur(field: keyof State['touched']) {
    this.setState((prevState) => ({
      touched: {
        ...prevState.touched,
        [field]: true,
      },
    }));
  }

  render() {
    const {
      draftTransaction,
      setDraftTransaction,
      balance,
      isAddress,
      setIsAddress,
      contentUri,
      contentClaim,
      setEnteredContentUri,
      contentError,
      sendLabel,
    } = this.props;
    const { touched } = this.state;
    const validationErrors = isAddress ? validateSendTx(draftTransaction.address) : { address: '' };
    const amountValue = parseFloat(draftTransaction.amount);
    const amountError =
      amountValue === balance
        ? __('Decrease amount to account for transaction fee')
        : amountValue > balance
          ? __('Not enough Credits')
          : '';
    const formError =
      (Boolean(draftTransaction.address) && touched.address && validationErrors.address) ||
      (Boolean(draftTransaction.amount) && touched.amount && amountError) ||
      '';

    return (
      <Card
        title={__('Send Credits')}
        subtitle={__('Send Credits to your friends or favorite creators.')}
        actions={
          <div>
            <div className="section">
              <Button
                key="Address"
                label={__('Address')}
                button="alt"
                onClick={() => setIsAddress(true)}
                className={classnames('button-toggle', {
                  'button-toggle--active': isAddress,
                })}
              />
              <Button
                key="Search"
                label={__('Search')}
                button="alt"
                onClick={() => setIsAddress(false)}
                className={classnames('button-toggle', {
                  'button-toggle--active': !isAddress,
                })}
              />
            </div>

            <div className="section">
              {!isAddress && <ChannelSelector />}

              <Form onSubmit={this.handleSubmit}>
                {!isAddress && (
                  <FormField
                    type="text"
                    name="search"
                    error={contentError}
                    placeholder={__('Enter a name, @username or URL')}
                    className="form-field--address"
                    label={__('Recipient search')}
                    onChange={(event) => setEnteredContentUri(event.target.value)}
                    value={contentUri}
                  />
                )}

                {!isAddress && (
                  <fieldset-section>
                    <ClaimPreview
                      key={contentUri}
                      uri={contentUri}
                      actions={''}
                      type={'small'}
                      showNullPlaceholder
                      hideMenu
                      hideRepostLabel
                      nonClickable
                    />
                  </fieldset-section>
                )}

                <fieldset-group class="fieldset-group--smushed">
                  <FormField
                    autoFocus
                    type="number"
                    name="amount"
                    label={__('Amount')}
                    className="form-field--price-amount"
                    affixClass="form-field--fix-no-height"
                    min="0"
                    step="any"
                    placeholder="12.34"
                    onChange={(event) =>
                      setDraftTransaction({
                        address: draftTransaction.address,
                        amount: event.target.value,
                      })
                    }
                    onBlur={() => this.handleBlur('amount')}
                    value={draftTransaction.amount}
                  />
                  {isAddress && (
                    <FormField
                      type="text"
                      name="address"
                      placeholder={'bbFxRyXXXXXXXXXXXZD8nE7XTLUxYnddTs'}
                      className="form-field--address"
                      label={__('Recipient address')}
                      onChange={(event) =>
                        setDraftTransaction({
                          address: event.target.value,
                          amount: draftTransaction.amount,
                        })
                      }
                      onBlur={() => this.handleBlur('address')}
                      value={draftTransaction.address}
                    />
                  )}
                </fieldset-group>

                <div className="card__actions">
                  <Button
                    button="primary"
                    type="submit"
                    label={__(sendLabel)}
                    disabled={
                      !(amountValue > 0.0) ||
                      amountValue >= balance ||
                      sendLabel === 'Sending...' ||
                      (isAddress ? !draftTransaction.address || validationErrors.address !== '' : !contentClaim)
                    }
                  />
                  {formError && <span className="error__text">{formError}</span>}
                </div>
                <WalletSpendableBalanceHelp />
              </Form>
            </div>
          </div>
        }
      />
    );
  }
}

export default WalletSend;
