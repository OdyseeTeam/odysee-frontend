import { connect } from 'react-redux';

import { selectTitleForUri, selectClaimIsNsfwForUri } from 'redux/selectors/claims';
import { selectModal } from 'redux/selectors/app';
import { selectIsPlayerFloating, selectCanPlaybackFileForUri, selectHasUriPlaying } from 'redux/selectors/content';

import { doPlayNextUri, doSetShowAutoplayCountdownForUri } from 'redux/actions/content';

import withPlaybackUris from 'hocs/withPlaybackUris';

import AutoplayCountdown from './view';

/*
  AutoplayCountdown does not fetch it's own next content to play, it relies on <RecommendedContent> being rendered.
  This is dumb but I'm just the guy who noticed -kj
 */
const select = (state, props) => {
  const { uri, playNextUri } = props;

  return {
    playNextClaimTitle: selectTitleForUri(state, playNextUri),
    modal: selectModal(state),
    isMature: selectClaimIsNsfwForUri(state, uri),
    isFloating: selectIsPlayerFloating(state),
    canPlayback: selectCanPlaybackFileForUri(state, uri),
    hasUriPlaying: selectHasUriPlaying(state, uri),
  };
};

const perform = {
  doPlayNextUri,
  doSetShowAutoplayCountdownForUri,
};

export default withPlaybackUris(connect(select, perform)(AutoplayCountdown));
