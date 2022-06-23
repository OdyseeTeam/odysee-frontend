import { connect } from 'react-redux';
import { selectTagsForUri, selectPreorderTag, selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import { selectFollowedTags } from 'redux/selectors/tags';
import ClaimTags from './view';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    tags: selectTagsForUri(state, props.uri),
    followedTags: selectFollowedTags(state),
    preorderTag: selectPreorderTag(state, props.uri),
    claimIsMine: selectClaimIsMine(state, claim),
    claim,
  };
};

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ClaimTags);
