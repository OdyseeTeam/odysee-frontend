import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import Icon from 'component/common/icon';
import RewardLink from 'component/rewardLink';
import Button from 'component/button';
import Card from 'component/common/card';
import rewards from 'rewards';
import LbcMessage from 'component/common/lbc-message';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectUser } from 'redux/selectors/user';
import { doOpenModal } from 'redux/actions/app';
type Props = {
  reward: {
    id: string;
    reward_title: string;
    reward_amount: number;
    reward_range?: string;
    transaction_id: string;
    created_at: string;
    reward_description: string;
    reward_type: string;
    claim_code: string;
  };
  disabled?: boolean;
};

const RewardTile = (props: Props) => {
  const { reward, disabled = false } = props;
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const openRewardCodeModal = () => dispatch(doOpenModal(MODALS.REWARD_GENERATED_CODE));
  const openSetReferrerModal = () => dispatch(doOpenModal(MODALS.SET_REFERRER));
  const referrerSet = user && user.invited_by_id;
  const claimed = !!reward.transaction_id;
  const customActionsRewards = [rewards.TYPE_REFERRAL, rewards.TYPE_REFEREE];
  return (
    <Card
      title={__(reward.reward_title)}
      subtitle={<LbcMessage>{reward.reward_description}</LbcMessage>}
      actions={
        <div className="section__actions">
          {reward.reward_type === rewards.TYPE_GENERATED_CODE && (
            <Button button="primary" onClick={openRewardCodeModal} label={__('Enter Code')} disabled={disabled} />
          )}
          {reward.reward_type === rewards.TYPE_REFERRAL && (
            <Button
              button="primary"
              navigate="/$/invite"
              label={__('Go To Invites')}
              aria-hidden={disabled}
              tabIndex={disabled ? -1 : 0}
            />
          )}
          {reward.reward_type === rewards.TYPE_REFEREE && (
            <>
              {referrerSet && <RewardLink button reward_type={reward.reward_type} disabled={disabled} />}
              <Button
                button={referrerSet ? 'link' : 'primary'}
                onClick={openSetReferrerModal}
                label={referrerSet ? __('Change Inviter') : __('Set Inviter')}
                disabled={disabled}
              />
            </>
          )}
          {!customActionsRewards.some((i) => i === reward.reward_type) &&
            (claimed ? (
              <span>
                <Icon icon={ICONS.COMPLETED} /> {__('Credit claimed.')}
              </span>
            ) : (
              <RewardLink button claim_code={reward.claim_code} disabled={disabled} />
            ))}
        </div>
      }
    />
  );
};

export default RewardTile;
