import { connect } from 'react-redux';
import fileViewerEmbeddedEnded from './view';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import { selectContentStates } from 'redux/selectors/content';
import { PREFERENCE_EMBED } from 'constants/tags';

const select = (state, props) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  preferEmbed: makeSelectTagInClaimOrChannelForUri(props.uri, PREFERENCE_EMBED)(state),
  uriAccessKey: selectContentStates(state).uriAccessKeys[props.uri],
});

export default connect(select)(fileViewerEmbeddedEnded);
