import * as ACTIONS from 'constants/action_types';
import * as MODALS from 'constants/modal_types';
import * as ERRORS from 'constants/errors';
import * as PAGES from 'constants/pages';
import Lbry from 'lbry';
import { Lbryio } from 'lbryinc';
import { doOpenModal } from 'redux/actions/app';
import { doToast } from 'redux/actions/notifications';
import {
  selectBalance,
  selectTotalBalance,
  selectPendingSupportTransactions,
  selectTxoPageParams,
  selectPendingOtherTransactions,
  selectPendingConsolidateTxid,
  selectPendingMassClaimTxid,
  selectIsFetchingAccounts,
} from 'redux/selectors/wallet';
import { resolveApiMessage } from 'util/api-message';
import { creditsToString } from 'util/format-credits';
import { dispatchToast } from 'util/toast-wrappers';
import {
  selectMyClaimsRaw,
  selectClaimsById,
  selectClaimForUri,
  selectPreorderTagForUri,
  selectPurchaseTagForUri,
  selectRentalTagForUri,
} from 'redux/selectors/claims';
import { selectPreferredCurrency } from 'redux/selectors/settings';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { getChannelFromClaim } from 'util/claim';
import { doFetchChannelListMine, doFetchClaimListMine, doClaimSearch } from 'redux/actions/claims';

import { getStripeEnvironment } from 'util/stripe';
import { sendWinstons } from './arwallet';
import { selectAPIArweaveDefaultAddress, selectArweaveTipDataForId } from 'redux/selectors/stripe';
const stripeEnvironment = getStripeEnvironment();

const FIFTEEN_SECONDS = 15000;
let walletBalancePromise = null;

export function doUpdateBalance() {
  return (dispatch, getState) => {
    const {
      wallet: { totalBalance: totalInStore },
    } = getState();

    if (walletBalancePromise === null) {
      walletBalancePromise = Lbry.wallet_balance()
        .then((response) => {
          walletBalancePromise = null;

          const { available, reserved, reserved_subtotals, total } = response;
          const { claims, supports, tips } = reserved_subtotals;
          const totalFloat = parseFloat(total);

          if (totalInStore !== totalFloat) {
            dispatch({
              type: ACTIONS.UPDATE_BALANCE,
              data: {
                totalBalance: totalFloat,
                balance: parseFloat(available),
                reservedBalance: parseFloat(reserved),
                claimsBalance: parseFloat(claims),
                supportsBalance: parseFloat(supports),
                tipsBalance: parseFloat(tips),
              },
            });
          }
        })
        .catch(() => {
          walletBalancePromise = null;
        });
    }

    return walletBalancePromise;
  };
}

export function doFetchAccountList(page = 1, pageSize = 99999) {
  return (dispatch, getState) => {
    const state = getState();
    const isFetching = selectIsFetchingAccounts(state);

    if (isFetching) return;

    dispatch({ type: ACTIONS.FETCH_ACCOUNT_LIST_STARTED });

    const callback = (response) => {
      dispatch({ type: ACTIONS.FETCH_ACCOUNT_LIST_COMPLETED, data: response.items });
    };

    const failure = () => {
      dispatch({ type: ACTIONS.FETCH_ACCOUNT_LIST_FAILED });
    };

    Lbry.account_list({ page, page_size: pageSize }).then(callback, failure);
  };
}

export function doBalanceSubscribe() {
  return (dispatch) => {
    dispatch(doUpdateBalance());
    setInterval(() => dispatch(doUpdateBalance()), 10000);
  };
}

export function doFetchTransactions(page = 1, pageSize = 999999) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_TRANSACTIONS_STARTED,
    });

    Lbry.transaction_list({ page, page_size: pageSize })
      .then((result) => {
        dispatch({
          type: ACTIONS.FETCH_TRANSACTIONS_COMPLETED,
          data: {
            transactions: result.items,
          },
        });
      })
      .catch((e) => {
        dispatch({ type: ACTIONS.FETCH_TRANSACTIONS_FAILED });
        dispatchToast(dispatch, __('Failed to get transactions. Try again later.'), e.message || e, 'long');
      });
  };
}

