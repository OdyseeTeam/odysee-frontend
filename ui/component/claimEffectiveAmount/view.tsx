import React from 'react';
import CreditAmount from 'component/common/credit-amount';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
};

function ClaimEffectiveAmount(props: Props) {
  const { uri } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri, true));

  if (!claim) {
    return null;
  }

  return <CreditAmount amount={Number(claim.repost_bid_amount || claim.meta.effective_amount || claim.amount)} />;
}

export default ClaimEffectiveAmount;
