// @flow
import React from 'react';

type Props = {
  livestream?: boolean,
  isLive?: boolean,
  // --- redux ---
  claimId: ?string,
  fetchViewCount: (string) => void,
  uri: string,
  viewCount: string,
  activeViewers?: number,
};

function FileViewCount(props: Props) {
  const { claimId, fetchViewCount, viewCount, livestream, activeViewers, isLive = false } = props;

  // @Note: it's important this only runs once on initial render.
  React.useEffect(() => {
    if (claimId) {
      fetchViewCount(claimId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formattedViewCount = Number(viewCount).toLocaleString();

  return (
    <span className="media__subtitle--centered">
      {livestream &&
        __('%viewer_count% currently %viewer_state%', {
          viewer_count: activeViewers === undefined ? '...' : activeViewers,
          viewer_state: isLive ? __('watching') : __('waiting'),
        })}
      {!livestream &&
        activeViewers === undefined &&
        (viewCount !== 1 ? __('%view_count% views', { view_count: formattedViewCount }) : __('1 view'))}
    </span>
  );
}

export default FileViewCount;
