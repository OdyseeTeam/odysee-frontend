// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';

type Props = {
  url: string,
  id: string,
  // -- redux --
  shuffle: boolean,
  doToggleShuffleList: (params: { currentUri?: string, collectionId: string, hideToast?: boolean }) => void,
};

const ShuffleButton = (props: Props) => {
  const { url, id, shuffle, doToggleShuffleList } = props;

  return (
    <Button
      button="alt"
      className={classnames('button--alt-no-style button-toggle', {
        'button-toggle--active': shuffle,
      })}
      title={__('Shuffle')}
      icon={ICONS.SHUFFLE}
      onClick={() => doToggleShuffleList({ currentUri: url, collectionId: id })}
    />
  );
};

export default ShuffleButton;
