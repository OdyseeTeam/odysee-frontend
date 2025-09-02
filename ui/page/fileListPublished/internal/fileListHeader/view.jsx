// @flow
import type { DoFetchClaimListMine } from 'redux/actions/claims';

import React from 'react';
import Button from 'component/button';
import * as FILE_LIST from 'constants/file_list';
import * as ICONS from 'constants/icons';
import { FileListContext } from 'page/fileListPublished/view';
import classnames from 'classnames';
import { FormField } from 'component/common/form';
import { useHistory } from 'react-router';
import RightSideActions from './internal/rightSideActions/view';

type Props = {
  filterType: string,
  setFilterType: (type: string) => void,
  fetchClaimListMine: DoFetchClaimListMine,
  doClearClaimSearch: () => void,
};

export default function ClaimListHeader(props: Props) {
  const { filterType, setFilterType, fetchClaimListMine, doClearClaimSearch } = props;

  const { fetching, method, params, channelIdsClaimList, sortOption, isFilteringEnabled, updateFilteringSetting } =
    React.useContext(FileListContext);

  const history = useHistory();
  const {
    location: { search },
  } = history;

  const urlParams = new URLSearchParams(search);

  function handleFilterTypeChange(value) {
    urlParams.set(FILE_LIST.FILTER_TYPE_KEY, value);
    setFilterType(value);

    const url = `?${urlParams.toString()}`;
    history.push(url);
  }

  return (
    <>
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
                    className={classnames(`button-toggle`, `button-toggle__upload-type-filter`, {
                      'button-toggle--active': filterType === info.key,
                    })}
                  />
                ))}
              </div>
            </div>
          </div>

          <RightSideActions />
        </div>
        {/* Second button row */}
        <div className="section__header-action-stack">
          <div className="section__header--actions">
            <div className="claim-search__wrapper--wrap">
              <div className="claim-search__menu-group">
                <div className="claim-search__menu-subgroup">
                  <Button
                    button="alt"
                    label={__('Refresh')}
                    disabled={fetching}
                    icon={ICONS.REFRESH}
                    onClick={() => {
                      if (method === FILE_LIST.METHOD.CLAIM_LIST) {
                        fetchClaimListMine(
                          1,
                          isFilteringEnabled ? FILE_LIST.PAGE_SIZE_ALL_ITEMS : params.page_size,
                          true,
                          [],
                          true,
                          channelIdsClaimList
                        );
                      } else {
                        doClearClaimSearch();
                      }
                    }}
                  />{' '}
                  <div className="claim-search__menu-group enable-filters-checkbox">
                    <FormField
                      label={__('Search & Sort')}
                      name="enable_filters"
                      type="checkbox"
                      checked={isFilteringEnabled}
                      onChange={() => updateFilteringSetting(!isFilteringEnabled, sortOption)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
