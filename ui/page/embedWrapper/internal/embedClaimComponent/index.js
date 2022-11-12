import { connect } from 'react-redux';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';

import withResolvedClaimRender from 'hocs/withResolvedClaimRender';

import EmbedClaimComponent from './view';

const select = (state, props) => {
  const { uri } = props;

  return {
    renderMode: makeSelectFileRenderModeForUri(uri)(state),
  };
};

export default withResolvedClaimRender(connect(select)(EmbedClaimComponent));
