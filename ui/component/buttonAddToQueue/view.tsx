import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import { MenuItem } from 'component/common/menu';
import Icon from 'component/common/icon';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doCollectionEdit } from 'redux/actions/collections';
import { selectCollectionForIdHasClaimUrl, selectUrlsForCollectionId } from 'redux/selectors/collections';
import { selectClaimForUri } from 'redux/selectors/claims';
import { doToast } from 'redux/actions/notifications';
import { doStartFloatingPlayingUri, doSetPlayingUri } from 'redux/actions/content';
import { selectPlayingUri } from 'redux/selectors/content';
import { selectClientSetting } from 'redux/selectors/settings';
import { doResolveUri } from 'redux/actions/claims';
import { doFileGetForUri } from 'redux/actions/file';
type Props = {
  uri: string;
  focusable: boolean;
  menuItem?: boolean;
};

function ButtonAddToQueue(props: Props) {
  const { uri, focusable = true, menuItem } = props;
  const dispatch = useAppDispatch();
  const playingUri = useAppSelector(selectPlayingUri);
  const { collectionId: playingCollectionId } = playingUri.collection || {};
  const playingUrl = useAppSelector((state) => selectClaimForUri(state, playingUri.uri))?.permanent_url;
  const autoplayMedia = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA));
  const hasClaimInQueue = useAppSelector((state) =>
    selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, uri)
  );
  const hasPlayingUriInQueue = Boolean(
    useAppSelector(
      (state) => playingUrl && selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, playingUrl)
    )
  );
  const playingCollectionUrls = useAppSelector(
    (state) =>
      playingCollectionId &&
      playingCollectionId !== COLLECTIONS_CONSTS.QUEUE_ID &&
      selectUrlsForCollectionId(state, playingCollectionId)
  );

  async function handleQueue(e) {
    if (e) e.preventDefault();
    dispatch(
      doToast({
        message: hasClaimInQueue ? __('Item removed from Queue') : __('Item added to Queue'),
      })
    );
    const itemsToAdd = playingCollectionUrls || [playingUrl];
    dispatch(
      doCollectionEdit(COLLECTIONS_CONSTS.QUEUE_ID, {
        uris: playingUrl && playingUrl !== uri && !hasPlayingUriInQueue ? [...itemsToAdd, uri] : [uri],
        remove: hasClaimInQueue,
        type: COLLECTIONS_CONSTS.COL_TYPES.PLAYLIST,
      })
    );

    if (!hasClaimInQueue) {
      const paramsToAdd = {
        collection: {
          collectionId: COLLECTIONS_CONSTS.QUEUE_ID,
        },
        source: COLLECTIONS_CONSTS.QUEUE_ID,
      };

      if (playingUrl) {
        // adds the queue collection id to the playingUri data so it can be used and updated by other components
        if (!hasPlayingUriInQueue && autoplayMedia) dispatch(doSetPlayingUri({ ...playingUri, ...paramsToAdd }));
      } else if (autoplayMedia) {
        // Resolve claim fully, fetch streaming URL, then start floating player
        await dispatch(doResolveUri(uri, false));
        dispatch(doFileGetForUri(uri));
        dispatch(
          doStartFloatingPlayingUri({
            uri,
            ...paramsToAdd,
          })
        );
      }
    }
  }

  // label that is shown after hover
  const label = !hasClaimInQueue ? __('Add to Queue') : __('In Queue');

  if (menuItem) {
    return (
      <MenuItem className="comment__menu-option" onSelect={handleQueue}>
        <div className="menu__link">
          <Icon aria-hidden icon={hasClaimInQueue ? ICONS.PLAYLIST_FILLED : ICONS.PLAYLIST} />
          {hasClaimInQueue ? __('In Queue') : __('Add to Queue')}
        </div>
      </MenuItem>
    );
  }

  return (
    <div className="claim-preview__hover-actions third-item">
      <Button
        title={__('Queue Mode')}
        label={label}
        className="button--file-action"
        icon={hasClaimInQueue ? ICONS.PLAYLIST_FILLED : ICONS.PLAYLIST_ADD}
        onClick={(e) => handleQueue(e)}
        tabIndex={focusable ? 0 : -1}
      />
    </div>
  );
}

export default React.memo(ButtonAddToQueue);