export function doFetchTxoPage() {
  return (dispatch, getState) => {
    const fetchId = Math.random().toString(36).substr(2, 9);

    dispatch({
      type: ACTIONS.FETCH_TXO_PAGE_STARTED,
      data: fetchId,
    });

    const state = getState();
    const queryParams = selectTxoPageParams(state);

    Lbry.txo_list(queryParams)
      .then((res) => {
        const items = res.items || [];
        const claimsById = selectClaimsById(state);

        const channelIds = items.reduce((acc, cur) => {
          if (cur.type === 'support' && cur.signing_channel && !claimsById[cur.signing_channel.channel_id]) {
            acc.push(cur.signing_channel.channel_id);
          }
          return acc;
        }, []);

        if (channelIds.length) {
          const searchParams = {
            page_size: 9999,
            page: 1,
            no_totals: true,
            claim_ids: channelIds,
          };
          // make sure redux has these channels resolved
          dispatch(doClaimSearch(searchParams));
        }

        return res;
      })
      .then((res) => {
        dispatch({
          type: ACTIONS.FETCH_TXO_PAGE_COMPLETED,
          data: {
            result: res,
            fetchId: fetchId,
          },
        });
      })
      .catch((e) => {
        dispatch({
          type: ACTIONS.FETCH_TXO_PAGE_COMPLETED,
          data: {
            error: e.message,
            fetchId: fetchId,
          },
        });
      });
  };
}

export function doUpdateTxoPageParams(params) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.UPDATE_TXO_FETCH_PARAMS,
      data: params,
    });

    dispatch(doFetchTxoPage());
  };
}

export function doFetchSupports(page = 1, pageSize = 99999) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_SUPPORTS_STARTED,
    });

    Lbry.support_list({ page, page_size: pageSize }).then((result) => {
      dispatch({
        type: ACTIONS.FETCH_SUPPORTS_COMPLETED,
        data: {
          supports: result.items,
        },
      });
    });
  };
}

export function doFetchUtxoCounts() {
  return async (dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_UTXO_COUNT_STARTED,
    });

    let resultSets = await Promise.all([
      Lbry.txo_list({ type: 'other', is_not_spent: true, page: 1, page_size: 1 }),
      Lbry.txo_list({ type: 'support', is_not_spent: true, page: 1, page_size: 1 }),
    ]);
    const counts = {};
    const paymentCount = resultSets[0]['total_items'];
    const supportCount = resultSets[1]['total_items'];
    counts['other'] = typeof paymentCount === 'number' ? paymentCount : 0;
    counts['support'] = typeof supportCount === 'number' ? supportCount : 0;

    dispatch({
      type: ACTIONS.FETCH_UTXO_COUNT_COMPLETED,
      data: counts,
      debug: { resultSets },
    });
  };
}

export function doUtxoConsolidate() {
  return async (dispatch) => {
    dispatch({
      type: ACTIONS.DO_UTXO_CONSOLIDATE_STARTED,
    });

    const results = await Lbry.txo_spend({ type: 'other' });
    const result = results[0];

    dispatch({
      type: ACTIONS.PENDING_CONSOLIDATED_TXOS_UPDATED,
      data: { txids: [result.txid] },
    });

    dispatch({
      type: ACTIONS.DO_UTXO_CONSOLIDATE_COMPLETED,
      data: { txid: result.txid },
    });
    dispatch(doCheckPendingTxs());
  };
}

export function doTipClaimMass() {
  return async (dispatch) => {
    dispatch({
      type: ACTIONS.TIP_CLAIM_MASS_STARTED,
    });

    const results = await Lbry.txo_spend({ type: 'support', is_not_my_input: true });
    const result = results[0];

    dispatch({
      type: ACTIONS.PENDING_CONSOLIDATED_TXOS_UPDATED,
      data: { txids: [result.txid] },
    });

    dispatch({
      type: ACTIONS.TIP_CLAIM_MASS_COMPLETED,
      data: { txid: result.txid },
    });
    dispatch(doCheckPendingTxs());
  };
}

export function doSpendEverything() {
  return async (dispatch) => {
    dispatch({
      type: ACTIONS.SPENT_EVERYTHING_STARTED,
    });

    const results = await Lbry.txo_spend({});
    const result = results[0];

    dispatch({
      type: ACTIONS.PENDING_CONSOLIDATED_TXOS_UPDATED,
      data: { txids: [result.txid] },
    });

    dispatch({
      type: ACTIONS.SPENT_EVERYTHING_COMPLETED,
      data: { txid: result.txid },
    });
    dispatch(doCheckPendingTxs());
  };
}

