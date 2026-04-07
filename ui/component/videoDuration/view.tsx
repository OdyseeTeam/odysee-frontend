import React from 'react';
import formatMediaDuration from 'util/formatMediaDuration';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
type Props = {
  uri: string;
  className?: string;
};

function VideoDuration(props: Props) {
  const { uri, className } = props;
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const media = claim && claim.value && (claim.value.video || claim.value.audio);
  let duration;

  if (media && media.duration) {
    duration = formatMediaDuration(media.duration);
  }

  return duration ? <span className={className}>{duration}</span> : null;
}

export default React.memo(VideoDuration);
