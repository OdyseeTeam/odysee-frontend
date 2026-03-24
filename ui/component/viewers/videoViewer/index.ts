import React from 'react';
import VideoViewer from './view';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimForUri,
  selectThumbnailForUri,
  selectPurchaseTagForUri,
  selectPurchaseMadeForClaimId,
  selectRentalTagForUri,
  selectProtectedContentTagForUri,
  makeSelectTagInClaimOrChannelForUri,
} from 'redux/selectors/claims';
import { isStreamPlaceholderClaim, getChannelIdFromClaim, isClaimUnlisted } from 'util/claim';
import { selectActiveLivestreamForChannel } from 'redux/selectors/livestream';
import { selectNextUriForUriInPlayingCollectionForId } from 'redux/selectors/collections';
import * as SETTINGS from 'constants/settings';
import * as TAGS from 'constants/tags';
import {
  doChangeVolume,
  doChangeMute,
  doAnalyticsBuffer,
  doAnalyticsViewForUri,
  doSetVideoSourceLoaded,
} from 'redux/actions/app';
import { selectVolume, selectMute } from 'redux/selectors/app';
import {
  savePosition,
  clearPosition,
  doPlayNextUri,
  doSetContentHistoryItem,
  doSetShowAutoplayCountdownForUri,
} from 'redux/actions/content';
import { selectContentPositionForUri, selectPlayingUri, selectIsPlayerFloating } from 'redux/selectors/content';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import { selectDaemonSettings, selectClientSetting, selectHomepageData } from 'redux/selectors/settings';
import { toggleVideoTheaterMode, toggleAutoplayNext, doSetClientSetting } from 'redux/actions/settings';
import { selectUserVerifiedEmail, selectUser } from 'redux/selectors/user';
import { selectRecommendedContentForUri } from 'redux/selectors/search';
import { parseURI } from 'util/lbryURI';
import { doToast } from 'redux/actions/notifications';
import withPlaybackUris from 'hocs/withPlaybackUris';

