// @flow
import type { Duration } from 'constants/claim_search';

import * as CS from 'constants/claim_search';
import { MATURE_TAGS, MEMBERS_ONLY_CONTENT_TAG } from 'constants/tags';

/**
 * Helper functions to derive the ClaimSearch option payload.
 */
export const CsOptions = {
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
   * @param duration Duration type
   * @param durationVal Only applicable is 'duration === all';
   * @param minMinutes Only for 'duration === custom'
   * @param maxMinutes Only for 'duration === custom'
   * @returns {?string|Array<string>}
   */
  duration: (
    contentType: ?string,
    duration: Duration,
    durationVal?: string,
    minMinutes?: number,
    maxMinutes?: number
  ) => {
    if (
      contentType !== CS.FILE_VIDEO &&
      contentType !== CS.FILE_AUDIO &&
      contentType !== null && // Any
      contentType !== undefined // Any
    ) {
      return undefined;
    }

    let x: ?string | Array<string>;

    switch (duration) {
      case CS.DURATION.ALL:
        x = durationVal || undefined;
        break;
      case CS.DURATION.SHORT:
        x = '<=240';
        break;
      case CS.DURATION.LONG:
        x = '>=1200';
        break;
      case CS.DURATION.CUSTOM:
        x = [];
        if (minMinutes) {
          x.push(`>=${minMinutes * 60}`);
        }
        if (maxMinutes) {
          x.push(`<=${maxMinutes * 60}`);
        }
        assert(minMinutes || maxMinutes, 'custom duration but no limits given');
        break;
      default:
        assert(false, 'invalid duration type', duration);
        break;
    }

    return x;
  },
};
