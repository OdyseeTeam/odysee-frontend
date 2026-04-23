import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectListIsShuffledForId } from 'redux/selectors/content';
import { doToggleShuffleList } from 'redux/actions/content';

type Props = {
  url: string;
  id: string;
};

const ShuffleButton = (props: Props) => {
  const { url, id } = props;
  const dispatch = useAppDispatch();
  const shuffle = useAppSelector((state) => selectListIsShuffledForId(state, id));
  return (
    <Button
      button="alt"
      className={classnames('button--alt-no-style button-toggle', {
        'button-toggle--active': shuffle,
      })}
      title={__('Shuffle')}
      icon={ICONS.SHUFFLE}
      onClick={() =>
        dispatch(
          doToggleShuffleList({
            currentUri: url,
            collectionId: id,
          })
        )
      }
    />
  );
};

export default ShuffleButton;
