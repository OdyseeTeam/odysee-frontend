// @flow
import React from 'react';
import { Modal } from 'modal/modal';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import usePersistedState from 'effects/use-persisted-state';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import LbcSymbol from 'component/common/lbc-symbol';

type Props = {
  uri: string,
  claim: StreamClaim,
  claimIsMine: boolean,
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
  const { uri, claimIsMine, doResolveUri, closeModal, deleteFile, doGoBack = true, title, claim, isAbandoning } = props;
  const [abandonChecked, setAbandonChecked] = usePersistedState('modal-remove-file:abandon', true);

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
        body={
          <React.Fragment>
            {claimIsMine && (
              <React.Fragment>
                <FormField
                  name="claim_abandon"
                  label={
                    <I18nMessage tokens={{ lbc: <LbcSymbol postfix={claim.amount} /> }}>
                      Remove from blockchain (%lbc%)
                    </I18nMessage>
                  }
                  type="checkbox"
                  checked={abandonChecked}
                  onChange={() => setAbandonChecked(!abandonChecked)}
                />
                {abandonChecked === true && (
                  <p className="help error__text">{__('This action is permanent and cannot be undone')}</p>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        }
        actions={
          <>
            <div className="section__actions">
              <Button
                button="primary"
                label={isAbandoning ? __('Removing...') : __('OK')}
                disabled={isAbandoning || !abandonChecked}
                onClick={() => deleteFile(uri, true, claimIsMine ? abandonChecked : false, doGoBack, claim)}
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
