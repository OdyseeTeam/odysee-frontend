// @flow
import React from 'react';
import Button from 'component/button';
import * as COLS from 'constants/collections';
import classnames from 'classnames';
import { FormField } from 'component/common/form';
import { useHistory } from 'react-router';
import RightSideActions from './internal/rightSideActions';
import FilteredTextLabel from './internal/filtered-text-label';

type Props = {
  filterType: string,
  isTruncated: boolean,
  sortOption: { key: string, value: string },
  setFilterType: (type: string) => void,
  setSortOption: (params: { key: string, value: string }) => void,
};

export default function CollectionsListMine(props: Props) {
  const { filterType, isTruncated, sortOption, setFilterType, setSortOption } = props;

  const history = useHistory();
  const {
    location: { search },
  } = history;

  const urlParams = new URLSearchParams(search);

  function handleChange(sortObj) {
    // can only have one sorting option at a time
    Object.keys(COLS.SORT_VALUES).forEach((k) => urlParams.get(k) && urlParams.delete(k));

    urlParams.set(sortObj.key, sortObj.value);
    setSortOption(sortObj);

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }

  function handleFilterTypeChange(value) {
    urlParams.set(COLS.FILTER_TYPE_KEY, value);
    setFilterType(value);

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }

  return (
    <div className="section__header-action-stack">
      <div className="section__header--actions">
        <div className="claim-search__wrapper--wrap">
          {/* Filter Options */}
          <div className="claim-search__menu-group">
            <div className="claim-search__menu-subgroup">
              {/* $FlowFixMe */}
              {Object.values(COLS.LIST_TYPE).map((value) => (
                <Button
                  label={__(String(value))}
                  key={String(value)}
                  button="alt"
                  // $FlowFixMe
                  onClick={() => handleFilterTypeChange(String(value))}
                  className={classnames('button-toggle', { 'button-toggle--active': filterType === value })}
                />
              ))}
            </div>
            <div className="claim-search__menu-subgroup">
              <FormField
                className="claim-search__dropdown"
                type="select"
                name="sort_by"
                value={sortOption.key}
                onChange={(e) => handleChange({ key: e.target.value, value: COLS.SORT_ORDER.ASC })}
              >
                {Object.entries(COLS.SORT_VALUES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {/* $FlowFixMe */}
                    {__(value.str)}
                  </option>
                ))}
              </FormField>
              <FormField
                className="claim-search__dropdown"
                type="select"
                name="order_by"
                value={sortOption.value}
                onChange={(e) => handleChange({ key: sortOption.key, value: e.target.value })}
              >
                {Object.entries(COLS.SORT_ORDER).map(([key, value]) => (
                  // $FlowFixMe
                  <option key={value} value={value}>
                    {__(COLS.SORT_VALUES[sortOption.key].orders[value])}
                  </option>
                ))}
              </FormField>
            </div>
          </div>
        </div>

        <RightSideActions />
      </div>

      {isTruncated && <FilteredTextLabel />}
    </div>
  );
}
