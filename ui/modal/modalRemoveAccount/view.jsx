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
  totalClaimsCount: number,
  isFetchingChannels: boolean,
  isFetchingChannelsSuccess: ?boolean,
  isFetchingClaims: boolean,
  isFetchingClaimsSuccess: ?boolean,
  isFetchingAccounts: boolean,
  isFetchingAccountsSuccess: ?boolean,
  isWalletMerged: ?boolean,
  channelUrls: ?Array<string>,
  doHideModal: () => void,
  doRemoveAccountSequence: () => Promise<any>,
  doFetchChannelListMine: () => void,
  doFetchClaimListMine: (page: number, pageSize: number, resolve: boolean) => void,
  doFetchAccountList: () => void,
};

export default function ModalRemoveAccount(props: Props) {
  const {
    isPendingDeletion,
    totalBalance,
    totalClaimsCount,
    isFetchingChannels,
    isFetchingChannelsSuccess,
    isFetchingClaims,
    isFetchingClaimsSuccess,
    isFetchingAccounts,
    isFetchingAccountsSuccess,
    isWalletMerged,
    channelUrls,
    doHideModal,
    doRemoveAccountSequence,
    doFetchChannelListMine,
    doFetchClaimListMine,
    doFetchAccountList,
  } = props;

  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);

  const isWalletEmpty = totalBalance <= 0.005;
  const isLoadingAccountInfo = isFetchingChannels || isFetchingAccounts || isFetchingClaims;
  const isLoadingAccountInfoSuccess = isFetchingChannelsSuccess && isFetchingAccountsSuccess && isFetchingClaimsSuccess;
  const showButton =
    !buttonClicked &&
    (!isPendingDeletion || !isWalletEmpty) &&
    isLoadingAccountInfoSuccess &&
    !isLoadingAccountInfo;

  React.useEffect(() => {
    if (!isPendingDeletion || !isWalletEmpty) {
      doFetchAccountList();
      const page = 1,
        pageSize = 1,
        resolve = false;
      doFetchClaimListMine(page, pageSize, resolve);
      doFetchChannelListMine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
  }, []);

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
          <>
            {isBusy
              ? ''
              : !isLoadingAccountInfo && !isLoadingAccountInfoSuccess
              ? __(
                  'Failed to load account info. If the issue persists, please reach out to help@odysee.com for support.'
                )
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
                )}
            {showButton && (
              <div className="help">
                <p>{__('Credits: %credits%', { credits: totalBalance })}</p>
                <p>{__('Publications: %claims%', { claims: totalClaimsCount })}</p>
                {channelUrls && (
                  <>
                    <p>{__('Channels:')}</p>
                    <ul>
                      {channelUrls.map((url) => {
                        const name = [].concat(url.match(/@[^#]+/)).pop();
                        const claimId = [].concat(url.match(/[a-f0-9]+$/)).pop();
                        return <li key={claimId}>{name}</li>;
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
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
            {showButton && isWalletMerged && (
              <div className="help--warning">
                <p>
                  {__(
                    "We detected multiple wallets on this account. Please make sure this account doesn't have any credits, publications or channels that you don't want to lose. If you aren't sure, please reach out to help@odysee.com for support."
                  )}
                </p>
              </div>
            )}
            <div className="section__actions">
              {isBusy || isLoadingAccountInfo ? (
                <BusyIndicator message={isBusy ? __('Removing content...') : __('Loading account info...')} />
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
