// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import React from 'react';
import { FormField, Form } from 'component/common/form';
import { useHistory } from 'react-router';
import { FileListContext } from 'page/fileListPublished/view';
import * as FILE_LIST from 'constants/file_list';
import * as KEYCODES from 'constants/keycodes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import Button from 'component/button';

type Props = {
  // -- redux --
  fetchClaimListMine: DoFetchClaimListMine,
};

const RightSideActions = (props: Props) => {
  const { fetchClaimListMine } = props;
  const { searchText, setSearchText, isFilteringEnabled, setIsFilteringEnabled, fetching } =
    React.useContext(FileListContext);

  const history = useHistory();
  const {
    location: { search },
  } = history;
  const urlParams = new URLSearchParams(search);

  function handleSearchTextChange(value) {
    setSearchText(value);

    if (value === '') {
      urlParams.get(FILE_LIST.SEARCH_TERM_KEY) && urlParams.delete(FILE_LIST.SEARCH_TERM_KEY);
    } else {
      urlParams.set(FILE_LIST.SEARCH_TERM_KEY, value);
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
        {isFilteringEnabled && (
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
        )}
        <div className="claim-search__menu-group enable-filters-checkbox">
          <FormField
            label={__('Enable filters')}
            name="enable_filters"
            type="checkbox"
            disabled={fetching}
            checked={isFilteringEnabled}
            onChange={() => setIsFilteringEnabled(!isFilteringEnabled)}
          />
        </div>
      </div>
      {/* Playlist Create Button */}
      <Button
        button="alt"
        label={__('Refresh')}
        disabled={fetching}
        icon={ICONS.REFRESH}
        onClick={() => {
          fetchClaimListMine(1, FILE_LIST.PAGE_SIZE_ALL_ITEMS, true, [], true);
        }}
      />{' '}
    </div>
  );
};

export default RightSideActions;
