// @flow
import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import { SIMPLE_SITE } from 'config';
import HelpLink from 'component/common/help-link';
import Tooltip from 'component/common/tooltip';
import { toCompactNotation } from 'util/string';

type Props = {
  // --- redux ---
  claimId: ?string,
  isLivestreamClaim?: boolean,
  isLivestreamActive: ?boolean,
  fetchViewCount: (string) => void,
  uri: string,
  viewCount: ?number,
  activeViewers?: number,
  lang: string,
};

function FileViewCount(props: Props) {
  const { claimId, isLivestreamClaim, isLivestreamActive, fetchViewCount, viewCount, activeViewers, lang } = props;

  const count = isLivestreamClaim ? activeViewers || 0 : viewCount;
  // $FlowIgnore: Number.isInteger covers null case
  const countCompact = Number.isInteger(count) ? toCompactNotation(count, lang, 10000) : null;
  const countFullResolution = Number(count).toLocaleString();

  const Placeholder = <Skeleton variant="text" animation="wave" className="file-view-count-placeholder" />;

  function getRegularViewCountElem() {
    if (Number.isInteger(viewCount)) {
      return viewCount !== 1 ? __('%view_count% views', { view_count: countCompact }) : __('1 view');
    } else {
      return Placeholder;
    }
  }

  function getLivestreamViewCountElem() {
    if (activeViewers === undefined) {
      return Placeholder;
    } else {
      return __('%viewer_count% currently %viewer_state%', {
        viewer_count: countCompact,
        viewer_state: isLivestreamActive ? __('watching') : __('waiting'),
      });
    }
  }

  React.useEffect(() => {
    if (claimId) {
      fetchViewCount(claimId);
    }
  }, [claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Tooltip title={countFullResolution} followCursor placement="top">
      <span className="media__subtitle--centered">
        {isLivestreamClaim && getLivestreamViewCountElem()}
        {!isLivestreamClaim && activeViewers === undefined && getRegularViewCountElem()}
        {!SIMPLE_SITE && <HelpLink href="https://help.odysee.tv/category-basics/" />}
      </span>
    </Tooltip>
  );
}

export default FileViewCount;
