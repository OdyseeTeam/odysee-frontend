// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';

type Props = {
  uri: string,
  claim: StreamClaim,
  doResolveUri: (string) => void,
  closeModal: () => void,
  deleteFile: (string, boolean, boolean, boolean, any) => void,
  doGoBack: boolean,
  title: string,
  fileInfo?: {
    outpoint: ?string,
  },
  isAbandoning: boolean,
};

function ModalRemoveFile(props: Props) {
  const { uri, doResolveUri, closeModal, deleteFile, doGoBack = true, title, claim, isAbandoning } = props;

  React.useEffect(() => {
    if (uri) {
      doResolveUri(uri);
    }
  }, [uri, doResolveUri]);

  return (
    <Modal isOpen contentLabel={__('Confirm File Remove')} type="card" onAborted={closeModal}>
      <Card
        title={__('Remove File')}
        subtitle={
          <I18nMessage tokens={{ title: <cite>{`"${title}"`}</cite> }}>
            Are you sure you'd like to remove %title%?
          </I18nMessage>
        }
        body={<p className="help error__text">{__('This action is permanent and cannot be undone')}</p>}
        actions={
          <>
            <div className="section__actions">
              <Button
                button="primary"
                label={isAbandoning ? __('Removing...') : __('Remove')}
                disabled={isAbandoning}
                onClick={() => deleteFile(uri, false, true, doGoBack, claim)}
              />
              <Button button="link" label={__('Cancel')} onClick={closeModal} />
            </div>
            <p className="help">{__('These changes will appear shortly.')}</p>
          </>
        }
      />
    </Modal>
  );
}

export default ModalRemoveFile;
