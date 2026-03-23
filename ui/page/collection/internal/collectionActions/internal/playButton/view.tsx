import React from 'react';
import * as ICONS from 'constants/icons';
import FileActionButton from 'component/common/file-action-button';
import { useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb, generateListSearchUrlParams } from 'util/url';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectUrlsForCollectionId } from 'redux/selectors/collections';
import { selectCanPlaybackFileForUri } from 'redux/selectors/content';
type ButtonProps = {
  collectionId: string;
};

const PlayButton = (props: ButtonProps) => {
  const { collectionId } = props;
  const collectionUrls = useAppSelector((state) => selectUrlsForCollectionId(state, collectionId));
  const uri = useAppSelector((state) => {
    return (
      collectionUrls?.find((url) => {
        const claim = selectClaimForUri(state, url);
        return Boolean(claim && claim.value_type !== 'deleted' && selectCanPlaybackFileForUri(state, url));
      }) || null
    );
  });
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
