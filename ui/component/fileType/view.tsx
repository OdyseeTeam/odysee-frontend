import * as ICONS from 'constants/icons';
import React from 'react';
import Icon from 'component/common/icon';
import * as COL from 'constants/collections';
import { useAppSelector } from 'redux/hooks';
import { makeSelectMediaTypeForUri } from 'redux/selectors/file_info';
import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
  small: boolean;
};

function FileType(props: Props) {
  const { uri, small } = props;
  const mediaType = useAppSelector((state) => makeSelectMediaTypeForUri(uri)(state));
  const isLivestream = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));
  const size = small ? COL.ICON_SIZE : undefined;

  if (mediaType === 'image') {
    return <Icon size={size} icon={ICONS.IMAGE} />;
  } else if (mediaType === 'audio') {
    return <Icon size={size} icon={ICONS.AUDIO} />;
  } else if (mediaType === 'video' || isLivestream) {
    return <Icon size={size} icon={ICONS.VIDEO} />;
  } else if (mediaType === 'text') {
    return <Icon size={size} icon={ICONS.TEXT} />;
  }

  return <Icon icon={ICONS.DOWNLOADABLE} />;
}

export default React.memo(FileType);
