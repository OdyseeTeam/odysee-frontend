import React from 'react';
import { FormField } from 'component/common/form';
import { buildURI, isNameValid } from 'util/lbryURI';
import BidHelpText from 'component/common/bid-help-text';
import Card from 'component/common/card';
import LbcSymbol from 'component/common/lbc-symbol';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBalance } from 'redux/selectors/wallet';
import { selectIsResolvingPublishUris } from 'redux/selectors/publish';
import { selectTakeOverAmountForName } from 'redux/selectors/claims';
import { doResolveUri } from 'redux/actions/claims';

type Props = {
  params: any;
  bidError: string | null | undefined;
  onChange: () => void;
};

function PublishName(props: Props) {
  const { params, bidError, onChange } = props;
  const { name, bid } = params;

  const dispatch = useAppDispatch();
  const balance = useAppSelector(selectBalance);
  const isResolvingUri = useAppSelector(selectIsResolvingPublishUris);
  const amountNeededForTakeover = useAppSelector((state) => selectTakeOverAmountForName(state, name));

  React.useEffect(() => {
    if (name && isNameValid(name))
      dispatch(
        doResolveUri(
          buildURI(
            {
              streamName: name,
            },
            true
          ),
          true
        )
      );
  }, [dispatch, name]);
  return (
    <Card
      actions={
        <FormField
          className="form-field--price-amount"
          type="number"
          name="content_bid"
          step="any"
          min="0.0"
          placeholder={0.1}
          label={<LbcSymbol postfix={__('Deposit')} size={14} />}
          value={bid}
          error={bidError}
          onChange={onChange}
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
  );
}

export default PublishName;
