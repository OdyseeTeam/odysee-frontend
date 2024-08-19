// @flow
import React from 'react';

import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

type Props = {
  shownFields: ?Array<string>,
  // --- internal ---
  isUnlisted: boolean,
  isAgeRestricted: boolean,
};

function FileVisibility(props: Props) {
  const { isUnlisted, isAgeRestricted, shownFields } = props;
  const showUnlisted = !shownFields ? true : shownFields.includes('unlisted');
  const showAgeRestriced = !shownFields ? true : shownFields.includes('age-restriced');

  return (
    <>
      {isUnlisted && showUnlisted && (
        <div className="file-visibility">
          <Icon icon={ICONS.COPY_LINK} size={9} />
          {__('unlisted')}
        </div>
      )}
      {isAgeRestricted && showAgeRestriced && (
        <div className="file-visibility file-visibility-age-restriced">{__('18+')}</div>
      )}
    </>
  );
}

export default FileVisibility;
