import { connect } from 'react-redux';
import { selectPublishFormValue, selectIsStillEditing, selectMemberRestrictionStatus } from 'redux/selectors/publish';
import PublishFormErrors from './view';

const select = (state) => ({
  bid: selectPublishFormValue(state, 'bid'),
  name: selectPublishFormValue(state, 'name'),
  title: selectPublishFormValue(state, 'title'),
  bidError: selectPublishFormValue(state, 'bidError'),
  fileBitrate: selectPublishFormValue(state, 'fileBitrate'),
  fileSizeTooBig: selectPublishFormValue(state, 'fileSizeTooBig'),
  editingURI: selectPublishFormValue(state, 'editingURI'),
  uploadThumbnailStatus: selectPublishFormValue(state, 'uploadThumbnailStatus'),
  thumbnail: selectPublishFormValue(state, 'thumbnail'),
  thumbnailError: selectPublishFormValue(state, 'thumbnailError'),
  releaseTimeError: selectPublishFormValue(state, 'releaseTimeError'),
  memberRestrictionStatus: selectMemberRestrictionStatus(state),
  isStillEditing: selectIsStillEditing(state),
});

export default connect(select)(PublishFormErrors);
