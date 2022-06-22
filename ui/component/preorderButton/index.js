import { connect } from 'react-redux';
import { selectTagsForUri, selectPreorderTag, selectClaimForUri } from 'redux/selectors/claims';
import { selectFollowedTags } from 'redux/selectors/tags';
import ClaimTags from './view';
import { doOpenModal } from 'redux/actions/app';

const select = (state, props) => ({
  tags: selectTagsForUri(state, props.uri),
  followedTags: selectFollowedTags(state),
  preorderTag: selectPreorderTag(state, props.uri),
  claim: selectClaimForUri(state, props.uri),
});

const perform = {
  doOpenModal,
};

export default connect(select, perform)(ClaimTags);
