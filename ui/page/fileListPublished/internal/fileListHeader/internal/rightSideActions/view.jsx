// @flow

import React from 'react';
import { FormField, Form } from 'component/common/form';
import { useHistory } from 'react-router';
import { FileListContext } from 'page/fileListPublished/view';
import * as FILE_LIST from 'constants/file_list';
import * as KEYCODES from 'constants/keycodes';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

const RightSideActions = (props: Props) => {
  const { searchText, setSearchText, isFilteringEnabled, sortOption, updateFilteringSetting } =
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

  function handleChange(sortObj) {
    // can only have one sorting option at a time
    Object.keys(FILE_LIST.SORT_VALUES).forEach((k) => urlParams.get(k) && urlParams.delete(k));

    urlParams.set(sortObj.key, sortObj.value);
    updateFilteringSetting(isFilteringEnabled, sortObj);

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }
  //
  return (
    <div className="claim-search__wrapper--wrap">
      {/* Search Field */}
      {isFilteringEnabled && (
        <div className="claim-search__menu-group">
          <div className="claim-search__menu-subgroup">
            <FormField
              className="claim-search__dropdown uploads__dropdown"
              type="select"
              name="sort_by"
              value={sortOption.key}
              onChange={(e) => handleChange({ key: e.target.value, value: FILE_LIST.SORT_ORDER.ASC })}
            >
              {Object.entries(FILE_LIST.SORT_VALUES).map(([key, value]) => (
                <option key={key} value={key}>
                  {/* $FlowFixMe */}
                  {__(value.str)}
                </option>
              ))}
            </FormField>
            <FormField
              className="claim-search__dropdown uploads__dropdown"
              type="select"
              name="order_by"
              value={sortOption.value}
              onChange={(e) => handleChange({ key: sortOption.key, value: e.target.value })}
            >
              {Object.entries(FILE_LIST.SORT_ORDER).map(([key, value]) => (
                // $FlowFixMe
                <option key={value} value={value}>
                  {__(FILE_LIST.SORT_VALUES[sortOption.key].orders[value])}
                </option>
              ))}
            </FormField>
          </div>
          <div className="claim-search__menu-subgroup">
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
        </div>
      )}
    </div>
  );
};

export default RightSideActions;
