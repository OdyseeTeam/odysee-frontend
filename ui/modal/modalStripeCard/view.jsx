// @flow
import React from 'react';

import { Modal } from 'modal/modal';

import Card from 'component/common/card';
import Button from 'component/button';
import StripeCard from 'component/settingsStripeCard';

type Props = {
  previousModal?: string, // in case this modal was called from another modal
  previousProps?: any,
  // -- redux --
  hasSavedCard: boolean,
  doHideModal: () => void,
  doOpenModal: (modalType: string, props?: any) => void,
};

const ModalStripeCard = (props: Props) => {
  const { previousModal, previousProps, hasSavedCard, doHideModal, doOpenModal } = props;

  const [isBusy, setIsBusy] = React.useState();

  function handleGoBack() {
    doHideModal();
    // makes sense to open previous and continue only on confirm,
    // in case I give up, close/cancel will just abort
    if (previousModal) doOpenModal(previousModal, previousProps);
  }

  function handleConfirm() {
    doHideModal();
    // makes sense to open previous and continue only on confirm,
    // in case I give up, close/cancel will just abort
    if (previousModal) doOpenModal(previousModal, previousProps);
  }

  return (
    <Modal onAborted={isBusy ? undefined : doHideModal} isOpen type="card" className="modal--add-card">
      <Card
        title={
          hasSavedCard
            ? __('Card Details')
            : window.cordova && !window.odysee.build.googlePlay
            ? __('Add your Card')
            : __("We're sorry")
        }
        body={
          window.cordova && !window.odysee.build.googlePlay ? (
            <StripeCard setIsBusy={setIsBusy} isModal />
          ) : (
            __(
              'Unfortunately Google does not allow us to process payments in this version of the app. You can get a more open version of the app at https://apk.odysee.tv or F-Droid. Alternatively you can also just visit Odysee.com in a browser.'
            )
          )
        }
        actions={
          <div className="section__actions">
            {window.cordova && !window.odysee.build.googlePlay && (
              <Button button="primary" label={__('OK')} onClick={handleConfirm} disabled={isBusy || !hasSavedCard} />
            )}
            <Button button="link" label={__('Cancel')} onClick={doHideModal} disabled={isBusy} />
          </div>
        }
      />
    </Modal>
  );
};

export default ModalStripeCard;
