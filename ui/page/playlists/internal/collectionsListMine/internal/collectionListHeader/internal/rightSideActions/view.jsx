// @flow
import React from 'react';
import { FormField, Form } from 'component/common/form';
import { useHistory } from 'react-router';
import { CollectionsListContext } from 'page/playlists/internal/collectionsListMine/view';
import * as COLS from 'constants/collections';
import * as MODALS from 'constants/modal_types';
import * as KEYCODES from 'constants/keycodes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  // -- redux --
  doOpenModal: (id: string) => void,
};

const RightSideActions = (props: Props) => {
  const { doOpenModal } = props;

  const { searchText, setSearchText } = React.useContext(CollectionsListContext);

  const history = useHistory();

  // Debounce URL updates to avoid excessive history entries
  const debounceTimerRef = React.useRef<any>(null);

  function handleCreatePlaylist() {
    doOpenModal(MODALS.COLLECTION_CREATE);
  }

  function handleSearchTextChange(value) {
    setSearchText(value);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const currentParams = new URLSearchParams(history.location.search);

      if (value === '') {
        currentParams.delete(COLS.SEARCH_TERM_KEY);
      } else {
        currentParams.set(COLS.SEARCH_TERM_KEY, value);
      }

      // Reset page when search changes
      currentParams.delete('page');

      const url = `?${currentParams.toString()}`;
      history.replace(url);
    }, SEARCH_DEBOUNCE_MS);
  }

  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function escapeListener(e: SyntheticKeyboardEvent<*>) {
    if (e.keyCode === KEYCODES.ESCAPE) {
      e.preventDefault();
      handleSearchTextChange('');
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
      <Button button="primary" icon={ICONS.ADD} label={__('New Playlist')} onClick={handleCreatePlaylist} />
    </div>
  );
};

export default RightSideActions;
