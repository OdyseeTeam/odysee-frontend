import React from 'react';
import * as ICONS from 'constants/icons';
import FileActionButton from 'component/common/file-action-button';
import { useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
type ButtonProps = {
  uri: string | null | undefined;
  collectionId: string;
};

const PlayButton = (props: ButtonProps) => {
  const { uri, collectionId } = props;
  const navigate = useNavigate();
  if (!uri) return null;

  function handlePlay() {
    navigate({
      pathname: formatLbryUrlForWeb(uri),
      search: generateListSearchUrlParams(collectionId),
      state: {
        forceAutoplay: true,
      },
    });
  }

  return <FileActionButton icon={ICONS.PLAY} title={__('Start Playing')} label={__('Play')} onClick={handlePlay} />;
};

export default PlayButton;
