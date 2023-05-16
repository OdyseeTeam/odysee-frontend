// @flow
import React from 'react';
import classnames from 'classnames';

type Props = {
  isSelected?: boolean,
};

const LoadingSelector = (props: Props) => {
  const { isSelected } = props;

  return (
    <div className={classnames('channel-selector__item', { 'channel-selector__item--selected': isSelected })}>
      <div className="channel-selector__text">{__('Loading channels...')}</div>
    </div>
  );
};

export default LoadingSelector;
