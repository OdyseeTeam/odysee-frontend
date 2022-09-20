// @flow
import React from 'react';

type Props = {
  children: ?string,
};

const ErrorBubble = (props: Props) => {
  const { children } = props;

  if (!children) {
    return null;
  }

  return <span className="error__bubble">{children}</span>;
};

export default ErrorBubble;
