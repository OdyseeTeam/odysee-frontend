// @flow
import React from 'react';
import Button from 'component/button';

type Props = {
  claimId: string,
  claimIsMine: boolean,
  doAknowledgeNsfw: (claimId: string) => void,
};

const NsfwContentOverlay = (props: Props) => {
  const { claimId, claimIsMine, doAknowledgeNsfw } = props;

  if (claimIsMine) return null;

  return (
    <div className="nsfw-content-overlay">
      <span>{__('This content is marked as mature')}</span>

      <Button button="primary" label={__('View Content')} onClick={() => doAknowledgeNsfw(claimId)} />
    </div>
  );
};

export default NsfwContentOverlay;
