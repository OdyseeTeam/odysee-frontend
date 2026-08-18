import { INTERNAL_TAGS, PURCHASE_TAG, PURCHASE_TAG_OLD, RENTAL_TAG, RENTAL_TAG_OLD } from 'constants/tags';

export function removeInternalStringTags(tags: Array<string>): Array<string> {
  const expandedTags = tags.flatMap((tag: string) => {
    if (tag.includes(',')) {
      return tag
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    return [tag];
  });

  return expandedTags.filter((tag: string) => {
    return (
      !INTERNAL_TAGS.includes(tag) &&
      !tag.startsWith(PURCHASE_TAG) &&
      !tag.startsWith(PURCHASE_TAG_OLD) &&
      !tag.startsWith(RENTAL_TAG) &&
      !tag.startsWith(RENTAL_TAG_OLD)
    );
  });
}

export function removeInternalTags(tags: Array<Tag>): Array<Tag> {
  const expandedTags = tags.flatMap((tag: Tag) => {
    if (!tag?.name) return [];
    if (tag.name.includes(',')) {
      return tag.name
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((name) => ({ ...tag, name }));
    }
    return [tag];
  });

  return expandedTags.filter((tag: Tag) => {
    if (!tag?.name) return false;
    return (
      !INTERNAL_TAGS.includes(tag.name) &&
      !tag.name.startsWith(PURCHASE_TAG) &&
      !tag.name.startsWith(PURCHASE_TAG_OLD) &&
      !tag.name.startsWith(RENTAL_TAG) &&
      !tag.name.startsWith(RENTAL_TAG_OLD)
    );
  });
}

export function hasFiatTags(claim: Claim) {
  const tags = claim.value?.tags;

  if (tags) {
    return tags.some(
      (t) =>
        t.includes(PURCHASE_TAG) ||
        t.startsWith(PURCHASE_TAG_OLD) ||
        t.includes(RENTAL_TAG) ||
        t.startsWith(RENTAL_TAG_OLD)
    );
  }

  return false;
}
