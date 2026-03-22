import React from 'react';
import * as SETTINGS from 'constants/settings';
import { useAppSelector } from 'redux/hooks';
import { selectIsStreamPlaceholderForUri } from 'redux/selectors/claims';
import {
  selectNextUriForUriInPlayingCollectionForId,
  selectPreviousUriForUriInPlayingCollectionForId,
  selectIndexForUriInPlayingCollectionForId,
} from 'redux/selectors/collections';
import { selectPlayingCollectionId } from 'redux/selectors/content';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectNextRecommendedContentForUri } from 'redux/selectors/search';

type Props = {
  uri: string;
};

/**
 * HigherOrderComponent to implement the play next/play previous logic when it is needed to be selected
 * so it conditions to return the currently playing collection uris, or the next recommended uri that has been fetched
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withPlaybackUris = (Component: FunctionalComponentParam) => {
  const PlaybackUrisWrapper = (props: Props) => {
    const { uri, ...componentProps } = props;

    const playingCollectionId = useAppSelector(selectPlayingCollectionId);
    const nextPlaylistUri = useAppSelector((state) =>
      playingCollectionId ? selectNextUriForUriInPlayingCollectionForId(state, playingCollectionId, uri) : undefined
    );
    const previousListUri = useAppSelector((state) =>
      playingCollectionId ? selectPreviousUriForUriInPlayingCollectionForId(state, playingCollectionId, uri) : undefined
    );
    const autoplayNext = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT));
    const nextRecommendedUri = useAppSelector((state) => selectNextRecommendedContentForUri(state, uri));
    const currentPlaylistItemIndex = useAppSelector((state) =>
      playingCollectionId ? selectIndexForUriInPlayingCollectionForId(state, playingCollectionId, uri) : undefined
    );
    const isLivestreamClaim = useAppSelector((state) => selectIsStreamPlaceholderForUri(state, uri));

    const playNextUriRef = React.useRef(nextPlaylistUri || (autoplayNext && nextRecommendedUri));
    const playNextUri = React.useMemo(() => {
      if (nextPlaylistUri) {
        // handles current playing item is deleted case: stores the previous value for the next item
        if (currentPlaylistItemIndex !== null) {
          playNextUriRef.current = nextPlaylistUri;
          return nextPlaylistUri;
        } else {
          return playNextUriRef.current;
        }
      }

      return autoplayNext && !isLivestreamClaim ? nextRecommendedUri : null;
    }, [autoplayNext, currentPlaylistItemIndex, isLivestreamClaim, nextPlaylistUri, nextRecommendedUri]);
    // and "play previous" behaviours
    const playPreviousUriRef = React.useRef(previousListUri);
    const playPreviousUri = React.useMemo(() => {
      if (currentPlaylistItemIndex !== null) {
        playPreviousUriRef.current = previousListUri;
        return previousListUri;
      } else {
        return playPreviousUriRef.current;
      }
    }, [currentPlaylistItemIndex, previousListUri]);
    return <Component {...componentProps} uri={uri} playNextUri={playNextUri} playPreviousUri={playPreviousUri} />;
  };

  return PlaybackUrisWrapper;
};

export default withPlaybackUris;
