// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';

type Props = {
  user: User,
  totalBalance: number,
  userDeletionSuccess: boolean,
  // --- perform ---
  doHideModal: () => void,
  doUserFetch: () => void,
  doSpendEverything: () => Promise<any>,
  doUserDeleteAccount: () => void,
  doSendCreditsToOdysee: () => Promise<any>,
  doClearUserDeletionSuccess: () => void,
};

export default function ModalRemoveAccount(props: Props) {
  const { user, totalBalance, userDeletionSuccess, doHideModal, doUserFetch, doSpendEverything, doUserDeleteAccount, doSendCreditsToOdysee, doClearUserDeletionSuccess } = props;

  const [isAlreadyPendingDeletion] = React.useState(user.pending_deletion);
  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);
  const [errorOccurred, setErrorOccurred] = React.useState(false);

  const isWalletEmpty = totalBalance <= 0.0001;
  const showButton = !buttonClicked && (!isAlreadyPendingDeletion || !isWalletEmpty);

  React.useEffect(() => {
    if (userDeletionSuccess === false) {
      setErrorOccurred(true);
    }
  }, [userDeletionSuccess]);

  function sendDeletionRequest() {
    if (!isAlreadyPendingDeletion) {
      doUserDeleteAccount();
      setTimeout(doUserFetch, 1000);
    }
    setIsBusy(false);
  }

  function forfeitCreditsAndSendDeletionRequest() {
    doSpendEverything()
      .then(() => {
        setTimeout(() => {
          doSendCreditsToOdysee()
            .then(() => {
              sendDeletionRequest();
            })
            .catch(() => {
              setErrorOccurred(true);
              setIsBusy(false);
            });
        }, 5000); // Hoping the timeout helps to avoid using outputs already spend in txo_spend
      })
      .catch(() => {
        setErrorOccurred(true);
        setIsBusy(false);
      });
  }

  function handleOnClick() {
    setIsBusy(true);
    if (!isWalletEmpty) {
      forfeitCreditsAndSendDeletionRequest();
    } else {
      sendDeletionRequest();
    }
    setButtonClicked(true);
  }

  function handleOnClose() {
    doClearUserDeletionSuccess();
    doHideModal();
  }

  return (
    <Modal isOpen type="custom" width="wide">
      <Card
        title={__('Delete account')}
        subtitle={isBusy ? ''
          : errorOccurred
          ? __('Sorry, there may have been an issue when wiping the account and/or sending the deletion request. Please check back in few minutes, and try again. If the issue persists please contact help@odysee.com for possible next steps.')
          : isAlreadyPendingDeletion && !buttonClicked && isWalletEmpty
          ? __('Account has already been queued for deletion.')
          : isAlreadyPendingDeletion && !buttonClicked && !isWalletEmpty
          ? __('Account has already been queued for deletion. If you still have content/credits on the account which you want removed, click "Remove content".')
          : !isAlreadyPendingDeletion && !buttonClicked
          ? __("Remove all content from the account and send a deletion request to Odysee. Removing the content is a permanent action and can't be undone.")
          : __('Account has been queued for deletion, and content has been removed. You will receive an email confirmation once the deletion is completed. It may take few minutes for content to completely disappear.')}
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
              ) : showButton && (
                <Button
                  button="primary"
                  label={isBusy ? <Spinner type="small" />
                    : !isAlreadyPendingDeletion
                      ? __('Remove content and send deletion request')
                      : __('Remove content')}
                  disabled={isBusy || !isForfeitChecked}
                  onClick={handleOnClick}
                />
              )}

              {!(isBusy) && (
                <Button button="link" label={__('Close')} disabled={isBusy} onClick={handleOnClose} />
              )}
            </div>
          </>
        }
      />
    </Modal>
  );
}
