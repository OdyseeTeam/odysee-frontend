import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Button from 'component/button';
import FileList from 'component/common/file-list';
import { history } from 'redux/router';
type Props = {
  files: Array<WebFile>;
  hideModal: () => void;
  updatePublishForm: (arg0: UpdatePublishState) => void;
};
const PUBLISH_URL = `/$/${PAGES.UPLOAD}`;

const ModalFileSelection = (props: Props) => {
  const { files, hideModal, updatePublishForm } = props;
  const [selectedFile, setSelectedFile] = React.useState(null);
  const navigateToPublish = React.useCallback(() => {
    // Navigate only if location is not publish area:
    // - Prevent spam in history
    if (history.location.pathname !== PUBLISH_URL) {
      history.push(PUBLISH_URL);
    }
  }, [history]);

  function handleCloseModal() {
    hideModal();
    setSelectedFile(null);
  }

  function handleSubmit() {
    updatePublishForm({
      filePath: selectedFile,
    });
    handleCloseModal();
    navigateToPublish();
  }

  const handleFileChange = (file?: WebFile) => {
    setSelectedFile(file);
  };

  return (
    <Modal isOpen type="card" onAborted={handleCloseModal} onConfirmed={handleCloseModal}>
      <Card
        icon={ICONS.PUBLISH}
        title={__('Choose a file')}
        subtitle={__('Only one file is allowed, choose wisely:')}
        actions={
          <div>
            <div>
              <FileList files={files} onChange={handleFileChange} />
            </div>
            <div className="section__actions">
              <Button
                disabled={!selectedFile || !files || !files.length}
                button="primary"
                label={__('Accept')}
                onClick={handleSubmit}
              />
              <Button button="link" label={__('Cancel')} onClick={handleCloseModal} />
            </div>
          </div>
        }
      />
    </Modal>
  );
};
export default ModalFileSelection;
