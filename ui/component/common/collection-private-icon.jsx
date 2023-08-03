// @flow
import React from 'react';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

const CollectionPrivateIcon = () => (
  <div className="visibility">
    <Icon icon={ICONS.LOCK} />
    <span>{__('Private')}</span>
  </div>
);

export default CollectionPrivateIcon;
