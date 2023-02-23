// @flow
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal } from 'modal/modal';
import Button from 'component/button';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import { FormField } from 'component/common/form';

type Props = {
  collectionId: string,
  simplify?: boolean,
  // --- redux ---
  hasClaim: boolean,
  collectionName: string,
  redirect: ?string,
  collectionKey: ?string,
  doHideModal: () => void,
  doCollectionDelete: (id: string, collectionKey: ?string, keepPrivate: boolean) => void,
};

function ModalRemoveCollection(props: Props) {
  const { simplify, hasClaim, collectionId, collectionName, redirect, collectionKey, doHideModal, doCollectionDelete } =
    props;

  const { replace } = useHistory();

  const [confirmName, setConfirmName] = useState('');
  const [keepPrivate, setKeepPrivate] = useState(false);

  function getBody() {
    if (simplify) {
      return (
        <>
          <p>{__('This will permanently delete the list.')}</p>
          <p>{`"${collectionName}"`}</p>
        </>
      );
    } else {
      return hasClaim ? (
        <>
          <p>{__('This will permanently delete the list.')}</p>
          <p>{__('Type "%list_name%" to confirm.', { list_name: collectionName })}</p>
          <FormField value={confirmName} type={'text'} onChange={(e) => setConfirmName(e.target.value)} />
          <FormField
            name="keep-private"
            type="checkbox"
            label={__('Delete publish but keep private playlist')}
            checked={keepPrivate}
            onChange={() => setKeepPrivate((prev) => !prev)}
          />
        </>
      ) : (
        <I18nMessage tokens={{ title: <cite>{`"${collectionName}"`}</cite> }}>
          Are you sure you'd like to delete %title%?
        </I18nMessage>
      );
    }
  }

  return (
    <Modal isOpen contentLabel={__('Confirm Playlist Unpublish')} type="card" onAborted={doHideModal}>
      <Card
        title={__('Delete Playlist')}
        body={
          <>
            {getBody()}
            <p className="help error__text">{__('This action is permanent and cannot be undone')}</p>
          </>
        }
        actions={
          <div className="section__actions">
            <Button
              button="primary"
              label={__('Delete')}
              disabled={!simplify && hasClaim && collectionName !== confirmName}
              onClick={() => {
                if (redirect) replace(redirect);
                doCollectionDelete(collectionId, hasClaim ? undefined : collectionKey, keepPrivate);
                doHideModal();
              }}
            />
            <Button button="link" label={__('Cancel')} onClick={doHideModal} />
          </div>
        }
      />
    </Modal>
  );
}

export default ModalRemoveCollection;
