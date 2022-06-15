// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import * as COLLECTIONS_CONSTS from 'constants/collections';

type Props = {
  uri: string,
  focusable: boolean,
  // -- redux --
  hasClaimInQueue: boolean,
  hasPlayingUriInQueue: boolean,
  playingUri: PlayingUri,
  playingUrl: ?string,
  doToast: (props: { message: string }) => void,
  doCollectionEdit: (id: string, any) => void,
  doUriInitiatePlay: (playingOptions: PlayingUri, isPlayable?: boolean, isFloating?: boolean) => void,
  doSetPlayingUri: (props: any) => void,
};

function FileAddToQueueLink(props: Props) {
  const {
    uri,
    focusable = true,
    hasClaimInQueue,
    hasPlayingUriInQueue,
    playingUri,
    playingUrl,
    doToast,
    doCollectionEdit,
    doUriInitiatePlay,
    doSetPlayingUri,
  } = props;

  function handleQueue(e) {
    e.preventDefault();
    doToast({ message: hasClaimInQueue ? __('Item removed from Queue') : __('Item added to Queue') });
    doCollectionEdit(COLLECTIONS_CONSTS.QUEUE_ID, {
      uris: playingUrl && playingUrl !== uri && !hasPlayingUriInQueue ? [playingUrl, uri] : [uri],
      remove: hasClaimInQueue,
      type: 'playlist',
    });

    if (!hasClaimInQueue) {
      const paramsToAdd = {
        collection: { collectionId: COLLECTIONS_CONSTS.QUEUE_ID },
        source: COLLECTIONS_CONSTS.QUEUE_ID,
      };

      if (playingUrl) {
        // adds the queue collection id to the playingUri data so it can be used and updated by other components
        if (!hasPlayingUriInQueue) doSetPlayingUri({ ...playingUri, ...paramsToAdd });
      } else {
        // There is nothing playing and added a video to queue -> the first item will play on the floating player with the list open
        doUriInitiatePlay({ uri, ...paramsToAdd }, true, true);
      }
    }
  }

  // label that is shown after hover
  const label = !hasClaimInQueue ? __('Add to Queue') : __('In Queue');

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

export default FileAddToQueueLink;
