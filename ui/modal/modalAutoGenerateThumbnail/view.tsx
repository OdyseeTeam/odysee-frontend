import React, { Suspense } from 'react';
import { Modal } from 'modal/modal';
import { useAppDispatch } from 'redux/hooks';
import { doHideModal } from 'redux/actions/app';
import Spinner from 'component/spinner';
import { lazyImport } from 'util/lazyImport';

const ThumbnailPicker = lazyImport(() => import('component/thumbnailPicker'));

type Props = {
  filePath: string | File;
};

function ModalAutoGenerateThumbnail(props: Props) {
  const { filePath } = props;
  const dispatch = useAppDispatch();
  const closeModal = () => dispatch(doHideModal());

  // ThumbnailPicker requires a File object for BlobSource
  const file = typeof filePath === 'string' ? null : filePath;

  return (
    <Modal
      isOpen
      title={__('Choose a thumbnail')}
      contentLabel={__('Choose Thumbnail')}
      type="card"
      onAborted={closeModal}
    >
      {file ? (
        <Suspense
          fallback={
            <div className="main--empty empty">
              <Spinner type="small" />
            </div>
          }
        >
          <ThumbnailPicker filePath={file} onThumbnailSelected={closeModal} />
        </Suspense>
      ) : (
        <p className="help">{__('Thumbnail generation from video snapshots is only available for file uploads.')}</p>
      )}
    </Modal>
  );
}

export default ModalAutoGenerateThumbnail;
