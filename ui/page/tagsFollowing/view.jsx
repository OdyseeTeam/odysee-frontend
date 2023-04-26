// @flow
import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import React from 'react';
import ClaimListDiscover from 'component/claimListDiscover';
import Page from 'component/page';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as CS from 'constants/claim_search';

type Props = {
  tileLayout: boolean,
};

function TagsFollowingPage(props: Props) {
  const { tileLayout } = props;

  return (
    <Page noFooter fullWidthPage>
      <ClaimListDiscover
        headerLabel={
          <h1 className="page__title">
            <Icon icon={ICONS.TAG} />
            <label>{__('Your Tags')}</label>
          </h1>
        }
        personalView
        defaultTags={CS.TAGS_FOLLOWED}
        tileLayout={tileLayout}
        meta={
          <Button
            button="secondary"
            icon={ICONS.EDIT}
            label={__('Manage')}
            requiresAuth={IS_WEB}
            navigate={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`}
          />
        }
      />
    </Page>
  );
}

export default TagsFollowingPage;
