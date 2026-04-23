import React from 'react';
import Button from 'component/button';
import LbcMessage from 'component/common/lbc-message';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { makeSelectRewardByClaimCode, makeSelectIsRewardClaimPending } from 'redux/selectors/rewards';
import { doClaimRewardType } from 'redux/actions/rewards';
type Reward = {
  reward_amount: number;
  reward_range: string;
  reward_type: string;
  claim_code: string;
};
type Props = {
  claim_code?: string;
  reward_type?: string;
  label?: string | null;
  button?: boolean | null;
  disabled?: boolean;
};

const RewardLink = (props: Props) => {
  const { claim_code, label, button, disabled = false } = props;
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((state) => makeSelectIsRewardClaimPending()(state, props));
  const reward = useAppSelector((state) => makeSelectRewardByClaimCode()(state, claim_code));
  const claimReward = (r: Reward) =>
    dispatch(
      doClaimRewardType(r.reward_type, {
        notifyError: true,
        params: { claim_code: r.claim_code },
      })
    );
  let displayLabel = label;

  if (isPending) {
    displayLabel = __('Claiming...');
  } else if (label) {
    displayLabel = label;
  } else if (reward && reward.reward_range && reward.reward_range.includes('-')) {
    displayLabel = __('Claim %range% LBC', {
      range: reward.reward_range,
    });
  } else if (reward && reward.reward_amount > 0) {
    displayLabel = __('Claim %amount% LBC', {
      amount: reward.reward_amount,
    });
  } else {
    displayLabel = __('Claim ??? LBC');
  }

  return !reward ? null : (
    <Button
      button={button ? 'primary' : 'link'}
      disabled={disabled || isPending}
      label={<LbcMessage>{displayLabel}</LbcMessage>}
      aria-label={displayLabel}
      onClick={() => {
        claimReward(reward);
      }}
    />
  );
};

export default RewardLink;
