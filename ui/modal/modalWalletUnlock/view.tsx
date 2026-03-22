import React, { useState, useEffect } from 'react';
import { Form, FormField } from 'component/common/form';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import { getSavedPassword, setSavedPassword } from 'util/saved-passwords';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectWalletUnlockSucceeded } from 'redux/selectors/wallet';
import { doHideModal } from 'redux/actions/app';
import { doQuit } from 'redux/actions/app';
import { doWalletUnlock } from 'redux/actions/wallet';

type Props = {
  shouldTryWithBlankPassword: boolean;
};

function ModalWalletUnlock(props: Props) {
  const { shouldTryWithBlankPassword } = props;
  const dispatch = useAppDispatch();
  const walletUnlockSucceded = useAppSelector(selectWalletUnlockSucceeded);

  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);

  const closeModal = () => dispatch(doHideModal());
  const quit = () => dispatch(doQuit());
  const unlockWallet = (pwd: string) => dispatch(doWalletUnlock(pwd));

  useEffect(() => {
    getSavedPassword().then((p) => {
      if (p !== null) {
        setPassword(p);
        setRememberPassword(true);
        unlockWallet(p);
      } else if (shouldTryWithBlankPassword) {
        unlockWallet('');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (walletUnlockSucceded) {
      setSavedPassword(password, rememberPassword);
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletUnlockSucceded]);

  function onChangePassword(event: React.SyntheticEvent<any>) {
    setPassword((event.target as HTMLInputElement).value);
  }

  function onChangeRememberPassword(event: React.SyntheticEvent) {
    setRememberPassword((event.target as HTMLInputElement).checked);
  }

  return (
    <Modal
      isOpen
      title={__('Unlock wallet')}
      contentLabel={__('Unlock wallet')}
      type="confirm"
      shouldCloseOnOverlayClick={false}
      confirmButtonLabel={__('Unlock')}
      abortButtonLabel={__('Exit')}
      onConfirmed={() => unlockWallet(password)}
      onAborted={quit}
    >
      <p>
        {__('Your wallet has been encrypted with a local password. Please enter your wallet password to proceed.')}{' '}
        <Button button="link" label={__('Learn more')} href="https://lbry.com/faq/wallet-encryption" />.
      </p>
      <Form className="section" onSubmit={() => unlockWallet(password)}>
        <FormField
          autoFocus
          error={!walletUnlockSucceded ? 'Incorrect Password' : false}
          label={__('Wallet Password')}
          type="password"
          name="wallet-password"
          onChange={(event) => onChangePassword(event)}
          value={password || ''}
        />
        <fieldset-section>
          <FormField
            label={__('Remember Password')}
            type="checkbox"
            name="wallet-remember-password"
            onChange={(event) => onChangeRememberPassword(event)}
            checked={rememberPassword}
          />
        </fieldset-section>
      </Form>
    </Modal>
  );
}

export default ModalWalletUnlock;
