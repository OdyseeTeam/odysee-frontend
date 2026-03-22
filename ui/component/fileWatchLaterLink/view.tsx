import * as ICONS from 'constants/icons';
import React, { useRef } from 'react';
import Button from 'component/button';
import useHover from 'effects/use-hover';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { getLocalizedNameForCollectionId } from 'util/collections';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectCollectionForIdHasClaimUrl } from 'redux/selectors/collections';
import { doPlaylistAddAndAllowPlaying } from 'redux/actions/content';
type Props = {
  uri: string;
  focusable: boolean;
};

function FileWatchLaterLink(props: Props) {
  const { uri, focusable = true } = props;
  const dispatch = useAppDispatch();
  const hasClaimInWatchLater = useAppSelector((state) =>
    selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.WATCH_LATER_ID, uri)
  );
  const buttonRef = useRef();
  let isHovering = useHover(buttonRef);

  function handleWatchLater(e) {
    if (e) e.preventDefault();
    const collectionId = COLLECTIONS_CONSTS.WATCH_LATER_ID;
    dispatch(
      doPlaylistAddAndAllowPlaying({
        uri,
        collectionName: getLocalizedNameForCollectionId(collectionId) || COLLECTIONS_CONSTS.WATCH_LATER_NAME,
        collectionId,
      })
    );
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

export default React.memo(FileWatchLaterLink);
