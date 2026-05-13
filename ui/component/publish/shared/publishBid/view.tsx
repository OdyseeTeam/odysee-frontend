import { MINIMUM_PUBLISH_BID, ESTIMATED_FEE } from 'constants/claim';
import React, { useState, useEffect } from 'react';
import { FormField } from 'component/common/form';
import BidHelpText from './bid-help-text';
import Card from 'component/common/card';
import LbcSymbol from 'component/common/lbc-symbol';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import {
  selectPublishFormValue,
  selectMyClaimForUri,
  selectIsResolvingPublishUris,
  selectTakeOverAmount,
} from 'redux/selectors/publish';
import { doUpdatePublishForm } from 'redux/actions/publish';
import './style.scss';
type Props = {};

function PublishBid(props: Props) {
  const dispatch = useAppDispatch();
  const name = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const bid = useAppSelector((state) => selectPublishFormValue(state, 'bid'));
  const isResolvingUri = useAppSelector((state) => selectIsResolvingPublishUris(state));
  const balance = useAppSelector((state) => selectBalance(state));
  const myClaimForUri = useAppSelector((state) => (selectMyClaimForUri as any)(state, true));
  const amountNeededForTakeover = useAppSelector((state) => selectTakeOverAmount(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const [bidError, setBidError] = useState<string | undefined>(undefined);
  const previousBidAmount = myClaimForUri && Number(myClaimForUri.amount);
  const showDepositField = Boolean(myClaimForUri);
  useEffect(() => {
    if (!previousBidAmount || bid < MINIMUM_PUBLISH_BID) {
      updatePublishForm({
        bid: MINIMUM_PUBLISH_BID,
      });
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const totalAvailableBidAmount = previousBidAmount ? previousBidAmount + balance : balance;
    let bidError;

    if (bid === 0) {
      bidError = __('Deposit cannot be 0');
    } else if (bid < MINIMUM_PUBLISH_BID) {
      bidError = __('Your deposit must be higher');
    } else if (totalAvailableBidAmount < bid) {
      bidError = __('Deposit cannot be higher than your available balance: %balance%', {
        balance: totalAvailableBidAmount,
      });
    } else if (totalAvailableBidAmount - bid < ESTIMATED_FEE) {
      bidError = __('Please decrease your deposit to account for transaction fees');
    }

    setBidError(bidError);
    dispatch(
      doUpdatePublishForm({
        bidError: bidError,
      })
    );
  }, [bid, previousBidAmount, balance, dispatch]);
  return showDepositField ? (
    <Card
      className={!name ? 'disabled' : ''}
      actions={
        <div className="publish-bid__row">
          <div className="publish-bid__input">
            <FormField
              type="number"
              name="content_bid"
              min={0}
              step="any"
              placeholder="0.123"
              className="form-field--price-amount"
              label={<LbcSymbol postfix={__('Deposit')} />}
              value={bid}
              error={bidError}
              onChange={(event) =>
                updatePublishForm({
                  bid: parseFloat(event.target.value),
                })
              }
              onWheel={(e) => e.stopPropagation()}
            />
            <WalletSpendableBalanceHelp inline />
          </div>
          <div className="publish-bid__helper">
            <span className="help">
              <BidHelpText
                uri={'lbry://' + name}
                amountNeededForTakeover={amountNeededForTakeover}
                isResolvingUri={isResolvingUri}
              />
            </span>
          </div>
        </div>
      }
    />
  ) : null;
}

export default PublishBid;
