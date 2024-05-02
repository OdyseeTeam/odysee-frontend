// @flow
import type { Duration } from 'constants/claim_search';

import * as CS from 'constants/claim_search';
import * as SETTINGS from 'constants/settings';
import { MATURE_TAGS, MEMBERS_ONLY_CONTENT_TAG } from 'constants/tags';
import { selectClientSetting } from 'redux/selectors/settings';

/**
 * Common logic to generate ClaimSearch option payload.
 */
export const CsOptHelper = {
  not_tags: (input?: NotTagInput = {}) => {
    const not_tags = input.showNsfw ? [] : MATURE_TAGS.slice();

    if (input.notTags) {
      not_tags.push(...input.notTags);
    }

    if (input.hideMembersOnly) {
      not_tags.push(MEMBERS_ONLY_CONTENT_TAG);
    }

    return not_tags;
  },

  /**
   * duration
   *
   * @param contentType
   * @param claimTypes
   * @param duration Duration type
   * @param durationVal Only applicable is 'duration === all';
   * @param minMinutes Only for 'duration === custom'
   * @param maxMinutes Only for 'duration === custom'
   * @returns {?string|Array<string>}
   */
  duration: (
    contentType: ?string,
    claimTypes: ?any,
    duration: Duration,
    durationVal?: string,
    minMinutes?: number,
    maxMinutes?: number
  ) => {
    const claimTypesWithDurations = [CS.CLAIM_STREAM, CS.CLAIM_REPOST];
    const claimTypesArray = Array.isArray(claimTypes) ? claimTypes : [claimTypes];
    if (
      (contentType !== CS.FILE_VIDEO &&
        contentType !== CS.FILE_AUDIO &&
        contentType !== null && // Any
        contentType !== undefined) || // Any
      (claimTypesArray[0] && !claimTypesArray.some((claimType) => claimTypesWithDurations.includes(claimType)))
    ) {
      return undefined;
    }

    let x: ?string | Array<string>;

    switch (duration) {
      case CS.DURATION.ALL:
        const { store } = window;
        let hideShorts;
        if (store) {
          const state = store.getState();
          hideShorts = selectClientSetting(state, SETTINGS.HIDE_SHORTS);
        }
        x = durationVal || (hideShorts && `>=${SETTINGS.SHORTS_DURATION_LIMIT}`) || undefined;
        break;
      case CS.DURATION.SHORT:
        x = '<=240';
        break;
      case CS.DURATION.LONG:
        x = '>=1200';
        break;
      case CS.DURATION.CUSTOM:
        if (minMinutes || maxMinutes) {
          x = [];
          if (minMinutes) {
            x.push(`>=${minMinutes * 60}`);
          }
          if (maxMinutes) {
            x.push(`<=${maxMinutes * 60}`);
          }
        }
        break;
      default:
        assert(false, 'invalid duration type', duration);
        break;
    }

    return x;
  },
};
