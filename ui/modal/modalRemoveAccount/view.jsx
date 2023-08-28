// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';

type Props = {
  isPendingDeletion: ?boolean,
  totalBalance: number,
  doHideModal: () => void,
  doRemoveAccountSequence: () => Promise<any>,
};

export default function ModalRemoveAccount(props: Props) {
  const { isPendingDeletion, totalBalance, doHideModal, doRemoveAccountSequence } = props;

  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);

  const isWalletEmpty = totalBalance <= 0.005;
  const showButton = !buttonClicked && (!isPendingDeletion || !isWalletEmpty);

  async function handleOnClick() {
    setButtonClicked(true);
    setIsBusy(true);
    const status = await doRemoveAccountSequence();
    setStatus(status);
    setIsBusy(false);
  }

  function handleOnClose() {
    doHideModal();
  }

  return (
    <Modal isOpen type="custom" width="wide">
      <Card
        title={__('Delete account')}
        subtitle={
          isBusy
            ? ''
            : status === 'error_occurred'
            ? __(
                'Sorry, there may have been an issue when wiping the account and/or sending the deletion request. Please check back in few minutes, and try again. If the issue persists please contact help@odysee.com for possible next steps.'
              )
            : isPendingDeletion && isWalletEmpty && !buttonClicked
            ? __('Account has already been queued for deletion.')
            : isPendingDeletion && !isWalletEmpty && !buttonClicked
            ? __(
                'Account has already been queued for deletion. If you still have content/credits on the account which you want removed, click "Remove content".'
              )
            : !isPendingDeletion && !buttonClicked
            ? __(
                "Remove all content from the account and send a deletion request to Odysee. Removing the content is a permanent action and can't be undone."
              )
            : __(
                'Account has been queued for deletion, and content has been removed. You will receive an email confirmation once the deletion is completed. It may take few minutes for content to completely disappear.'
              )
        }
        className="confirm__wrapper"
        actions={
          <>
            {showButton && (
              <FormField
                type="checkbox"
                name="forfeit_credits_checkbox"
                label={__('Remove all content from the account and forfeit credits left on the account to Odysee')}
                checked={isForfeitChecked}
                disabled={isBusy}
                onChange={() => setIsForfeitChecked(!isForfeitChecked)}
              />
            )}
            <div className="section__actions">
              {isBusy ? (
                <BusyIndicator message={__('Removing content...')} />
              ) : (
                showButton && (
                  <Button
                    button="primary"
                    label={
                      isBusy ? (
                        <Spinner type="small" />
                      ) : !isPendingDeletion ? (
                        __('Remove content and send deletion request')
                      ) : (
                        __('Remove content')
                      )
                    }
                    disabled={isBusy || !isForfeitChecked}
                    onClick={handleOnClick}
                  />
                )
              )}

              {!isBusy && <Button button="link" label={__('Close')} disabled={isBusy} onClick={handleOnClose} />}
            </div>
          </>
        }
      />
    </Modal>
  );
}
