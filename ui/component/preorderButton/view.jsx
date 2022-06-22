// @flow
import * as React from 'react';
import classnames from 'classnames';
import * as MODALS from 'constants/modal_types';
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
  const { tags, followedTags, type, preorderTag, doOpenModal, uri } = props;

  console.log(tags, followedTags, type, preorderTag);
  console.log('here is my preorder tag!');

  return (
    <>
      {preorderTag && (<div>
        <Button
          // ref={buttonRef}
          iconColor="red"
          className={'preorder-button'}
          // largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
          icon={ICONS.FINANCE}
          button="primary"
          label={'Preorder now for $' + preorderTag}
          // title={titlePrefix}
          requiresAuth
          onClick={() => doOpenModal(MODALS.PREORDER_CONTENT, { uri, isSupport: true })}
        />
      </div>)}
    </>
  );
}
