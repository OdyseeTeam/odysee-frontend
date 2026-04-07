import { SEARCH_OPTIONS, SEARCH_PAGE_SIZE } from 'constants/search';
import * as ICONS from 'constants/icons';
import * as SETTINGS from 'constants/settings';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Form, FormField } from 'component/common/form';
import Button from 'component/button';
import Icon from 'component/common/icon';
import classnames from 'classnames';
import LangFilterIndicator from 'component/langFilterIndicator';
import usePersistedState from 'effects/use-persisted-state';
import debounce from 'util/debounce';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doUpdateSearchOptions } from 'redux/actions/search';
import { selectSearchOptions } from 'redux/selectors/search';
import { doToggleSearchExpanded } from 'redux/actions/app';
import { selectSearchOptionsExpanded } from 'redux/selectors/app';
import { selectClientSetting } from 'redux/selectors/settings';
const CLAIM_TYPES = {
  [SEARCH_OPTIONS.INCLUDE_FILES]: 'Files',
  [SEARCH_OPTIONS.INCLUDE_CHANNELS]: 'Channels',
  [SEARCH_OPTIONS.INCLUDE_FILES_AND_CHANNELS]: 'Everything',
};
const TYPES_ADVANCED = {
  [SEARCH_OPTIONS.MEDIA_VIDEO]: 'Video',
  [SEARCH_OPTIONS.MEDIA_AUDIO]: 'Audio',
  [SEARCH_OPTIONS.MEDIA_IMAGE]: 'Image',
  [SEARCH_OPTIONS.MEDIA_TEXT]: 'Text',
  [SEARCH_OPTIONS.MEDIA_APPLICATION]: 'Other',
};
const TIME_FILTER = {
  '': 'All',
  // [SEARCH_OPTIONS.TIME_FILTER_LAST_HOUR]: 'Last Hour', -- disable (doesn't work)
  [SEARCH_OPTIONS.TIME_FILTER_TODAY]: 'Last 24 Hours',
  [SEARCH_OPTIONS.TIME_FILTER_THIS_WEEK]: 'This Week',
  [SEARCH_OPTIONS.TIME_FILTER_THIS_MONTH]: 'This Month',
  [SEARCH_OPTIONS.TIME_FILTER_THIS_YEAR]: 'This Year',
};
const SORT_BY = {
  '': 'Relevance',
  [SEARCH_OPTIONS.SORT_DESCENDING]: 'Newest first',
  [SEARCH_OPTIONS.SORT_ASCENDING]: 'Oldest first',
};
const SEARCH_FILTER_OPTION_LABELS = {
  [SEARCH_OPTIONS.MEDIA_VIDEO]: 'Video',
  [SEARCH_OPTIONS.MEDIA_AUDIO]: 'Audio',
  [SEARCH_OPTIONS.MEDIA_IMAGE]: 'Image',
  [SEARCH_OPTIONS.MEDIA_TEXT]: 'Text',
  [SEARCH_OPTIONS.MEDIA_APPLICATION]: 'Other',
};
type Props = {
  simple: boolean;
  additionalOptions?: {};
  onSearchOptionsChanged: (arg0: string) => void;
};

function addRow(label: string, value: any) {
  return (
    <tr>
      <td>
        <legend className="search__legend">{label}</legend>
      </td>
      <td>{value}</td>
    </tr>
  );
}

const OBJ_TO_OPTION_ELEM = (obj: Record<string, string>) => {
  return Object.entries(obj).map((x) => {
    return (
      <option key={x[0]} value={x[0]}>
        {__(x[1])}
      </option>
    );
  });
};

