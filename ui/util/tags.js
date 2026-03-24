// @flow
import { INTERNAL_TAGS, PURCHASE_TAG, PURCHASE_TAG_OLD, RENTAL_TAG, RENTAL_TAG_OLD } from 'constants/tags';

function isVisibleTagName(tagName: ?string): boolean {
  return Boolean(
    typeof tagName === 'string' &&
      tagName &&
      !INTERNAL_TAGS.includes(tagName) &&
      !tagName.startsWith(PURCHASE_TAG) &&
      !tagName.startsWith(PURCHASE_TAG_OLD) &&
      !tagName.startsWith(RENTAL_TAG) &&
      !tagName.startsWith(RENTAL_TAG_OLD)
  );
}

export function removeInternalStringTags(tags: $ReadOnlyArray<?string>): Array<string> {
  return tags.reduce((visibleTags, tag) => {
    if (typeof tag === 'string' && isVisibleTagName(tag)) {
      visibleTags.push(tag);
    }

    return visibleTags;
  }, []);
}

export function removeInternalTags(tags: $ReadOnlyArray<?Tag>): Array<Tag> {
  return tags.reduce((visibleTags, tag) => {
    if (tag && typeof tag.name === 'string' && isVisibleTagName(tag.name)) {
      visibleTags.push(tag);
    }

    return visibleTags;
  }, []);
}

export function hasFiatTags(claim: Claim) {
  const tags = claim.value?.tags;
  if (tags) {
    return tags.some(
      (t) =>
        typeof t === 'string' &&
        (t.includes(PURCHASE_TAG) ||
          t.startsWith(PURCHASE_TAG_OLD) ||
          t.includes(RENTAL_TAG) ||
          t.startsWith(RENTAL_TAG_OLD))
    );
  }
  return false;
}
