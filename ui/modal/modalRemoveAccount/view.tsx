import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import { Modal } from 'modal/modal';
import BusyIndicator from 'component/common/busy-indicator';
import { FormField } from 'component/common/form';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import {
  selectMyChannelClaimUrls,
  selectFetchingMyChannels,
  selectFetchingMyChannelsSuccess,
  selectIsFetchingClaimListMine,
  selectIsFetchingClaimListMineSuccess,
  selectMyClaimsPageItemCount,
} from 'redux/selectors/claims';
import {
  selectTotalBalance,
  selectIsFetchingAccounts,
  selectIsWalletMerged,
  selectIsFetchingAccountsSuccess,
} from 'redux/selectors/wallet';
import { selectUser, selectHasYoutubeChannels } from 'redux/selectors/user';
import { doHideModal } from 'redux/actions/app';
import { doFetchAccountList } from 'redux/actions/wallet';
import { doFetchChannelListMine, doFetchClaimListMine } from 'redux/actions/claims';
import { doRemoveAccountSequence } from './thunk';

export default function ModalRemoveAccount() {
  const dispatch = useAppDispatch();
  const isPendingDeletion = useAppSelector((state) => selectUser(state)?.pending_deletion);
  const hasYouTubeChannels = useAppSelector(selectHasYoutubeChannels);
  const totalBalance = useAppSelector(selectTotalBalance);
  const totalClaimsCount = useAppSelector(selectMyClaimsPageItemCount);
  const channelUrls = useAppSelector(selectMyChannelClaimUrls);
  const isFetchingChannels = useAppSelector(selectFetchingMyChannels);
  const isFetchingChannelsSuccess = useAppSelector(selectFetchingMyChannelsSuccess);
  const isFetchingClaims = useAppSelector(selectIsFetchingClaimListMine);
  const isFetchingClaimsSuccess = useAppSelector(selectIsFetchingClaimListMineSuccess);
  const isFetchingAccounts = useAppSelector(selectIsFetchingAccounts);
  const isFetchingAccountsSuccess = useAppSelector(selectIsFetchingAccountsSuccess);
  const isWalletMerged = useAppSelector(selectIsWalletMerged);

  const [buttonClicked, setButtonClicked] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [isForfeitChecked, setIsForfeitChecked] = React.useState(false);
  const isWalletEmpty = totalBalance <= 0.005;
  const isLoadingAccountInfo = isFetchingChannels || isFetchingAccounts || isFetchingClaims;
  const isLoadingAccountInfoSuccess = isFetchingChannelsSuccess && isFetchingAccountsSuccess && isFetchingClaimsSuccess;
  const showButton =
    !buttonClicked && (!isPendingDeletion || !isWalletEmpty) && isLoadingAccountInfoSuccess && !isLoadingAccountInfo;
  React.useEffect(() => {
    if (!isPendingDeletion || !isWalletEmpty) {
      dispatch(doFetchAccountList());
      const page = 1,
        pageSize = 1,
        resolve = false;
      dispatch(doFetchClaimListMine(page, pageSize, resolve));
      dispatch(doFetchChannelListMine());
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
  }, []);

  async function handleOnClick() {
    setButtonClicked(true);
    setIsBusy(true);
    const status = await dispatch(doRemoveAccountSequence());
    setStatus(status);
    setIsBusy(false);
  }

  function handleOnClose() {
    dispatch(doHideModal());
  }

  return (
    <Modal isOpen type="custom" width="wide">
      <Card
        title={__('Delete account')}
        subtitle={
          <>
            {isBusy
              ? ''
              : !isLoadingAccountInfo && !isLoadingAccountInfoSuccess && (!isPendingDeletion || !isWalletEmpty)
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
                <p>
                  {__('Credits: %credits%', {
                    credits: totalBalance,
                  })}
                </p>
                <p>
                  {__('Publications: %claims%', {
                    claims: totalClaimsCount,
                  })}
                </p>
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
            {showButton && hasYouTubeChannels && (
              <div className="help--warning">
                <p>{__('YOUTUBE SYNCED CHANNELS!')}</p>
                <p>
                  {__(
                    "If something went wrong with the sync, please don't try to fix it by deleting the channel. Instead reach out to us at help@odysee.com to get it fixed. Once deleted we may not be able to sync it again or fix it."
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
