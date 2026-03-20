import { connect } from "react-redux";
import { doCollectionEdit } from "redux/actions/collections";
import { selectCollectionForIdHasClaimUrl, selectUrlsForCollectionId } from "redux/selectors/collections";
import { selectClaimForUri } from "redux/selectors/claims";
import * as COLLECTIONS_CONSTS from "constants/collections";
import * as SETTINGS from "constants/settings";
import ButtonAddToQueue from "./view";
import { doToast } from "redux/actions/notifications";
import { doStartFloatingPlayingUri, doSetPlayingUri } from "redux/actions/content";
import { selectPlayingUri } from "redux/selectors/content";
import { selectClientSetting } from "redux/selectors/settings";
import { doResolveUri } from "redux/actions/claims";
import { doFileGetForUri } from "redux/actions/file";

const select = (state, props) => {
  const {
    uri
  } = props;
  const playingUri = selectPlayingUri(state);
  const {
    collectionId
  } = playingUri.collection || {};
  const {
    permanent_url: playingUrl
  } = selectClaimForUri(state, playingUri.uri) || {};
  return {
    playingUri,
    playingUrl,
    autoplayMedia: selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA),
    hasClaimInQueue: selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, uri),
    hasPlayingUriInQueue: Boolean(playingUrl && selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.QUEUE_ID, playingUrl)),
    playingCollectionUrls: collectionId && collectionId !== COLLECTIONS_CONSTS.QUEUE_ID && selectUrlsForCollectionId(state, collectionId)
  };
};

const perform = {
  doToast,
  doCollectionEdit,
  doStartFloatingPlayingUri,
  doSetPlayingUri,
  doResolveUri,
  doFileGetForUri
};
export default connect(select, perform)(ButtonAddToQueue);