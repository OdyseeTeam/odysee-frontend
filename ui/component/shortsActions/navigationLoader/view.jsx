// @flow
import React from 'react';
import classnames from 'classnames';
import './style.scss';

type Props = {
  className?: string,
  size?: 'small' | 'medium' | 'large',
};

const NavigationLoader = (props: Props) => {
  const { className, size = 'medium' } = props;

  return (
    <div className={classnames('vertical-loader', className, `vertical-loader--${size}`)}>
      <span className="vertical-loader__dot" />
      <span className="vertical-loader__dot" />
      <span className="vertical-loader__dot" />
    </div>
  );
};

export default NavigationLoader;
