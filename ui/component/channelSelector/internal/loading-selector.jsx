// @flow
import React from 'react';
import classnames from 'classnames';

type Props = {
  isSelected?: boolean,
};

const LoadingSelector = (props: Props) => {
  const { isSelected } = props;

  return (
    <div className={classnames('channel__list-item', { 'channel__list-item--selected': isSelected })}>
      <div className="channel__list-text">{__('Loading channels...')}</div>
    </div>
  );
};

export default LoadingSelector;
