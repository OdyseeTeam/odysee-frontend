import React, { useState, useEffect } from 'react';
import { Form, FormField, Submit } from 'component/common/form';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import { setSavedPassword } from 'util/saved-passwords';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectWalletEncryptSucceeded } from 'redux/selectors/wallet';
import { doHideModal } from 'redux/actions/app';
import { doWalletEncrypt, doWalletStatus } from 'redux/actions/wallet';

const acknowledgementText = __('I Understand');

function ModalWalletEncrypt() {
  const dispatch = useAppDispatch();
  const walletEncryptSucceded = useAppSelector(selectWalletEncryptSucceeded);

  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [understandConfirmed, setUnderstandConfirmed] = useState(false);
  const [understandError, setUnderstandError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [failMessage, setFailMessage] = useState<string | undefined>(undefined);
  const [rememberPassword, setRememberPassword] = useState(false);

  const closeModal = () => dispatch(doHideModal());

  useEffect(() => {
    if (submitted) {
      if (walletEncryptSucceded) {
        closeModal();
        dispatch(doWalletStatus());
      } else if (!walletEncryptSucceded) {
        // See https://github.com/lbryio/lbry/issues/1307
        setFailMessage('Unable to encrypt wallet.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, walletEncryptSucceded]);

  function onChangeNewPassword(event: React.SyntheticEvent) {
    setNewPassword((event.target as HTMLInputElement).value);
  }

  function onChangeRememberPassword(event: React.SyntheticEvent) {
    setRememberPassword((event.target as HTMLInputElement).checked);
  }

  function onChangeNewPasswordConfirm(event: React.SyntheticEvent) {
    setNewPasswordConfirm((event.target as HTMLInputElement).value);
  }

  function onChangeUnderstandConfirm(event: React.SyntheticEvent) {
    const regex = new RegExp('^.?' + acknowledgementText + '.?$', 'i');
    setUnderstandConfirmed(regex.test((event.target as HTMLInputElement).value));
  }

  function submitEncryptForm() {
    if (!newPassword) {
      return;
    }

    let invalidEntries = false;

    if (newPassword !== newPasswordConfirm) {
      setPasswordMismatch(true);
      invalidEntries = true;
    }

    if (!understandConfirmed) {
      setUnderstandError(true);
      invalidEntries = true;
    }

    if (invalidEntries) {
      return;
    }

    setSavedPassword(newPassword, rememberPassword);
    setSubmitted(true);
    dispatch(doWalletEncrypt(newPassword));
  }

  return (
    <Modal
      isOpen
      title={__('Encrypt wallet')}
      contentLabel={__('Encrypt wallet')}
      type="custom"
      onConfirmed={() => submitEncryptForm()}
      onAborted={closeModal}
    >
      <Form onSubmit={() => submitEncryptForm()}>
        <p>
          {__(
            'Encrypting your wallet will require a password to access your local wallet data when LBRY starts. Please enter a new password for your wallet.'
          )}{' '}
          <Button button="link" label={__('Learn more')} href="https://lbry.com/faq/wallet-encryption" />.
        </p>
        <fieldset-section>
          <FormField
            autoFocus
            error={passwordMismatch ? 'Passwords do not match' : false}
            label={__('Password')}
            placeholder={__('Shh...')}
            type="password"
            name="wallet-new-password"
            onChange={(event) => onChangeNewPassword(event)}
          />
        </fieldset-section>
        <fieldset-section>
          <FormField
            error={passwordMismatch ? 'Passwords do not match' : false}
            label={__('Confirm Password')}
            placeholder={__('Your eyes only')}
            type="password"
            name="wallet-new-password-confirm"
            onChange={(event) => onChangeNewPasswordConfirm(event)}
          />
        </fieldset-section>
        <fieldset-section>
          <FormField
            label={__('Remember Password')}
            type="checkbox"
            name="wallet-remember-password"
            onChange={(event) => onChangeRememberPassword(event)}
            checked={rememberPassword}
          />
        </fieldset-section>

        <div className="help--warning">
          {__(
            'If your password is lost, it cannot be recovered. You will not be able to access your wallet without a password.'
          )}
        </div>
        <FormField
          inputButton={<Submit label={failMessage ? __('Encrypting Wallet') : __('Encrypt wallet')} />}
          error={
            understandError
              ? __('You must enter "%acknowledgement_text%"', {
                  acknowledgement_text: acknowledgementText,
                })
              : false
          }
          label={__('Enter "%acknowledgement_text%"', {
            acknowledgement_text: acknowledgementText,
          })}
          placeholder={__('Type "%acknowledgement_text%"', {
            acknowledgement_text: acknowledgementText,
          })}
          type="text"
          name="wallet-understand"
          onChange={(event) => onChangeUnderstandConfirm(event)}
        />
        {failMessage && <div className="error__text">{__(failMessage)}</div>}
      </Form>
      <div className="card__actions">
        <Button button="link" label={__('Cancel')} onClick={closeModal} />
      </div>
    </Modal>
  );
}

export default ModalWalletEncrypt;
