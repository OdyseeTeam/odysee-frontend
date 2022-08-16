// @flow
import React from 'react';

import { Modal } from 'modal/modal';

import Card from 'component/common/card';
import Button from 'component/button';
import StripeCard from 'component/settingsStripeCard';

type Props = {
  doHideModal: () => void,
};

const ModalStripeCard = (props: Props) => {
  const { doHideModal } = props;

  return (
    <Modal onAborted={doHideModal} isOpen type="card">
      <Card
        body={<StripeCard />}
        actions={
          <div className="section__actions">
            <Button button="primary" label={__('OK')} onClick={doHideModal} />

            <Button button="link" label={__('Cancel')} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
};

export default ModalStripeCard;
