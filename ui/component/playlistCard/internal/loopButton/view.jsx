// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';

type Props = {
  id: string,
  // -- redux --
  loop: boolean,
  doToggleLoopList: (params: { collectionId: string }) => void,
};

const LoopButton = (props: Props) => {
  const { id, loop, doToggleLoopList } = props;

  return (
    <Button
      button="alt"
      className={classnames('button--alt-no-style button-toggle', {
        'button-toggle--active': loop,
      })}
      title={__('Loop')}
      icon={ICONS.REPEAT}
      onClick={() => doToggleLoopList({ collectionId: id })}
    />
  );
};

export default LoopButton;
