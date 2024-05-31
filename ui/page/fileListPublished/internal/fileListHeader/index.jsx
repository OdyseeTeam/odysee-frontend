// @flow
import React from 'react';
import Button from 'component/button';
import * as FILE_LIST from 'constants/file_list';
import { FileListContext } from 'page/fileListPublished/view';
import classnames from 'classnames';
import { FormField } from 'component/common/form';
import { useHistory } from 'react-router';
import RightSideActions from './internal/rightSideActions/index';

type Props = {
  filterType: string,
  sortOption: { key: string, value: string },
  setFilterType: (type: string) => void,
  setSortOption: (params: { key: string, value: string }) => void,
};

export default function ClaimListHeader(props: Props) {
  const { filterType, sortOption, setFilterType, setSortOption } = props;

  const { isFilteringEnabled } = React.useContext(FileListContext);

  const history = useHistory();
  const {
    location: { search },
  } = history;

  const urlParams = new URLSearchParams(search);

  function handleChange(sortObj) {
    // can only have one sorting option at a time
    Object.keys(FILE_LIST.SORT_VALUES).forEach((k) => urlParams.get(k) && urlParams.delete(k));

    urlParams.set(sortObj.key, sortObj.value);
    setSortOption(sortObj);

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }

  function handleFilterTypeChange(value) {
    urlParams.set(FILE_LIST.FILTER_TYPE_KEY, value);
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
              {Object.values(FILE_LIST.FILE_TYPE).map((info: FilterInfo) => (
                <Button
                  button="alt"
                  key={info.label}
                  label={__(info.label)}
                  aria-label={info.ariaLabel}
                  onClick={() => handleFilterTypeChange(info.key)}
                  className={classnames(`button-toggle`, { 'button-toggle--active': filterType === info.key })}
                />
              ))}
            </div>
            {isFilteringEnabled && (
              <div className="claim-search__menu-subgroup">
                <FormField
                  className="claim-search__dropdown"
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
                  className="claim-search__dropdown"
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
            )}
          </div>
        </div>

        <RightSideActions />
      </div>
    </div>
  );
}
