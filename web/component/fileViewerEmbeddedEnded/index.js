import { connect } from 'react-redux';
import fileViewerEmbeddedEnded from './view';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import { PREFERENCE_EMBED } from 'constants/tags';
import { selectWindowPlayerObj } from 'redux/selectors/app';

const select = (state, props) => ({
  isAuthenticated: selectUserVerifiedEmail(state),
  preferEmbed: makeSelectTagInClaimOrChannelForUri(props.uri, PREFERENCE_EMBED)(state),
  windowPlayerObj: selectWindowPlayerObj(state),
});

export default connect(select)(fileViewerEmbeddedEnded);
