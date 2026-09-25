import * as PAGES from 'constants/pages';
import React from 'react';
import { Modal } from 'modal/modal';
import ClaimPreview from 'component/claimPreview';
import Button from 'component/button';
import Card from 'component/common/card';
import Nag from 'component/nag';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';
import { navigateTo } from 'redux/router';

type Props = {
  uri: string;
  isEdit: boolean;
  filePath: undefined;
};

function ModalPublishSuccess(props: Props) {
  const { uri, isEdit, filePath } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));

  const closeModal = () => dispatch(doHideModal());

  const livestream = claim && claim.value && claim.value_type === 'stream' && !claim.value.source;
  let contentLabel;

  if (livestream) {
    contentLabel = __('Livestream Created');
  } else if (isEdit) {
    contentLabel = __('Update published');
  } else {
    contentLabel = __('File published');
  }

  let publishMessage;

  if (isEdit) {
    publishMessage = __('Your update is now pending. It will take a few minutes to appear for other users.');
  } else if (livestream) {
    publishMessage = __(
      'Your livestream is now pending. You will be able to start shortly at the streaming dashboard.'
    );
  } else {
    publishMessage = __('Your content will be live shortly.');
  }

  function handleClose() {
    closeModal();
  }

  return (
    <Modal isOpen type="card" contentLabel={__(contentLabel)} onAborted={handleClose}>
      <Card
        title={livestream ? __('Livestream Created') : __('Success')}
        subtitle={publishMessage}
        body={
          <React.Fragment>
            <div className="card--inline">
              <ClaimPreview type="small" uri={uri} />
            </div>
          </React.Fragment>
        }
        actions={
          <div className="section__actions">
            {!livestream && (
              <Button
                button="primary"
                label={__('View My Uploads')}
                onClick={() => {
                  navigateTo(`/$/${PAGES.UPLOADS}`);
                  closeModal();
                }}
              />
            )}
            {livestream && (
              <Button
                button="primary"
                label={__('View Livestream Settings')}
                onClick={() => {
                  navigateTo(`/$/${PAGES.LIVESTREAM}?t=Setup`);
                  closeModal();
                }}
              />
            )}
            <Button button="link" label={__('Close')} onClick={handleClose} />
          </div>
        }
      />
    </Modal>
  );
}

export default ModalPublishSuccess;
