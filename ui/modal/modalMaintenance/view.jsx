// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';

type Props = {
  doHideModal: () => void,
};

class ModalMaintenance extends React.PureComponent<Props> {
  render() {
    const { doHideModal } = this.props;

    return (
      <Modal type="card" isOpen onAborted={doHideModal}>
        <Card
          title={__('Maintenance')}
          subtitle={__('Uploads and Posts are disabled at the moment. Please check back later.')}
        />
      </Modal>
    );
  }
}

export default ModalMaintenance;
