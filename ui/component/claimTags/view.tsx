import * as React from 'react';
import classnames from 'classnames';
import Tag from 'component/tag';
import { useAppSelector } from 'redux/hooks';
import { selectTagsForUri } from 'redux/selectors/claims';
import { selectFollowedTags } from 'redux/selectors/tags';
const SLIM_TAGS = 1;
const NORMAL_TAGS = 3;
const LARGE_TAGS = 6;
type Props = {
  uri: string;
  type: string;
};
export default function ClaimTags(props: Props) {
  const { uri, type } = props;
  const tags = useAppSelector((state) => selectTagsForUri(state, uri));
  const followedTags = useAppSelector(selectFollowedTags);
  const numberOfTags = type === 'small' ? SLIM_TAGS : type === 'large' ? LARGE_TAGS : NORMAL_TAGS;
  let tagsToDisplay = [];

  if (tags.includes('mature')) {
    tagsToDisplay.push('mature');
  }

  for (let i = 0; tagsToDisplay.length < numberOfTags - 2; i++) {
    const tag = followedTags[i];

    if (!tag) {
      break;
    }

    if (tags.includes(tag.name)) {
      tagsToDisplay.push(tag.name);
    }
  }

  const sortedTags = tags.toSorted((a, b) => a.localeCompare(b));

  for (let i = 0; i < sortedTags.length; i++) {
    const tag = sortedTags[i];

    if (!tag || tagsToDisplay.length === numberOfTags) {
      break;
    }

    if (!tagsToDisplay.includes(tag)) {
      tagsToDisplay.push(tag);
    }
  }

  if (!tagsToDisplay.length) {
    // return ['¯\\_(ツ)_/¯'];
    return [];
  }

  return (
    <div
      className={classnames('claim__tags', {
        'claim__tags--large': type === 'large',
      })}
    >
      {tagsToDisplay.map((tag) => (
        <Tag key={tag} title={tag} name={tag} />
      ))}
    </div>
  );
}
