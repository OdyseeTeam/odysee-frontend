// @flow
import React from 'react';

import './style.scss';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

type Props = {
  uri: ?string,
  // --- internal ---
  isUnlisted: boolean,
};

function FileVisibility(props: Props) {
  const { isUnlisted } = props;

  if (isUnlisted) {
    return (
      <div className="file-visibility">
        <Icon icon={ICONS.COPY_LINK} size={9} />
        {__('unlisted')}
      </div>
    );
  }

  return null;
}

export default FileVisibility;
