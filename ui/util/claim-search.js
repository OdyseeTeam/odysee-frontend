// @flow
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
};
