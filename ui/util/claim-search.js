// @flow
import type { Duration } from 'constants/claim_search';

import * as CS from 'constants/claim_search';
import { MATURE_TAGS, MEMBERS_ONLY_CONTENT_TAG, VISIBILITY_TAGS } from 'constants/tags';

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

    if (!input.showUnlisted) {
      not_tags.push(VISIBILITY_TAGS.UNLISTED);
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

const UPPER_LIMIT_KILL_SWITCH = true;

export function applyReleaseTimeUpperLimit(options: ClaimSearchOptions) {
  if (UPPER_LIMIT_KILL_SWITCH) {
    // The backend will do it. Leaving the function here for now
    return options;
  }

  const chkLessThan = (x: string) => {
    if (x.startsWith('<') || x.startsWith('<=')) {
      const matchResult = x.match(/\d+/);
      if (matchResult) {
        if (parseInt(matchResult[0]) > Date.now() / 1000) {
          // The given "less than" is in the future. Limit that.
          return `<${Math.floor(Date.now() / 1000)}`;
        }
      }
    }
    return x;
  };

  if (options) {
    let rt = options.release_time;
    if (rt) {
      assert(typeof rt === 'string' || (Array.isArray(rt) && rt.length > 0 && rt.length <= 2));

      // 1. Always convert to array to simplify the verification
      if (typeof rt === 'string') {
        rt = [rt];
      }

      // 2. Verify limits
      if (rt.length === 2) {
        // Just verify upper limit only for now
        rt = [rt[0], chkLessThan(rt[1])];
      } else {
        if (rt[0].startsWith('>') || rt[0].startsWith('>=')) {
          // Append 'now' as upper limit
          rt.push(`<${Math.floor(Date.now() / 1000)}`);
        } else {
          // Verify given upper limit + convert to string
          rt = chkLessThan(rt[0]);
        }
      }
      return { ...options, release_time: rt };
    } else {
      // claim_search with release_time. Add the max limit
      return { ...options, release_time: `<${Math.floor(Date.now() / 1000)}` };
    }
  } else {
    // claim_search without any options. Create one with the max limit.
    const newOptions: ClaimSearchOptions = { release_time: `<${Math.floor(Date.now() / 1000)}` };
    return newOptions;
  }
}
