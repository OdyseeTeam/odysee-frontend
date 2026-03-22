import React from 'react';
import type { ElementRef } from 'react';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doPlaylistAddAndAllowPlaying } from 'redux/actions/content';
import { selectCollectionForId } from 'redux/selectors/collections';

type Props = {
  uri?: string;
  sourceId?: string;
  onlyCreate?: boolean;
  closeForm: (newCollectionName?: string, newCollectionId?: string) => void;
};

function FormNewCollection(props: Props) {
  const { uri, sourceId, onlyCreate, closeForm } = props;

  const dispatch = useAppDispatch();
  const sourceCollectionName = useAppSelector((state) =>
    sourceId ? selectCollectionForId(state, sourceId)?.name : undefined
  );

  const buttonref: ElementRef<any> = React.useRef();
  const [newCollectionName, setCollectionName] = React.useState(
    sourceCollectionName
      ? __('%copied_playlist_name% (copy)', {
          copied_playlist_name: sourceCollectionName,
        })
      : ''
  );

  function handleNameInput(e) {
    const { value } = e.target;
    setCollectionName(value);
  }

  function handleAddCollection() {
    const name = newCollectionName.trim();
    let id;
    dispatch(
      doPlaylistAddAndAllowPlaying({
        uri,
        collectionName: name,
        sourceId,
        createNew: true,
        createCb: !sourceId
          ? undefined
          : (newId) => {
              id = newId;
            },
      })
    );
    closeForm(name, id);
  }

  function handleKeyDown(e: React.KeyboardEvent<any>) {
    if (e.keyCode === KEYCODES.ENTER) {
      e.preventDefault();
      buttonref.current.click();
    }
  }

  function handleClearNew() {
    closeForm();
  }

  return (
    <FormField
      autoFocus
      type="text"
      name="new_collection"
      label={__('New Playlist Title')}
      placeholder={__(COLLECTIONS_CONSTS.PLACEHOLDER)}
      onKeyDown={handleKeyDown}
      inputButton={
        <>
          <Button
            button="alt"
            icon={ICONS.COMPLETED}
            title={__('Confirm')}
            className="button-toggle"
            disabled={newCollectionName.trim().length === 0}
            onClick={handleAddCollection}
            ref={buttonref}
          />
          {!onlyCreate && (
            <Button
              button="alt"
              className="button-toggle"
              icon={ICONS.REMOVE}
              title={__('Cancel')}
              onClick={handleClearNew}
            />
          )}
        </>
      }
      onChange={handleNameInput}
      value={newCollectionName}
    />
  );
}

export default FormNewCollection;
