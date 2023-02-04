// @flow
import React from 'react';
import { FormField, Form } from 'component/common/form';
import { useHistory } from 'react-router'
import { CollectionsListContext } from 'page/playlists/internal/collectionsListMine/view';
import * as COLS from 'constants/collections';
import * as MODALS from 'constants/modal_types';
import * as KEYCODES from 'constants/keycodes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';

type Props = {
  // -- redux --
  doOpenModal: (id: string) => void,
};

const RightSideActions = (props: Props) => {
  const { doOpenModal } = props;

  const { searchText, setSearchText } = React.useContext(CollectionsListContext);

  const history = useHistory();
  const {
    location: { search }
  } = history;
  const urlParams = new URLSearchParams(search);

  function handleCreatePlaylist() {
    doOpenModal(MODALS.COLLECTION_CREATE);
  }

  function handleSearchTextChange(value) {
    setSearchText(value);

    if (value === '') {
      urlParams.get(COLS.SEARCH_TERM_KEY) && urlParams.delete(COLS.SEARCH_TERM_KEY);
    } else {
      urlParams.set(COLS.SEARCH_TERM_KEY, value);
    }

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }

  function escapeListener(e: SyntheticKeyboardEvent<*>) {
    if (e.keyCode === KEYCODES.ESCAPE) {
      e.preventDefault();
      setSearchText('');
    }
  }

  function onTextareaFocus() {
    window.addEventListener('keydown', escapeListener);
  }

  function onTextareaBlur() {
    window.removeEventListener('keydown', escapeListener);
  }

  return (
    <div className="claim-search__wrapper--wrap">
      {/* Search Field */}
      <div className="claim-search__menu-group">
        <Form onSubmit={() => {}} className="wunderbar--inline">
          <Icon icon={ICONS.SEARCH} />
          <FormField
            name="collection_search"
            onFocus={onTextareaFocus}
            onBlur={onTextareaBlur}
            className="wunderbar__input--inline"
            value={searchText}
            onChange={(e) => handleSearchTextChange(e.target.value)}
            type="text"
            placeholder={__('Search')}
          />
        </Form>
      </div>

      {/* Playlist Create Button */}
      <Button button="primary" label={__('New Playlist')} onClick={handleCreatePlaylist} />
    </div>
  );
};

export default RightSideActions;
