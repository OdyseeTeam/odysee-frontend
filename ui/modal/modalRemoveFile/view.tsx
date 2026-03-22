import React from 'react';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { selectTitleForUri, makeSelectClaimForUri, makeSelectIsAbandoningClaimForUri } from 'redux/selectors/claims';
import { doHideModal } from 'redux/actions/app';
import { doResolveUri } from 'redux/actions/claims';
import { doDeleteFileAndMaybeGoBack } from 'redux/actions/file';
type Props = {
  uri: string;
  doGoBack: boolean;
  fileInfo?: {
    outpoint: string | null | undefined;
  };
};

function ModalRemoveFile(props: Props) {
  const { uri, doGoBack = true } = props;
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  const claim = useAppSelector((state) => makeSelectClaimForUri(uri)(state));
  const isAbandoning = useAppSelector((state) => makeSelectIsAbandoningClaimForUri(uri)(state));
  const closeModal = () => dispatch(doHideModal());

  React.useEffect(() => {
    if (uri) {
      dispatch(doResolveUri(uri));
    }
  }, [uri, dispatch]);
  return (
    <Modal isOpen contentLabel={__('Confirm File Remove')} type="card" onAborted={closeModal}>
      <Card
        title={__('Remove File')}
        subtitle={
          <I18nMessage
            tokens={{
              title: <cite>{`"${title}"`}</cite>,
            }}
          >
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
                onClick={() => dispatch(doDeleteFileAndMaybeGoBack(uri, false, true, doGoBack, claim))}
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
