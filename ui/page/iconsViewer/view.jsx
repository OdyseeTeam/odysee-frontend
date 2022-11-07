// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Page from 'component/page';
import Icon from 'component/common/icon';
import './style.scss';

type Props = {};

function TagsFollowingPage(props: Props) {
  return (
    <Page noFooter fullWidthPage>
      {Object.keys(ICONS)
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => (
          <>
            <div style={{ marginBottom: '15px' }}>
              <Icon icon={ICONS[tag]} size={10} className="listed-icon" />
              <h2 className="icon-display-name">{tag}</h2>
              <br />
            </div>
          </>
        ))}
    </Page>
  );
}

export default TagsFollowingPage;
