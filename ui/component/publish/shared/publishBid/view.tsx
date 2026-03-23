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
type Props = {};

function PublishBid(props: Props) {
  const dispatch = useAppDispatch();
  const name = useAppSelector((state) => selectPublishFormValue(state, 'name'));
  const bid = useAppSelector((state) => selectPublishFormValue(state, 'bid'));
  const isResolvingUri = useAppSelector((state) => selectIsResolvingPublishUris(state));
  const balance = useAppSelector((state) => selectBalance(state));
  const myClaimForUri = useAppSelector((state) => selectMyClaimForUri(state));
  const amountNeededForTakeover = useAppSelector((state) => selectTakeOverAmount(state));
  const updatePublishForm = (value: UpdatePublishState) => dispatch(doUpdatePublishForm(value));
  const [bidError, setBidError] = useState(undefined);
  const previousBidAmount = myClaimForUri && Number(myClaimForUri.amount);
  const [bidHasExceededDefaultAmount] = React.useState(previousBidAmount && previousBidAmount > MINIMUM_PUBLISH_BID);
  useEffect(() => {
    if (!previousBidAmount || bid < MINIMUM_PUBLISH_BID) {
      updatePublishForm({
        bid: parseFloat(MINIMUM_PUBLISH_BID),
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
    updatePublishForm({
      bidError: bidError,
    });
  }, [bid, previousBidAmount, balance, updatePublishForm]);
  return bidHasExceededDefaultAmount ? (
    <Card
      className={!name ? 'disabled' : ''}
      actions={
        <FormField
          type="number"
          name="content_bid"
          min="0"
          step="any"
          placeholder="0.123"
          className="form-field--price-amount"
          label={<LbcSymbol disabled={!name} postfix={__('Deposit')} size={12} />}
          value={bid}
          error={bidError}
          onChange={(event) =>
            updatePublishForm({
              bid: parseFloat(event.target.value),
            })
          }
          onWheel={(e) => e.stopPropagation()}
          helper={
            <>
              <BidHelpText
                uri={'lbry://' + name}
                amountNeededForTakeover={amountNeededForTakeover}
                isResolvingUri={isResolvingUri}
              />
              <WalletSpendableBalanceHelp inline />
            </>
          }
        />
      }
    />
  ) : null;
}

export default PublishBid;
