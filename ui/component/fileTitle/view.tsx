import * as React from 'react';
import classnames from 'classnames';
import { useAppSelector } from 'redux/hooks';
import { selectTitleForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
  className?: string;
  children?: React.ReactNode;
};

function FileTitle(props: Props) {
  const { uri, children, className } = props;
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  return (
    <h1 className={classnames(className)}>
      <span>{title}</span>
      {children}
    </h1>
  );
}

export default FileTitle;