function VideoViewerWithRedux(props: any) {
  const { uri, ...rest } = props;
  const dispatch = useAppDispatch();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { search, pathname, hash } = location;

  const urlParams = new URLSearchParams(search);
  const autoplay = urlParams.get('autoplay');
  const urlPath = `lbry://${(pathname + (hash || '')).slice(1)}`;
  let startTime: number | undefined;
  try {
    ({ startTime } = parseURI(urlPath) as any);
  } catch (e) {}

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const claimId = claim?.claim_id;
  const channelId = getChannelIdFromClaim(claim);
  const storedPosition = useAppSelector((state) => selectContentPositionForUri(state, uri));
  const position = startTime || (urlParams.get('t') !== null ? urlParams.get('t') : storedPosition);
  const user = useAppSelector(selectUser);
  const userId = user?.id;
  const internalFeature = user?.internal_feature;
  const playingUri = useAppSelector(selectPlayingUri);
  const collectionId = playingUri?.collection?.collectionId;
  const isMarkdownOrComment = playingUri?.source === 'markdown' || playingUri?.source === 'comment';
  const nextPlaylistUri = useAppSelector((state) =>
    collectionId ? selectNextUriForUriInPlayingCollectionForId(state, collectionId, uri) : undefined
  );

  const volume = useAppSelector(selectVolume);
  const muted = useAppSelector(selectMute);
  const videoPlaybackRate = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_PLAYBACK_RATE));
  const thumbnail = useAppSelector((state) => selectThumbnailForUri(state, uri));
  const homepageData = useAppSelector(selectHomepageData) || {};
  const authenticated = useAppSelector(selectUserVerifiedEmail);
  const videoTheaterMode = useAppSelector((state) => selectClientSetting(state, SETTINGS.VIDEO_THEATER_MODE));
  const activeLivestreamForChannel = useAppSelector((state) => selectActiveLivestreamForChannel(state, channelId));
  const isLivestreamClaim = isStreamPlaceholderClaim(claim);
  const defaultQuality = useAppSelector((state) => selectClientSetting(state, SETTINGS.DEFAULT_VIDEO_QUALITY));
  const isPurchasableContent = Boolean(useAppSelector((state) => selectPurchaseTagForUri(state, uri)));
  const isRentableContent = Boolean(useAppSelector((state) => selectRentalTagForUri(state, uri)));
  const purchaseMadeForClaimId = useAppSelector((state) =>
    claimId ? selectPurchaseMadeForClaimId(state, claimId) : undefined
  );
  const isProtectedContent = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  const isDownloadDisabled = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, TAGS.DISABLE_DOWNLOAD_BUTTON_TAG)(state)
  );
  const recomendedContent = useAppSelector((state) => selectRecommendedContentForUri(state, uri));
  const autoPlayNextShort = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT_SHORTS));
  const isFloating = useAppSelector(selectIsPlayerFloating);
  const autoplayNext = !isMarkdownOrComment && useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_NEXT));
  const floatingPlayer = useAppSelector((state) => selectClientSetting(state, SETTINGS.FLOATING_PLAYER));
  const autoplayMedia = useAppSelector((state) => selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA));

  const match = { params, path: pathname, url: pathname, isExact: true };

  return React.createElement(VideoViewer, {
    ...rest,
    uri,
    location,
    match,
    navigate,
    position,
    userId,
    internalFeature,
    collectionId,
    nextPlaylistUri,
    isMarkdownOrComment,
    autoplayIfEmbedded: Boolean(autoplay),
    autoplayNext,
    volume: volume ?? 1,
    muted: muted ?? false,
    videoPlaybackRate,
    thumbnail,
    claim,
    homepageData,
    authenticated,
    shareTelemetry: true,
    videoTheaterMode,
    activeLivestreamForChannel,
    isLivestreamClaim,
    defaultQuality,
    isPurchasableContent,
    isRentableContent,
    purchaseMadeForClaimId,
    isProtectedContent,
    isDownloadDisabled,
    recomendedContent,
    autoPlayNextShort,
    isFloating,
    floatingPlayer,
    setFloatingPlayer: (v: boolean) => dispatch(doSetClientSetting(SETTINGS.FLOATING_PLAYER, v)),
    autoplayMedia,
    setAutoplayMedia: (v: boolean) => dispatch(doSetClientSetting(SETTINGS.AUTOPLAY_MEDIA, v)),
    doSyncLastPosition: (u: string, p: number) => {}, // TODO: wire to sync action
    doClearContentHistoryUri: (u: string) => {}, // TODO: wire to content action
    changeVolume: (v: number) => dispatch(doChangeVolume(v)),
    savePosition: (u: string, p: number) => dispatch(savePosition(u, p)),
    clearPosition: (u: string) => dispatch(clearPosition(u)),
    changeMute: (m: boolean) => dispatch(doChangeMute(m)),
    doAnalyticsBuffer: (u: string, data: any) => dispatch(doAnalyticsBuffer(u, data)),
    toggleVideoTheaterMode: () => dispatch(toggleVideoTheaterMode()),
    toggleAutoplayNext: () => dispatch(toggleAutoplayNext()),
    setVideoPlaybackRate: (rate: number) => dispatch(doSetClientSetting(SETTINGS.VIDEO_PLAYBACK_RATE, rate)),
    doPlayNextUri: (p: any) => dispatch(doPlayNextUri(p)),
    doAnalyticsViewForUri: (u: string) => dispatch(doAnalyticsViewForUri(u)),
    claimRewards: () => dispatch(doClaimEligiblePurchaseRewards()),
    doToast: (p: any) => dispatch(doToast(p)),
    doSetContentHistoryItem: (u: string) => dispatch(doSetContentHistoryItem(u)),
    doSetShowAutoplayCountdownForUri: (p: any) => dispatch(doSetShowAutoplayCountdownForUri(p)),
    doSetVideoSourceLoaded: (u: string) => dispatch(doSetVideoSourceLoaded(u)),
  });
}

export default withPlaybackUris(VideoViewerWithRedux);
