// @flow
import React from 'react';
import Card from 'component/common/card';
import FormNewCollection from 'component/formNewCollection';

type Props = {
  closeModal: () => void,
  doToast: (params: { message: string, linkText: string, linkTarget: string }) => void,
};

const CollectionCreate = (props: Props) => {
  const { closeModal, doToast } = props;

  function handleClose(newCollectionName: string, newCollectionId: string) {
    closeModal();
    doToast({
      message: __('Succesfully created "%playlist_name%"', { playlist_name: newCollectionName }),
      subMessage: __('You can now add content to this playlist using the Save button while viewing content.'),
      linkText: __('View Page'),
      linkTarget: `/playlist/${newCollectionId}`,
    });
  }

  return <Card singlePane actions={<FormNewCollection closeForm={handleClose} onlyCreate />} />;
};

export default CollectionCreate;
