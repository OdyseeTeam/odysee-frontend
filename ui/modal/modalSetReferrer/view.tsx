import React, { useState, useCallback } from 'react';
import { FormField, Form } from 'component/common/form';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import Card from 'component/common/card';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectSetReferrerError, selectSetReferrerPending } from 'redux/selectors/user';
import { doHideModal } from 'redux/actions/app';
import { doUserSetReferrerForUri, doUserSetReferrerReset } from 'redux/actions/user';

type Props = {
  rewardIsPending: boolean;
};

function ModalSetReferrer(props: Props) {
  const { rewardIsPending } = props;
  const dispatch = useAppDispatch();
  const referrerSetPending = useAppSelector(selectSetReferrerPending);
  const referrerSetError = useAppSelector(selectSetReferrerError);

  const [referrer, setReferrer] = useState('');

  const closeModal = () => dispatch(doHideModal());

  const handleSubmit = useCallback(() => {
    dispatch(doUserSetReferrerForUri(referrer));
  }, [dispatch, referrer]);

  const handleClose = useCallback(() => {
    if (referrerSetError) {
      dispatch(doUserSetReferrerReset());
    }
    closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrerSetError, dispatch]);

  const handleTextChange = useCallback(
    (e: React.SyntheticEvent<any>) => {
      setReferrer((e.target as HTMLInputElement).value);
      if (referrerSetError) {
        dispatch(doUserSetReferrerReset());
      }
    },
    [referrerSetError, dispatch]
  );

  return (
    <Modal isOpen contentLabel={__('Enter inviter')} type="card" onAborted={closeModal}>
      <Card
        title={__('Enter inviter')}
        subtitle={<React.Fragment>{__('Did someone invite you to use Odysee? Tell us who!')}</React.Fragment>}
        actions={
          <React.Fragment>
            <Form onSubmit={handleSubmit}>
              <FormField
                autoFocus
                type="text"
                name="referrer-code"
                inputButton={
                  <Button button="primary" type="submit" disabled={!referrer || rewardIsPending} label={__('Set')} />
                }
                label={__('Code or channel')}
                placeholder="0123abc"
                value={referrer}
                onChange={handleTextChange}
                error={!referrerSetPending && referrerSetError}
              />
            </Form>
            <div className="card__actions">
              <Button button="primary" label={__('Done')} onClick={handleClose} />
            </div>
          </React.Fragment>
        }
      />
    </Modal>
  );
}

export default ModalSetReferrer;
