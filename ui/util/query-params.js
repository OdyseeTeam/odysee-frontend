// @flow
import { SEARCH_OPTIONS } from 'constants/search';
import * as SETTINGS from 'constants/settings';
import { selectClientSetting } from 'redux/selectors/settings';

const DEFAULT_SEARCH_RESULT_FROM = 0;
const DEFAULT_SEARCH_SIZE = 20;

export function parseQueryParams(queryString: string) {
  if (queryString === '') return {};
  const parts = queryString
    .split('?')
    .pop()
    .split('&')
    .map((p) => p.split('='));

  const params = {};
  parts.forEach((array) => {
    const [first, second] = array;
    params[first] = second;
  });
  return params;
}

// https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
export function updateQueryParam(uri: string, key: string, value: string) {
  const re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
  const separator = uri.includes('?') ? '&' : '?';
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + '=' + value + '$2');
  } else {
    return uri + separator + key + '=' + value;
  }
}

export const getSearchQueryString = (query: string, options: any = {}) => {
  const isSurroundedByQuotes = (str) => str[0] === '"' && str[str.length - 1] === '"';
  const encodedQuery = encodeURIComponent(query);
  const queryParams = [
    options.exact && !isSurroundedByQuotes(encodedQuery) ? `s="${encodedQuery}"` : `s=${encodedQuery}`,
    `size=${options.size || DEFAULT_SEARCH_SIZE}`,
    `from=${options.from || DEFAULT_SEARCH_RESULT_FROM}`,
  ];
  const { isBackgroundSearch } = options;
  const includeUserOptions = typeof isBackgroundSearch === 'undefined' ? false : !isBackgroundSearch;

  let isCustomDurationSet = false;
  let isDurationFilterSupported = false;

  function checkQuerySupportsDurationFilter() {
    let hasMediaTypeParam = false;
    let hasClaimTypeParam = false;
    let mediaTypeHasDuration = false;
    let claimTypeHasDuration = false;
    for (const param of queryParams) {
      if (param.includes('mediaType')) {
        hasMediaTypeParam = true;
        const mediaTypesWithDurations = [SEARCH_OPTIONS.MEDIA_VIDEO, SEARCH_OPTIONS.MEDIA_AUDIO];
        if (mediaTypesWithDurations.some((mediaType) => param.includes(mediaType))) {
          mediaTypeHasDuration = true;
        }
      }
      if (param.includes('claimType')) {
        hasClaimTypeParam = true;
        if (param.includes(SEARCH_OPTIONS.INCLUDE_FILES)) {
          claimTypeHasDuration = true;
        }
      }
    }

    return (!hasMediaTypeParam || mediaTypeHasDuration) && (!hasClaimTypeParam || claimTypeHasDuration);
  }

  isDurationFilterSupported = checkQuerySupportsDurationFilter();

  if (includeUserOptions) {
    const claimType = options[SEARCH_OPTIONS.CLAIM_TYPE];
    if (claimType) {
      queryParams.push(`claimType=${claimType}`);

      /*
       * Due to limitations in lighthouse, we can't pass the mediaType parameter
       * when searching for channels or "everything".
       */
      if (!claimType.includes(SEARCH_OPTIONS.INCLUDE_CHANNELS)) {
        queryParams.push(
          `mediaType=${[
            SEARCH_OPTIONS.MEDIA_AUDIO,
            SEARCH_OPTIONS.MEDIA_VIDEO,
            SEARCH_OPTIONS.MEDIA_TEXT,
            SEARCH_OPTIONS.MEDIA_IMAGE,
            SEARCH_OPTIONS.MEDIA_APPLICATION,
          ].reduce((acc, currentOption) => (options[currentOption] ? `${acc}${currentOption},` : acc), '')}`
        );
      }
    }

    const sortBy = options[SEARCH_OPTIONS.SORT];
    if (sortBy) {
      queryParams.push(`${SEARCH_OPTIONS.SORT}=${sortBy}`);
    }

    const timeFilter = options[SEARCH_OPTIONS.TIME_FILTER];
    if (timeFilter) {
      queryParams.push(`${SEARCH_OPTIONS.TIME_FILTER}=${timeFilter}`);
    }

    const minDuration = options[SEARCH_OPTIONS.MIN_DURATION];
    if (isDurationFilterSupported && minDuration && minDuration > 0) {
      const minSeconds = minDuration * 60;
      queryParams.push(`${SEARCH_OPTIONS.MIN_DURATION}=${minSeconds}`);
      isCustomDurationSet = true;
    }

    const maxDuration = options[SEARCH_OPTIONS.MAX_DURATION];
    if (isDurationFilterSupported && maxDuration && maxDuration > 0) {
      const maxSeconds = maxDuration * 60;
      queryParams.push(`${SEARCH_OPTIONS.MAX_DURATION}=${maxSeconds}`);
      isCustomDurationSet = true;
    }
  }

  const additionalOptions = {};
  const { related_to, nsfw, free_only, language, gid, uuid, max_aspect_ratio, deboost_same_creator } = options;

  if (related_to) {
    additionalOptions[SEARCH_OPTIONS.RELATED_TO] = related_to;

    if (gid && uuid) {
      additionalOptions['gid'] = gid;
      additionalOptions['uuid'] = uuid;
    }
  }

  if (free_only) {
    additionalOptions[SEARCH_OPTIONS.PRICE_FILTER_FREE] = true;
  }

  if (nsfw === false) {
    additionalOptions[SEARCH_OPTIONS.INCLUDE_MATURE] = false;
  }

  if (language) {
    additionalOptions[SEARCH_OPTIONS.LANGUAGE] = language;
  }

  if (max_aspect_ratio) {
    additionalOptions[SEARCH_OPTIONS.MAX_ASPECT_RATIO] = max_aspect_ratio;
  }

  if (deboost_same_creator) {
    additionalOptions[SEARCH_OPTIONS.DEBOOST_SAME_CREATOR] = deboost_same_creator;
  }

  const { store } = window;
  let hideShorts = false;
  if (store) {
    const state = store.getState();
    hideShorts = selectClientSetting(state, SETTINGS.HIDE_SHORTS);
  }

  if (hideShorts && isDurationFilterSupported && !isCustomDurationSet) {
    additionalOptions[SEARCH_OPTIONS.MIN_DURATION] = SETTINGS.SHORTS_DURATION_LIMIT;
  }

  if (additionalOptions) {
    Object.keys(additionalOptions).forEach((key) => {
      const option = additionalOptions[key];
      queryParams.push(`${key}=${option}`);
    });
  }

  return queryParams.join('&');
};
