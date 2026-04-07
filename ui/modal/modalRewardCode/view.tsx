import React, { useState, useCallback } from 'react';
import { FormField, Form } from 'component/common/form';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';
import REWARDS from 'rewards';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { makeSelectClaimRewardError, makeSelectIsRewardClaimPending } from 'redux/selectors/rewards';
import { doHideModal } from 'redux/actions/app';
import { doClaimRewardType } from 'redux/actions/rewards';

function ModalRewardCode() {
  const dispatch = useAppDispatch();
  const rewardIsPending = useAppSelector((state) =>
    makeSelectIsRewardClaimPending()(state, { reward_type: REWARDS.TYPE_REWARD_CODE })
  );
  const error = useAppSelector((state) =>
    makeSelectClaimRewardError()(state, { reward_type: REWARDS.TYPE_REWARD_CODE })
  );

  const [rewardCode, setRewardCode] = useState('');

  const closeModal = () => dispatch(doHideModal());

  const handleSubmit = useCallback(() => {
    dispatch(
      doClaimRewardType(REWARDS.TYPE_REWARD_CODE, {
        params: { code: rewardCode },
      })
    );
  }, [dispatch, rewardCode]);

  return (
    <Modal isOpen contentLabel={__('Enter credits code')} type="card" onAborted={closeModal}>
      <Card
        title={__('Enter credits code')}
        subtitle={
          <I18nMessage
            tokens={{
              lbc: <LbcSymbol prefix={__('Redeem a custom credits code for')} />,
            }}
          >
            %lbc%. %learn_more%.
          </I18nMessage>
        }
        actions={
          <>
            <Form onSubmit={handleSubmit}>
              <FormField
                autoFocus
                type="text"
                name="reward-code"
                inputButton={
                  <Button
                    button="primary"
                    type="submit"
                    disabled={!rewardCode || rewardIsPending}
                    label={rewardIsPending ? __('Redeeming') : __('Redeem')}
                  />
                }
                label={__('Code')}
                placeholder="0123abc"
                error={error}
                value={rewardCode}
                onChange={(e) => setRewardCode(e.target.value)}
              />
            </Form>
            <div className="card__actions">
              <Button button="link" label={__('Cancel')} onClick={closeModal} />
            </div>
          </>
        }
      />
    </Modal>
  );
}

export default ModalRewardCode;