export function doSendCreditsToOdysee() {
  return async (dispatch, getState) => {
    const state = getState();
    const totalBalance = selectTotalBalance(state);

    const address = 'bbHs8svj9NMVHYPLro1L1GkXk6scNouFJE';
    const leftOverForFee = 0.005;
    const amount = totalBalance - leftOverForFee;

    if (amount <= 0) {
      return;
    }

    dispatch({
      type: ACTIONS.SEND_CREDITS_TO_ODYSEE_STARTED,
    });

    await Lbry.wallet_send({
      addresses: [address],
      amount: creditsToString(amount),
    });

    dispatch({
      type: ACTIONS.SEND_CREDITS_TO_ODYSEE_COMPLETED,
    });
  };
}

export function doGetNewAddress() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.GET_NEW_ADDRESS_STARTED,
    });

    Lbry.address_unused().then((address) => {
      dispatch({
        type: ACTIONS.GET_NEW_ADDRESS_COMPLETED,
        data: { address },
      });
    });
  };
}

export function doCheckAddressIsMine(address) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.CHECK_ADDRESS_IS_MINE_STARTED,
    });

    Lbry.address_is_mine({ address }).then((isMine) => {
      if (!isMine) dispatch(doGetNewAddress());

      dispatch({
        type: ACTIONS.CHECK_ADDRESS_IS_MINE_COMPLETED,
      });
    });
  };
}

export function doSendDraftTransaction(address, amount) {
  return (dispatch, getState) => {
    const state = getState();
    const balance = selectBalance(state);

    if (balance - amount <= 0) {
      dispatch(
        doToast({
          title: __('Insufficient credits'),
          message: __('Insufficient credits'),
        })
      );
      return;
    }

    dispatch({
      type: ACTIONS.SEND_TRANSACTION_STARTED,
    });

    const successCallback = (response) => {
      if (response.txid) {
        dispatch({
          type: ACTIONS.SEND_TRANSACTION_COMPLETED,
        });
        dispatch(
          doToast({
            message: __('Credits successfully sent.'),
            linkText: `${amount} LBC`,
            linkTarget: '/wallet',
          })
        );
      } else {
        dispatch({
          type: ACTIONS.SEND_TRANSACTION_FAILED,
          data: { error: response },
        });
        dispatch(
          doToast({
            message: __('Transaction failed'),
            isError: true,
          })
        );
      }
    };

    const errorCallback = (error) => {
      dispatch({
        type: ACTIONS.SEND_TRANSACTION_FAILED,
        data: { error: error.message },
      });

      const errMsg = typeof error === 'object' ? error.message : error;
      if (errMsg.endsWith(ERRORS.SDK_FETCH_TIMEOUT)) {
        dispatch(
          doOpenModal(MODALS.CONFIRM, {
            title: __('Transaction failed'),
            body: 'The transaction timed out, but may have been completed. Please wait a few minutes, then check your wallet transactions before attempting to retry.',
            onConfirm: (closeModal) => closeModal(),
            hideCancel: true,
          })
        );
      } else {
        dispatch(
          doToast({
            message: __('Transaction failed'),
            subMessage: resolveApiMessage(error?.message),
            isError: true,
          })
        );
      }
    };

    Lbry.wallet_send({
      addresses: [address],
      amount: creditsToString(amount),
    }).then(successCallback, errorCallback);
  };
}

export function doSetDraftTransactionAmount(amount) {
  return {
    type: ACTIONS.SET_DRAFT_TRANSACTION_AMOUNT,
    data: { amount },
  };
}

export function doSetDraftTransactionAddress(address) {
  return {
    type: ACTIONS.SET_DRAFT_TRANSACTION_ADDRESS,
    data: { address },
  };
}

