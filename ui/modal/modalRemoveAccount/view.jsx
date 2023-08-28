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
  activeMembershipIds: Array<any>,
  // --- perform ---
  doHideModal: () => void,
  doUserFetch: () => void,
  doSpendEverything: () => Promise<any>,
  doUserDeleteAccount: () => void,
  doSendCreditsToOdysee: () => Promise<any>,
  doClearUserDeletionSuccess: () => void,
  doMembershipCancelForMembershipId: (membershipId: number) => Promise<any>,
};

export default function ModalRemoveAccount(props: Props) {
  const {
    user,
    totalBalance,
    userDeletionSuccess,
    activeMembershipIds,
    doHideModal,
    doUserFetch,
    doSpendEverything,
    doUserDeleteAccount,
    doSendCreditsToOdysee,
    doClearUserDeletionSuccess,
    doMembershipCancelForMembershipId,
  } = props;

  const [isAlreadyPendingDeletion] = React.useState(user.pending_deletion);
  const [deletionRequestSent, setDeletionRequestSent] = React.useState(false);
  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);
  const [errorOccurred, setErrorOccurred] = React.useState(false);

  const originalActiveMembershipsAmount = React.useRef(activeMembershipIds.length);
  const hasActiveMemberships = activeMembershipIds.length > 0;
  const finishedMembershipCancellationsCountRef = React.useRef(0);
  const [finishedMembershipCancellationsCount, setFinishedMembershipCancellationsCount] = React.useState(finishedMembershipCancellationsCountRef.current);
  const [someMembershipCancellationFailed, setSomeMembershipCancellationFailed] = React.useState(false);

  const isWalletEmpty = totalBalance <= 0.009;
  const [forfeitCreditsSuccess, setForfeitCreditsSuccess] = React.useState(isWalletEmpty || undefined);
  const [cancelingMembershipsSuccess, setCancelingMembershipsSuccess] = React.useState(!hasActiveMemberships || undefined);
  const preDeletionSuccessChecks = [forfeitCreditsSuccess, cancelingMembershipsSuccess];

  const nothingToWipe = isWalletEmpty && !hasActiveMemberships;
  const showButton = !buttonClicked && (!isAlreadyPendingDeletion || !nothingToWipe);

  const sendDeletionRequest = React.useCallback(() => {
    doUserDeleteAccount();
    setTimeout(doUserFetch, 1000);
    setDeletionRequestSent(true);
    setIsBusy(false);
  }, [doUserDeleteAccount, doUserFetch]);

  // Tracks if deletion of the account failed
  React.useEffect(() => {
    if (userDeletionSuccess === false) {
      setErrorOccurred(true);
    }
  }, [userDeletionSuccess]);

  // Tracks if account is ready for deletion, and triggers the deletion
  React.useEffect(() => {
    const waitingForPreDeletionSuccessChecksToFinish = preDeletionSuccessChecks.some((check) => check === undefined);
    if (waitingForPreDeletionSuccessChecksToFinish) {
      return;
    }
    const somethingFailedWhenPrepairingForDeletion = preDeletionSuccessChecks.some((check) => check === false);
    if (somethingFailedWhenPrepairingForDeletion) {
      setErrorOccurred(true);
      setIsBusy(false);
    } else if (buttonClicked && !deletionRequestSent && !isAlreadyPendingDeletion) {
      sendDeletionRequest();
  }
  }, [preDeletionSuccessChecks, buttonClicked, deletionRequestSent, isAlreadyPendingDeletion, sendDeletionRequest]);

  // Tracks if all memberships are cancelled succesfully
  React.useEffect(() => {
    const allMembershipsCancellationsFinished = finishedMembershipCancellationsCount === originalActiveMembershipsAmount.current;
    if (!allMembershipsCancellationsFinished) {
      return;
    }
    if (someMembershipCancellationFailed) {
      setCancelingMembershipsSuccess(false);
    } else {
      setCancelingMembershipsSuccess(true);
    }
  }, [finishedMembershipCancellationsCount, someMembershipCancellationFailed]);

  function cancelMemberships() {
    activeMembershipIds.forEach((membershipId) => {
        doMembershipCancelForMembershipId(membershipId)
         .catch(() => setSomeMembershipCancellationFailed(true))
         .finally(() => {
            finishedMembershipCancellationsCountRef.current += 1;
            setFinishedMembershipCancellationsCount(finishedMembershipCancellationsCountRef.current);
         });
      });
  }

  function forfeitCredits() {
    doSpendEverything()
      .then(() => {
        setTimeout(() => {
          doSendCreditsToOdysee()
            .then(() => {
              setForfeitCreditsSuccess(true);
            })
            .catch(() => {
              setForfeitCreditsSuccess(false);
            });
        }, 5000); // Hoping the timeout helps to avoid using outputs already spend in txo_spend
      })
      .catch(() => {
        setForfeitCreditsSuccess(false);
      });
  }

  function handleOnClick() {
    setButtonClicked(true);
    setIsBusy(true);

    if (hasActiveMemberships) {
      cancelMemberships();
    }
    if (!isWalletEmpty) {
      forfeitCredits();
    }
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
          : isAlreadyPendingDeletion && nothingToWipe && !buttonClicked
          ? __('Account has already been queued for deletion.')
          : isAlreadyPendingDeletion && !nothingToWipe && !buttonClicked
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
