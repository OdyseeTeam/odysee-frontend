// @flow
import React from 'react';
import classnames from 'classnames';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';

type Props = {
  isSelected?: boolean,
};

const AllSelector = (props: Props) => {
  const { isSelected } = props;

  return (
    <div className={classnames('channel-selector__item', { 'channel-selector__item--selected': isSelected })}>
      <Icon sectionIcon icon={ICONS.MORE} />
      <div className="channel-selector__text">{__('All Channels')}</div>
      {isSelected && <Icon icon={ICONS.DOWN} />}
    </div>
  );
};

export default AllSelector;
