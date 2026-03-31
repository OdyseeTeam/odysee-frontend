import React from 'react';
import { FormField, Form } from 'component/common/form';
import { useLocation, useNavigate } from 'react-router-dom';
import { CollectionsListContext } from 'page/playlists/internal/collectionsListMine/view';
import * as COLS from 'constants/collections';
import * as MODALS from 'constants/modal_types';
import * as KEYCODES from 'constants/keycodes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';
import { useAppDispatch } from 'redux/hooks';
import { doOpenModal } from 'redux/actions/app';

const SEARCH_DEBOUNCE_MS = 300;

const RightSideActions = () => {
  const dispatch = useAppDispatch();
  const { searchText, setSearchText } = React.useContext(CollectionsListContext);
  const navigate = useNavigate();
  const { search } = useLocation();
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleCreatePlaylist() {
    dispatch(doOpenModal(MODALS.COLLECTION_CREATE));
  }

  function handleSearchTextChange(value) {
    setSearchText(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const urlParams = new URLSearchParams(search);
      urlParams.delete('page');

      if (value === '') {
        urlParams.delete(COLS.SEARCH_TERM_KEY);
      } else {
        urlParams.set(COLS.SEARCH_TERM_KEY, value);
      }

      navigate(`?${urlParams.toString()}`, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
  }

  function escapeListener(e: any) {
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
      <Button button="primary" icon={ICONS.ADD} label={__('New Playlist')} onClick={handleCreatePlaylist} />
    </div>
  );
};

export default RightSideActions;