export function doSendTip(params, isSupport, successCallback, errorCallback, shouldNotify = true, purpose = '') {
  return (dispatch, getState) => {
    const state = getState();
    const balance = selectBalance(state);
    const myClaims = selectMyClaimsRaw(state);
    const supportOwnClaim = myClaims ? myClaims.find((claim) => claim.claim_id === params.claim_id) : false;

    const shouldSupport = isSupport || supportOwnClaim;

    if (balance - params.amount <= 0) {
      dispatch(
        doToast({
          message: __('Insufficient credits'),
          isError: true,
        })
      );
      return;
    }

    const success = (response) => {
      if (shouldNotify) {
        dispatch(
          doToast({
            message: shouldSupport ? __('Boost transaction successful.') : __('Tip successfully sent.'),
            subMessage: __("I'm sure they appreciate it!"),
            linkText: `${params.amount} LBC`,
            linkTarget: `/${PAGES.WALLET}?tab=fiat-payment-history`,
          })
        );
      }

      dispatch({
        type: ACTIONS.SUPPORT_TRANSACTION_COMPLETED,
        data: {
          amount: params.amount,
          type: shouldSupport ? (supportOwnClaim ? 'support_own' : 'support_others') : 'tip',
        },
      });

      if (successCallback) {
        successCallback(response);
      }
    };

    const error = (err) => {
      const baseMsg = isSupport ? __('Boost transaction failed.') : __('Tip transaction failed.');
      const errMsg = typeof err === 'object' ? err.message : err;

      if (errMsg.endsWith(ERRORS.SDK_FETCH_TIMEOUT)) {
        let msg;

        switch (purpose) {
          case 'comment':
            msg = __(
              'The transaction timed out, but may have been completed. Please wait a few minutes, then check your wallet transactions before attempting to retry. Note that due to current limitations, we are unable to re-link the tip sent to a new comment.'
            );
            break;

          default:
            msg = __(
              'The transaction timed out, but may have been completed. Please wait a few minutes, then check your wallet transactions before attempting to retry.'
            );
            break;
        }

        dispatch(
          doOpenModal(MODALS.CONFIRM, {
            title: baseMsg,
            body: msg,
            onConfirm: (closeModal) => closeModal(),
            hideCancel: true,
          })
        );
      }

      dispatch({
        type: ACTIONS.SUPPORT_TRANSACTION_FAILED,
        data: {
          error: err,
          type: shouldSupport ? (supportOwnClaim ? 'support_own' : 'support_others') : 'tip',
        },
      });

      if (errorCallback) {
        errorCallback(err);
      }
    };

    dispatch({
      type: ACTIONS.SUPPORT_TRANSACTION_STARTED,
    });

    Lbry.support_create({
      ...params,
      tip: !shouldSupport,
      blocking: true,
      amount: creditsToString(params.amount),
    }).then(success, error);
  };
}

export function doClearSupport() {
  return {
    type: ACTIONS.CLEAR_SUPPORT_TRANSACTION,
  };
}

export function doWalletEncrypt(newPassword) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_ENCRYPT_START,
    });

    Lbry.wallet_encrypt({ new_password: newPassword }).then((result) => {
      if (result === true) {
        dispatch({
          type: ACTIONS.WALLET_ENCRYPT_COMPLETED,
          result,
        });
      } else {
        dispatch({
          type: ACTIONS.WALLET_ENCRYPT_FAILED,
          result,
        });
      }
    });
  };
}

export function doWalletUnlock(password) {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_UNLOCK_START,
    });

    Lbry.wallet_unlock({ password }).then((result) => {
      if (result === true) {
        dispatch({
          type: ACTIONS.WALLET_UNLOCK_COMPLETED,
          result,
        });
      } else {
        dispatch({
          type: ACTIONS.WALLET_UNLOCK_FAILED,
          result,
        });
      }
    });
  };
}

export function doWalletLock() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_LOCK_START,
    });

    Lbry.wallet_lock().then((result) => {
      if (result === true) {
        dispatch({
          type: ACTIONS.WALLET_LOCK_COMPLETED,
          result,
        });
      } else {
        dispatch({
          type: ACTIONS.WALLET_LOCK_FAILED,
          result,
        });
      }
    });
  };
}

// Collect all tips for a claim
export function doSupportAbandonForClaim(claimId, claimType, keep, preview) {
  return (dispatch) => {
    if (preview) {
      dispatch({
        type: ACTIONS.ABANDON_CLAIM_SUPPORT_PREVIEW,
      });
    } else {
      dispatch({
        type: ACTIONS.ABANDON_CLAIM_SUPPORT_STARTED,
      });
    }

    const params = { claim_id: claimId };
    if (preview) params['preview'] = true;
    if (keep) params['keep'] = keep;
    return Lbry.support_abandon(params)
      .then((res) => {
        if (!preview) {
          dispatchToast(dispatch, __('Successfully unlocked your tip!'), '', 'long', false);

          dispatch({
            type: ACTIONS.ABANDON_CLAIM_SUPPORT_COMPLETED,
            data: { claimId, txid: res.txid, effective: res.outputs[0].amount, type: claimType },
          });
          dispatch(doCheckPendingTxs());
        }
        return res;
      })
      .catch((e) => {
        dispatchToast(dispatch, __('Error unlocking your tip'), e.message || e, 'long');

        dispatch({
          type: ACTIONS.ABANDON_CLAIM_SUPPORT_FAILED,
          data: e.message,
        });
      });
  };
}