const SearchOptions = (props: Props) => {
  const { simple, additionalOptions = {}, onSearchOptionsChanged } = props;
  const dispatch = useAppDispatch();
  const options = useAppSelector(selectSearchOptions);
  const expanded = useAppSelector(selectSearchOptionsExpanded);
  const searchInLanguage = useAppSelector((state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE));
  const setSearchOption = (option: string, value: boolean | string | number) =>
    dispatch(doUpdateSearchOptions({ [option]: value }, additionalOptions));
  const toggleSearchExpanded = () => dispatch(doToggleSearchExpanded());
  const location = useLocation();
  const stringifiedOptions = JSON.stringify(options);
  const isFilteringByChannel = useMemo(() => {
    const jsonOptions = JSON.parse(stringifiedOptions);
    const claimType = String(jsonOptions[SEARCH_OPTIONS.CLAIM_TYPE] || '');
    return claimType.includes(SEARCH_OPTIONS.INCLUDE_CHANNELS);
  }, [stringifiedOptions]);
  const [minDurationMinutes, setMinDurationMinutes] = usePersistedState(`minDurUserMinutes-${location.pathname}`, null);
  const [maxDurationMinutes, setMaxDurationMinutes] = usePersistedState(`maxDurUserMinutes-${location.pathname}`, null);
  const setMinDurationMinutesDebounced = React.useCallback(
    debounce((m) => updateSearchOptions(SEARCH_OPTIONS.MIN_DURATION, m), 750),
    []
  );
  const setMaxDurationMinutesDebounced = React.useCallback(
    debounce((m) => updateSearchOptions(SEARCH_OPTIONS.MAX_DURATION, m), 750),
    []
  );
  const typeOptions = useMemo(() => {
    if (simple) {
      return {
        [SEARCH_OPTIONS.MEDIA_VIDEO]: TYPES_ADVANCED[SEARCH_OPTIONS.MEDIA_VIDEO],
        [SEARCH_OPTIONS.MEDIA_AUDIO]: TYPES_ADVANCED[SEARCH_OPTIONS.MEDIA_AUDIO],
        [SEARCH_OPTIONS.MEDIA_TEXT]: TYPES_ADVANCED[SEARCH_OPTIONS.MEDIA_TEXT],
      };
    }

    return TYPES_ADVANCED;
  }, [simple]);
  const typeOptionKeys = Object.keys(typeOptions);
  const activeFilterLabels = useMemo(() => {
    const labels = [];
    const claimType = options[SEARCH_OPTIONS.CLAIM_TYPE];

    if (claimType === SEARCH_OPTIONS.INCLUDE_FILES) {
      labels.push(__('Files'));
      const selectedMediaTypes = typeOptionKeys.filter((option) => Boolean(options[option]));

      if (selectedMediaTypes.length > 0 && selectedMediaTypes.length < typeOptionKeys.length) {
        selectedMediaTypes.forEach((option) => labels.push(__(SEARCH_FILTER_OPTION_LABELS[option])));
      }
    } else if (claimType === SEARCH_OPTIONS.INCLUDE_CHANNELS) {
      labels.push(__('Channels'));
    }

    if (options[SEARCH_OPTIONS.TIME_FILTER]) {
      labels.push(__(TIME_FILTER[String(options[SEARCH_OPTIONS.TIME_FILTER])]));
    }

    if (options[SEARCH_OPTIONS.SORT]) {
      labels.push(__(SORT_BY[String(options[SEARCH_OPTIONS.SORT])]));
    }

    if (options[SEARCH_OPTIONS.EXACT]) {
      labels.push(__('Exact match'));
    }

    if (minDurationMinutes) {
      labels.push(__('Min %value%m', { value: minDurationMinutes }));
    }

    if (maxDurationMinutes) {
      labels.push(__('Max %value%m', { value: maxDurationMinutes }));
    }

    return labels;
  }, [maxDurationMinutes, minDurationMinutes, options, typeOptionKeys]);
  const activeFilterCount = activeFilterLabels.length;

  React.useEffect(() => {
    // We no longer let the user set the search results count, but the value
    // will be in local storage for existing users. Override that.
    if (options[SEARCH_OPTIONS.RESULT_COUNT] !== SEARCH_PAGE_SIZE) {
      setSearchOption(SEARCH_OPTIONS.RESULT_COUNT, SEARCH_PAGE_SIZE);
    }
  }, []);

  function updateSearchOptions(option, value) {
    setSearchOption(option, value);

    if (onSearchOptionsChanged) {
      onSearchOptionsChanged(option);
    }
  }

  const typeElem = (
    <>
      <div className="filter-values">
        <div>
          {Object.entries(CLAIM_TYPES).map((t) => {
            const option = t[0];

            if (option === SEARCH_OPTIONS.INCLUDE_FILES_AND_CHANNELS) {
              return null;
            }

            return (
              <Button
                key={option}
                button="alt"
                label={__(t[1])}
                className={classnames(`button-toggle`, {
                  'button-toggle--active': options[SEARCH_OPTIONS.CLAIM_TYPE] === option,
                })}
                onClick={() => setSearchOption(SEARCH_OPTIONS.CLAIM_TYPE, option)}
              />
            );
          })}
        </div>
        <Button
          button="close"
          className={classnames('close-button', {
            'close-button--visible': options[SEARCH_OPTIONS.CLAIM_TYPE] !== SEARCH_OPTIONS.INCLUDE_FILES_AND_CHANNELS,
          })}
          icon={ICONS.REMOVE}
          onClick={() => updateSearchOptions(SEARCH_OPTIONS.CLAIM_TYPE, SEARCH_OPTIONS.INCLUDE_FILES_AND_CHANNELS)}
        />
      </div>
      {options[SEARCH_OPTIONS.CLAIM_TYPE] === SEARCH_OPTIONS.INCLUDE_FILES && (
        <div className="media-types">
          {Object.entries(typeOptions).map((t) => {
            const option = t[0];
            return (
              <FormField
                key={option}
                name={option}
                type="checkbox"
                blockWrap={false}
                disabled={options[SEARCH_OPTIONS.CLAIM_TYPE] !== SEARCH_OPTIONS.INCLUDE_FILES}
                label={__(t[1])}
                checked={!isFilteringByChannel && options[option]}
                onChange={() => updateSearchOptions(option, !options[option])}
              />
            );
          })}
        </div>
      )}
    </>
  );
  const otherOptionsElem = (
    <>
      <div className="filter-values">
        <FormField
          type="checkbox"
          name="exact-match"
          checked={options[SEARCH_OPTIONS.EXACT]}
          onChange={() => updateSearchOptions(SEARCH_OPTIONS.EXACT, !options[SEARCH_OPTIONS.EXACT])}
          label={__('Exact match')}
        />
        <Icon
          className="icon--help"
          icon={ICONS.HELP}
          tooltip
          size={16}
          customTooltipText={__(
            'Find results that include all the given words in the exact order.\nThis can also be done by surrounding the search query with quotation marks (e.g. "hello world").'
          )}
        />
      </div>
    </>
  );
  const uploadDateElem = (
    <div className="filter-values">
      <FormField
        type="select"
        name="upload-date"
        value={options[SEARCH_OPTIONS.TIME_FILTER]}
        onChange={(e) => updateSearchOptions(SEARCH_OPTIONS.TIME_FILTER, e.target.value)}
        blockWrap={false}
      >
        {OBJ_TO_OPTION_ELEM(TIME_FILTER)}
      </FormField>
      <Button
        button="close"
        className={classnames('close-button', {
          'close-button--visible': options[SEARCH_OPTIONS.TIME_FILTER],
        })}
        icon={ICONS.REMOVE}
        onClick={() => updateSearchOptions(SEARCH_OPTIONS.TIME_FILTER, '')}
      />
    </div>
  );
  const sortByElem = (
    <div className="filter-values">
      <FormField
        type="select"
        name="sort-by"
        blockWrap={false}
        value={options[SEARCH_OPTIONS.SORT]}
        onChange={(e) => updateSearchOptions(SEARCH_OPTIONS.SORT, e.target.value)}
      >
        {OBJ_TO_OPTION_ELEM(SORT_BY)}
      </FormField>
    </div>
  );
  const durationElem = (
    <div className="filter-values">
      <div className="claim-search__duration-inputs-container">
        <FormField
          label={__('Min Minutes')}
          type="number"
          name="min_duration__minutes"
          blockWrap={false}
          value={minDurationMinutes}
          onChange={(e) => {
            setMinDurationMinutes(e.target.value);
            setMinDurationMinutesDebounced(e.target.value);
          }}
        />
        <FormField
          label={__('Max Minutes')}
          type="number"
          name="max_duration__minutes"
          blockWrap={false}
          value={maxDurationMinutes}
          onChange={(e) => {
            setMaxDurationMinutes(e.target.value);
            setMaxDurationMinutesDebounced(e.target.value);
          }}
        />
        <Button
          button="close"
          className={classnames('close-button', {
            'close-button--visible': minDurationMinutes || maxDurationMinutes,
          })}
          icon={ICONS.REMOVE}
          onClick={() => {
            setMinDurationMinutes('');
            setMaxDurationMinutes('');
            updateSearchOptions(SEARCH_OPTIONS.MIN_DURATION, '');
            updateSearchOptions(SEARCH_OPTIONS.MAX_DURATION, '');
          }}
        />
      </div>
    </div>
  );
  const uploadDateLabel =
    options[SEARCH_OPTIONS.CLAIM_TYPE] === SEARCH_OPTIONS.INCLUDE_CHANNELS ? __('Creation Date') : __('Upload Date');
  return (
    <div>
      <div className="search__filters-toolbar">
        <Button
          button="alt"
          label={activeFilterCount > 0 ? `${__('Filter')} (${activeFilterCount})` : __('Filter')}
          icon={ICONS.FILTER}
          iconRight={expanded ? ICONS.UP : ICONS.DOWN}
          className={classnames('search__filters-toggle button-toggle', {
            'button-toggle--active': activeFilterCount > 0,
          })}
          onClick={toggleSearchExpanded}
        />
        {searchInLanguage && <LangFilterIndicator />}
      </div>
      {activeFilterCount > 0 && (
        <div className="search__filters-summary">
          <span className="search__filters-summary-label">
            {__('Active filters')}: {activeFilterCount}
          </span>
          {activeFilterLabels.map((label) => (
            <span key={label} className="search__filters-chip">
              {label}
            </span>
          ))}
        </div>
      )}
      <Form
        className={classnames('search__options', {
          'search__options--expanded': expanded,
        })}
      >
        <table className="table table--condensed">
          <tbody>
            {addRow(__('Type'), typeElem)}
            {addRow(uploadDateLabel, uploadDateElem)}
            {addRow(__('Sort By'), sortByElem)}
            {addRow(__('Duration'), durationElem)}
            {addRow(__('Other Options'), otherOptionsElem)}
          </tbody>
        </table>
      </Form>
    </div>
  );
};

export default SearchOptions;
