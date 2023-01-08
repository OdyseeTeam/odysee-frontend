// @flow
import * as ICONS from 'constants/icons';
import React, { useRef } from 'react';
import Button from 'component/button';
import useHover from 'effects/use-hover';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { getLocalisedVersionForCollectionName } from 'util/collections';

type Props = {
  uri: string,
  focusable: boolean,
  hasClaimInWatchLater: boolean,
  doPlaylistAddAndAllowPlaying: (params: { uri: string, collectionName: string, collectionId: string }) => void,
};

function FileWatchLaterLink(props: Props) {
  const { uri, hasClaimInWatchLater, focusable = true, doPlaylistAddAndAllowPlaying } = props;

  const buttonRef = useRef();
  let isHovering = useHover(buttonRef);

  function handleWatchLater(e) {
    if (e) e.preventDefault();

    doPlaylistAddAndAllowPlaying({
      uri,
      collectionName: getLocalisedVersionForCollectionName(COLLECTIONS_CONSTS.WATCH_LATER_NAME),
      collectionId: COLLECTIONS_CONSTS.WATCH_LATER_ID,
    });
  }

  // text that will show if you keep cursor over button
  const title = hasClaimInWatchLater ? __('Remove from Watch Later') : __('Add to Watch Later');

  // label that is shown after hover
  const label = !hasClaimInWatchLater ? __('Watch Later') : __('Remove');

  return (
    <div className="claim-preview__hover-actions second-item">
      <Button
        ref={buttonRef}
        requiresAuth
        title={title}
        label={label}
        className="button--file-action"
        icon={(hasClaimInWatchLater && (isHovering ? ICONS.REMOVE : ICONS.COMPLETED)) || ICONS.TIME}
        onClick={(e) => handleWatchLater(e)}
        tabIndex={focusable ? 0 : -1}
      />
    </div>
  );
}

export default FileWatchLaterLink;
