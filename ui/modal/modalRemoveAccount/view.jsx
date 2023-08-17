// @flow
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';

type Props = {
  user: ?User,
  totalBalance: float,
  // --- perform ---
  doHideModal: () => void,
  doUserFetch: () => void,
  doSpentEverything: () => void,
  doUserDeleteAccount: () => void,
  doSendCreditsToOdysee: (string, float) => void,
};

export default function ModalRemoveAccount(props: Props) {
  const { user, totalBalance, doHideModal, doUserFetch, doSpentEverything, doUserDeleteAccount, doSendCreditsToOdysee } = props;

  const [isAlreadyPendingDeletion] = React.useState(user.pending_deletion);
  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);
  const [errorOccured, setErrorOccured] = React.useState(false);

  const isWalletEmpty = totalBalance <= 0.001;
  const showButton = !buttonClicked && (!isAlreadyPendingDeletion || !isWalletEmpty);

  function forfeitCredits() {
    setIsBusy(true);
    doSpentEverything()
      .then(() => {
        setTimeout(() => {
          doSendCreditsToOdysee();
          setIsBusy(false);
        }, 5000); // Hoping the timeout helps to avoid using outputs already spend in txo_spend
      })
      .catch(() => {
        setErrorOccured(true);
        setIsBusy(false);
      });
  }

  function handleOnClick() {
    if (!isWalletEmpty) {
      forfeitCredits();
    }
    if (!isAlreadyPendingDeletion) {
      doUserDeleteAccount();
      setTimeout(doUserFetch, 1000);
    }
    setButtonClicked(true);
  }

  return (
    <Modal isOpen type="custom" width="wide">
      <Card
        title={__('Delete account')}
        subtitle={isBusy ? ''
          : errorOccured
          ? __('Sorry, something went wrong when removing content. Account may have still been queued for deletion. Please contact help@odysee.com for possible next steps.')
          : isAlreadyPendingDeletion && !buttonClicked && isWalletEmpty
          ? __('Account has already been queued for deletion.')
          : isAlreadyPendingDeletion && !buttonClicked
          ? __('Account has already been queued for deletion. If you still have content on the account which you want removed, click "Remove content".')
          : !isAlreadyPendingDeletion && !buttonClicked
          ? __("Remove all content from the account and send a deletion request to Odysee. Removing the content is a permanent action and can't be undone.")
          : isAlreadyPendingDeletion && buttonClicked
          ? __('Content removed. It may take few minutes for content to completely disappear.')
          : __('Account has been queued for deletion. You will receive an email confirmation once the deletion is completed. It may take few minutes for content to completely disappear.')}
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
                <Button button="link" label={__('Close')} disabled={isBusy} onClick={doHideModal} />
              )}
            </div>
          </>
        }
      />
    </Modal>
  );
}
