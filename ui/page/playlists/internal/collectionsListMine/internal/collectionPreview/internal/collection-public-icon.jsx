// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

const CollectionPublicIcon = () => (
  <div className="visibility">
    <Icon icon={ICONS.EYE} />
    <span>{__('Public')}</span>
  </div>
);

export default CollectionPublicIcon;
