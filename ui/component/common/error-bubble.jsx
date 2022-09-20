// @flow
import React from 'react';

type Props = {
  children: string,
};

export default function ErrorText(props: Props) {
  const { children } = props;

  if (!children) {
    return null;
  }

  return <span className="error__bubble">{children}</span>;
}
