// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';

type Props = {
  closeModal: () => void,
  uri: string,
  claimIsMine: boolean,
  isSupport: boolean,
};

class modalGuidelines extends React.PureComponent<Props> {
  render() {
    const { closeModal } = this.props;

    // console.log('Test');
    return (
      <Modal ariaHideApp={false} isOpen type="custom" onAborted={closeModal}>
        By publishing or commenting, you agree to the <a href="ff.html">Odysee community guidelines.</a>
        <br />
        <br />
        <Button button="primary" label={__('I understand')} onClick={() => closeModal()} />
      </Modal>
    );
  }
}

export default modalGuidelines;
