// @flow
import * as React from 'react';
import classnames from 'classnames';
import Tag from 'component/tag';
import Button from 'component/button';
import * as ICONS from 'constants/icons';

const SLIM_TAGS = 1;
const NORMAL_TAGS = 3;
const LARGE_TAGS = 6;

type Props = {
  tags: Array<string>,
  followedTags: Array<Tag>,
  type: string,
};

export default function PreorderButton(props: Props) {
  const { tags, followedTags, type } = props;

  console.log(tags, followedTags, type);

  // const numberOfTags = type === 'small' ? SLIM_TAGS : type === 'large' ? LARGE_TAGS : NORMAL_TAGS;
  //
  // let tagsToDisplay = [];
  //
  // if (tags.includes('mature')) {
  //   tagsToDisplay.push('mature');
  // }
  //
  // for (var i = 0; tagsToDisplay.length < numberOfTags - 2; i++) {
  //   const tag = followedTags[i];
  //   if (!tag) {
  //     break;
  //   }
  //
  //   if (tags.includes(tag.name)) {
  //     tagsToDisplay.push(tag.name);
  //   }
  // }
  //
  // const sortedTags = tags.sort((a, b) => a.localeCompare(b));
  //
  // for (var i = 0; i < sortedTags.length; i++) {
  //   const tag = sortedTags[i];
  //   if (!tag || tagsToDisplay.length === numberOfTags) {
  //     break;
  //   }
  //
  //   if (!tagsToDisplay.includes(tag)) {
  //     tagsToDisplay.push(tag);
  //   }
  // }
  //
  // if (!tagsToDisplay.length) {
  //   return null;
  // }

  return (
    <div>
      <Button
        // ref={buttonRef}
        iconColor="red"
        className={'preorder-button'}
        // largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
        icon={ICONS.FINANCE}
        requiresAuth={IS_WEB}
        button="primary"
        label={'Preorder now for $14.95'}
        // style={{ backgroundColor: 'var(--color-primary);' }}
        // title={titlePrefix}
        onClick={(e) => {
          // e.stopPropagation();
          //
          // subscriptionHandler(
          //   {
          //     channelName: '@' + rawChannelName,
          //     uri: uri,
          //     notificationsDisabled: true,
          //   },
          //   true
          // );
        }}
      />
    </div>
  );
}