export function doWalletReconnect() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_RESTART,
    });
    let failed = false;
    // this basically returns null when it's done. :(
    // might be good to  dispatch ACTIONS.WALLET_RESTARTED
    const walletTimeout = setTimeout(() => {
      failed = true;
      dispatch({
        type: ACTIONS.WALLET_RESTART_COMPLETED,
      });
      dispatch(
        doToast({
          message: __('Your servers were not available. Check your url and port, or switch back to defaults.'),
          isError: true,
        })
      );
    }, FIFTEEN_SECONDS);
    Lbry.wallet_reconnect().then(() => {
      clearTimeout(walletTimeout);
      if (!failed) dispatch({ type: ACTIONS.WALLET_RESTART_COMPLETED });
    });
  };
}

export function doWalletDecrypt() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_DECRYPT_START,
    });

    Lbry.wallet_decrypt().then((result) => {
      if (result === true) {
        dispatch({
          type: ACTIONS.WALLET_DECRYPT_COMPLETED,
          result,
        });
      } else {
        dispatch({
          type: ACTIONS.WALLET_DECRYPT_FAILED,
          result,
        });
      }
    });
  };
}

export function doWalletStatus() {
  return (dispatch) => {
    dispatch({
      type: ACTIONS.WALLET_STATUS_START,
    });

    Lbry.wallet_status().then((status) => {
      if (status) {
        dispatch({
          type: ACTIONS.WALLET_STATUS_COMPLETED,
          result: status.is_encrypted,
        });
      }
    });
  };
}

export function doSetTransactionListFilter(filterOption) {
  return {
    type: ACTIONS.SET_TRANSACTION_LIST_FILTER,
    data: filterOption,
  };
}

export function doUpdateBlockHeight() {
  return (dispatch) =>
    Lbry.status().then((status) => {
      if (status.wallet) {
        dispatch({
          type: ACTIONS.UPDATE_CURRENT_HEIGHT,
          data: status.wallet.blocks,
        });
      }
    });
}

// Calls transaction_show on txes until any pending txes are confirmed
export const doCheckPendingTxs = () => (dispatch, getState) => {
  const state = getState();
  const pendingTxsById = selectPendingSupportTransactions(state); // {}
  const pendingOtherTxes = selectPendingOtherTransactions(state);

  if (!Object.keys(pendingTxsById).length && !pendingOtherTxes.length) {
    return;
  }
  let txCheckInterval;
  const checkTxList = () => {
    const state = getState();
    const pendingSupportTxs = selectPendingSupportTransactions(state); // {}
    const pendingConsolidateTxes = selectPendingOtherTransactions(state);
    const pendingConsTxid = selectPendingConsolidateTxid(state);
    const pendingMassCLaimTxid = selectPendingMassClaimTxid(state);

    const promises = [];
    const newPendingTxes = {};
    const noLongerPendingConsolidate = [];
    const types = new Set([]);
    // { claimId: {txid: 123, amount 12.3}, }
    const entries = Object.entries(pendingSupportTxs);
    entries.forEach(([claim, data]) => {
      promises.push(Lbry.transaction_show({ txid: data.txid }));
      types.add(data.type);
    });
    if (pendingConsolidateTxes.length) {
      pendingConsolidateTxes.forEach((txid) => promises.push(Lbry.transaction_show({ txid })));
    }

    Promise.all(promises).then((txShows) => {
      let changed = false;
      txShows.forEach((result) => {
        if (pendingConsolidateTxes.includes(result.txid)) {
          if (result.height > 0) {
            noLongerPendingConsolidate.push(result.txid);
          }
        } else {
          if (result.height <= 0) {
            const match = entries.find((entry) => entry[1].txid === result.txid);
            newPendingTxes[match[0]] = match[1];
          } else {
            changed = true;
          }
        }
      });

      if (changed) {
        dispatch({
          type: ACTIONS.PENDING_SUPPORTS_UPDATED,
          data: newPendingTxes,
        });
        if (types.has('channel')) {
          dispatch(doFetchChannelListMine());
        }
        if (types.has('stream')) {
          dispatch(doFetchClaimListMine());
        }
      }
      if (noLongerPendingConsolidate.length) {
        if (noLongerPendingConsolidate.includes(pendingConsTxid)) {
          dispatch(
            doToast({
              message: __('Your wallet is finished consolidating'),
            })
          );
        }
        if (noLongerPendingConsolidate.includes(pendingMassCLaimTxid)) {
          dispatch(
            doToast({
              message: __('Your tips have been collected'),
            })
          );
        }
        dispatch({
          type: ACTIONS.PENDING_CONSOLIDATED_TXOS_UPDATED,
          data: { txids: noLongerPendingConsolidate, remove: true },
        });
      }

      if (!Object.keys(pendingTxsById).length && !pendingOtherTxes.length) {
        clearInterval(txCheckInterval);
      }
    });
  };

  txCheckInterval = setInterval(() => {
    checkTxList();
  }, 30000);
};

