// @flow
import React from 'react';

type Props = {
  // -- redux --
  nextPlaylistUri: string,
  previousListUri: string,
  autoplayNext: boolean,
  nextRecommendedUri: ?string,
  currentPlaylistItemIndex: ?number,
  isLivestreamClaim: ?boolean,
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
    const {
      // -- redux --
      nextPlaylistUri,
      previousListUri,
      autoplayNext,
      nextRecommendedUri,
      currentPlaylistItemIndex,
      isLivestreamClaim,
      ...componentProps
    } = props;

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

    return <Component {...componentProps} playNextUri={playNextUri} playPreviousUri={playPreviousUri} />;
  };

  return PlaybackUrisWrapper;
};

export default withPlaybackUris;
