// @flow
import React from 'react';

type Props = {
  claim: ?ChannelClaim,
  title: ?string,
};

function ChannelPreview(props: Props) {
  const { title, claim } = props;

  if (!claim) {
    return null;
  }

  return <div>{title || claim.name}</div>;
}

export default ChannelPreview;