export const doSendCashTip =
  (tipParams, anonymous, userParams, claimId, stripeEnvironment, preferredCurrency, successCallback) => (dispatch) => {
    Lbryio.call(
      'customer',
      'tip',
      {
        // round to fix issues with floating point numbers
        amount: Math.round(100 * tipParams.tipAmount), // convert from dollars to cents
        creator_channel_name: tipParams.tipChannelName, // creator_channel_name
        creator_channel_claim_id: tipParams.channelClaimId,
        tipper_channel_name: anonymous ? '' : userParams.activeChannelName,
        tipper_channel_claim_id: anonymous ? '' : userParams.activeChannelId,
        currency: preferredCurrency || 'USD',
        anonymous: anonymous,
        source_claim_id: claimId,
        environment: stripeEnvironment,
      },
      'post'
    )
      .then((customerTipResponse) => {
        const fiatSymbol = preferredCurrency === 'USD' ? '$' : '€';

        dispatch(
          doToast({
            message: __('Tip successfully sent.'),
            subMessage: __("I'm sure they appreciate it!"),
            linkText: `${fiatSymbol}${tipParams.tipAmount} ⇒ ${tipParams.tipChannelName}`,
            linkTarget: '/wallet',
          })
        );

        if (successCallback) successCallback(customerTipResponse);
      })
      .catch((error) => {
        // show error message from Stripe if one exists (being passed from backend by Beamer's API currently)
        dispatch(
          doToast({
            message: error.message || __('Sorry, there was an error in processing your payment!'),
            isError: true,
          })
        );
      });
  };

