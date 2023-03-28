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
      <h2 className="channel__list-text">{__('Loading channels...')}</h2>
    </div>
  );
};

export default LoadingSelector;
