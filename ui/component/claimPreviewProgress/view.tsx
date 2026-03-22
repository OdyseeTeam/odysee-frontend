import React from 'react';
type Props = {
  uri: string;
  position: number | null | undefined;
  duration: number | null | undefined;
};
function ClaimPreviewProgress(props: Props) {
  const { position, duration } = props;

  if (!position || !duration) {
    return null;
  }

  return (
    <div className="claim-preview__progress-section">
      <div
        className="claim-preview__progress-bar"
        style={{
          width: `${(position / duration) * 100}%`,
        }}
      />
    </div>
  );
}

export default React.memo(ClaimPreviewProgress);