export const doPurchaseClaimForUri =
  ({ uri, transactionType }) =>
  async (dispatch, getState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const channelClaim = getChannelFromClaim(claim);

    if (!channelClaim) return Promise.resolve();

    const { claim_id: channelClaimId, name: tipChannelName } = channelClaim;

    const activeChannelClaim = selectActiveChannelClaim(state);
    const source_payment_address = selectAPIArweaveDefaultAddress(state);
    const arweaveTipData = selectArweaveTipDataForId(state, channelClaimId);

    const preferredCurrency = selectPreferredCurrency(state);

    const preorderTag = selectPreorderTagForUri(state, uri);
    const purchaseTag = selectPurchaseTagForUri(state, uri);
    const rentalTag = selectRentalTagForUri(state, uri);
    const tags = { rentalTag, purchaseTag, preorderTag };

    const itsARental = transactionType === 'rental';

    let tipAmount = 0;
    let rentTipAmount = 0;

    if (tags.purchaseTag && tags.rentalTag) {
      tipAmount = tags.purchaseTag;
      rentTipAmount = tags.rentalTag.price;
    } else if (tags.purchaseTag) {
      tipAmount = tags.purchaseTag;
    } else if (tags.rentalTag) {
      rentTipAmount = tags.rentalTag.price;
    } else if (tags.preorderTag) {
      tipAmount = tags.preorderTag;
    }

    const amountToUse = itsARental ? rentTipAmount : tipAmount;
    const expirationTime = itsARental ? tags.rentalTag.expirationTimeInSeconds : undefined;
    // if ()
    const isV2 = true;
    if (isV2) {
      try {
        const tipResponse = await Lbryio.call(
          'customer',
          'new_transaction',
          {
            // round to fix issues with floating point numbers
            amount: Math.round(100 * amountToUse), // convert from dollars to cents
            creator_channel_name: tipChannelName,
            creator_channel_claim_id: channelClaimId,
            ...(activeChannelClaim
              ? { tipper_channel_name: activeChannelClaim.name, tipper_channel_claim_id: activeChannelClaim.claim_id }
              : { anonymous: true }),
            currency: 'AR' || preferredCurrency || 'USD',
            environment: stripeEnvironment,
            source_claim_id: claim.claim_id,
            target_claim_id: claim.claim_id,
            type: transactionType,
            validity_seconds: expirationTime,
            receiver_address: arweaveTipData.address,
            sender_address: source_payment_address,
            v2: true,
          },
          'post'
        );
        const { token, transaction_amount } = tipResponse;

        const tags = [
          { name: 'X-O-Ref', value: token },
        ];
        const transferTxid = await sendWinstons(arweaveTipData.address, String(transaction_amount), tags);

        await Lbryio.call(
          'customer',
          'new_transaction',
          {
            // round to fix issues with floating point numbers
            amount: Math.round(100 * amountToUse), // convert from dollars to cents
            creator_channel_name: tipChannelName,
            creator_channel_claim_id: channelClaimId,
            ...(activeChannelClaim
              ? { tipper_channel_name: activeChannelClaim.name, tipper_channel_claim_id: activeChannelClaim.claim_id }
              : { anonymous: true }),
            currency: 'AR' || preferredCurrency || 'AR',
            environment: stripeEnvironment,
            source_claim_id: claim.claim_id,
            target_claim_id: claim.claim_id,
            type: transactionType,
            validity_seconds: expirationTime,
            receiver_address: arweaveTipData.address,
            sender_address: source_payment_address,
            token: token,
            tx_id: transferTxid,
            v2: true,
          },
          'post'
        );

        const STRINGS = {
          purchase: {
            title: 'Purchase completed successfully',
            subtitle: 'Enjoy!',
          },
          preorder: {
            title: 'Preorder completed successfully',
            subtitle: "You will be able to see the content as soon as it's available!",
          },
          rental: {
            title: 'Rental completed successfully',
            subtitle: 'Enjoy!',
          },
        };

        const stringsToUse = STRINGS[transactionType];

        dispatch(doToast({ message: __(stringsToUse.title), subMessage: __(stringsToUse.subtitle) }));
        return;
      } catch (error) {
        console.error('error', error);
        dispatch(
          doToast({
            message: error.message || __('Sorry, there was an error in processing your payment!'),
            isError: true,
          })
        );
        return;
      }
    }

    return Lbryio.call(
      'customer',
      'new_transaction',
      {
        // round to fix issues with floating point numbers
        amount: Math.round(100 * amount), // convert from dollars to cents
        creator_channel_name: tipChannelName,
        creator_channel_claim_id: channelClaimId,
        ...(activeChannelClaim
          ? { tipper_channel_name: activeChannelClaim.name, tipper_channel_claim_id: activeChannelClaim.claim_id }
          : { anonymous: true }),
        currency: preferredCurrency || 'USD',
        environment: stripeEnvironment,
        source_claim_id: claim.claim_id,
        target_claim_id: claim.claim_id,
        type: transactionType,
        validity_seconds: expirationTime,
      },
      'post'
    )
      .then((customerTipResponse) => {
        const STRINGS = {
          purchase: {
            title: 'Purchase completed successfully',
            subtitle: 'Enjoy!',
          },
          preorder: {
            title: 'Preorder completed successfully',
            subtitle: "You will be able to see the content as soon as it's available!",
          },
          rental: {
            title: 'Rental completed successfully',
            subtitle: 'Enjoy!',
          },
        };

        const stringsToUse = STRINGS[transactionType];

        dispatch(doToast({ message: __(stringsToUse.title), subMessage: __(stringsToUse.subtitle) }));
      })
      .catch((error) => {
        dispatch(
          doToast({
            message: error.message || __('Sorry, there was an error in processing your payment!'),
            isError: true,
          })
        );
      });
  };
