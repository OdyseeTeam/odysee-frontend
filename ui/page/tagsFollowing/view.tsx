import * as PAGES from 'constants/pages';
import * as ICONS from 'constants/icons';
import * as SETTINGS from 'constants/settings';
import React from 'react';
import ClaimListDiscover from 'component/claimListDiscover';
import Page from 'component/page';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as CS from 'constants/claim_search';
import { useAppSelector } from 'redux/hooks';
import { selectClientSetting } from 'redux/selectors/settings';

function TagsFollowingPage() {
  const tileLayout = useAppSelector((state) => selectClientSetting(state, SETTINGS.TILE_LAYOUT));

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
            button="alt"
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
