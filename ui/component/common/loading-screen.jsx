// @flow
import React from 'react';
import classnames from 'classnames';
import Spinner from 'component/spinner';

type Props = {
  status?: string,
  spinner?: boolean,
  transparent?: boolean,
};

const LoadingScreen = (props: Props) => {
  const { status, spinner = true, transparent } = props;

  return (
    <div className={classnames('content__loading', { 'content__loading--transparent': transparent })}>
      {spinner && <Spinner light={!transparent} delayed={!transparent} text={status} />}
    </div>
  );
};

export default LoadingScreen;
