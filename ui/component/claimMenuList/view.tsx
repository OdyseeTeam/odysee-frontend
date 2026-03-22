import { URL, SHARE_DOMAIN_URL } from 'config';
import { NavLink } from 'react-router-dom';
import { ChannelPageContext } from 'contexts/channel';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import * as SETTINGS from 'constants/settings';
import * as RENDER_MODES from 'constants/file_render_modes';
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import { COLLECTION_PAGE as CP } from 'constants/urlParams';
import Icon from 'component/common/icon';
import {
  generateShareUrl,
  generateRssUrl,
  generateLbryContentUrl,
  generateShortShareUrl,
  formatLbryUrlForWeb,
} from 'util/url';
import { useNavigate } from 'react-router-dom';
import { getChannelIdFromClaim, isStreamPlaceholderClaim } from 'util/claim';
import { buildURI, parseURI } from 'util/lbryURI';
import { EmbedContext } from 'contexts/embed';
import ButtonAddToQueue from 'component/buttonAddToQueue';
import { isClaimAllowedForCollection } from 'util/collections';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectClaimIsMine, selectIsUriUnlisted } from 'redux/selectors/claims';
import { doPrepareEdit } from 'redux/actions/publish';
import { doRemovePersonalRecommendation } from 'redux/actions/search';
import {
  selectCollectionForIdHasClaimUrl,
  selectCollectionIsMine,
  selectCollectionHasEditsForId,
  selectCollectionIsEmptyForId,
  makeSelectClaimMenuCollectionsForUrl,
} from 'redux/selectors/collections';
import { selectFileInfoForUri } from 'redux/selectors/file_info';
import { makeSelectChannelIsMuted } from 'redux/selectors/blocked';
import { doChannelMute as doChannelMuteAction, doChannelUnmute as doChannelUnmuteAction } from 'redux/actions/blocked';
import { doOpenModal } from 'redux/actions/app';
import {
  doCommentModBlock as doCommentModBlockAction,
  doCommentModUnBlock as doCommentModUnBlockAction,
  doCommentModBlockAsAdmin as doCommentModBlockAsAdminAction,
  doCommentModUnBlockAsAdmin as doCommentModUnBlockAsAdminAction,
} from 'redux/actions/comments';
import {
  selectHasAdminChannel,
  makeSelectChannelIsBlocked,
  makeSelectChannelIsAdminBlocked,
} from 'redux/selectors/comments';
import { doToast as doToastAction } from 'redux/actions/notifications';
import {
  doChannelSubscribe as doChannelSubscribeAction,
  doChannelUnsubscribe as doChannelUnsubscribeAction,
} from 'redux/actions/subscriptions';
import { selectIsSubscribedForUri } from 'redux/selectors/subscriptions';
import { selectIsProtectedContentLockedFromUserForId } from 'redux/selectors/memberships';
import { selectClientSetting } from 'redux/selectors/settings';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { selectFileRenderModeForUri } from 'redux/selectors/content';
import {
  doEnableCollectionShuffle as doEnableCollectionShuffleAction,
  doFetchUriAccessKey as doFetchUriAccessKeyAction,
  doPlaylistAddAndAllowPlaying as doPlaylistAddAndAllowPlayingAction,
} from 'redux/actions/content';
const SHARE_DOMAIN = SHARE_DOMAIN_URL || URL;
type SubscriptionArgs = {
  channelName: string;
  uri: string;
  notificationsDisabled?: boolean;
};
type Props = {
  uri: string;
  inline?: boolean;
  collectionId: string;
  fypId?: string;
  channelUri?: string;
};

function ClaimMenuList(props: Props) {
  const { uri, inline = false, collectionId, fypId } = props;
  const dispatch = useAppDispatch();

  // -- selectors --
  const placeholderForDeletedClaim = React.useMemo(
    () => ({ canonical_url: uri, permanent_url: uri, value_type: 'deleted' as const }),
    [uri]
  );
  const claim = useAppSelector((state) => selectClaimForUri(state, uri, false)) || placeholderForDeletedClaim;
  const repostedClaim = claim?.reposted_claim;
  const isRepost = Boolean(claim?.reposted_claim || claim?.value?.claim_hash);
  const contentClaim = repostedClaim || claim;
  const contentSigningChannel = contentClaim && contentClaim.signing_channel;
  const contentPermanentUri = contentClaim && contentClaim.permanent_url;
  const contentChannelUri = (contentSigningChannel && contentSigningChannel.permanent_url) || contentPermanentUri;
  const selectLastUsedCollections = React.useMemo(() => makeSelectClaimMenuCollectionsForUrl(), []);
  const lastUsedCollections = useAppSelector((state) => selectLastUsedCollections(state, contentPermanentUri));
  const isLivestreamClaim = isStreamPlaceholderClaim(claim);
  const permanentUrl = (claim && claim.permanent_url) || '';
  const isPostClaim =
    useAppSelector((state) => selectFileRenderModeForUri(state, permanentUrl)) === RENDER_MODES.MARKDOWN;
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const hasClaimInWatchLater = useAppSelector((state) =>
    selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.WATCH_LATER_ID, contentPermanentUri)
  );
  const hasClaimInFavorites = useAppSelector((state) =>
    selectCollectionForIdHasClaimUrl(state, COLLECTIONS_CONSTS.FAVORITES_ID, contentPermanentUri)
  );
  const channelIsMuted = useAppSelector((state) =>
    contentChannelUri ? makeSelectChannelIsMuted(contentChannelUri)(state) : false
  );
  const channelIsBlocked = useAppSelector((state) =>
    contentChannelUri ? makeSelectChannelIsBlocked(contentChannelUri)(state) : false
  );
  const fileInfo = useAppSelector((state) =>
    contentPermanentUri ? selectFileInfoForUri(state, contentPermanentUri) : undefined
  );
  const isSubscribed = useAppSelector((state) =>
    contentChannelUri ? selectIsSubscribedForUri(state, contentChannelUri) : false
  );
  const channelIsAdminBlocked = useAppSelector((state) => (uri ? makeSelectChannelIsAdminBlocked(uri)(state) : false));
  const isAdmin = useAppSelector(selectHasAdminChannel);
  const claimInCollection = useAppSelector((state) =>
    selectCollectionForIdHasClaimUrl(state, collectionId, contentPermanentUri)
  );
  const isMyCollection = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));
  const hasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const isAuthenticated = Boolean(useAppSelector(selectUserVerifiedEmail));
  const collectionEmpty = useAppSelector((state) => selectCollectionIsEmptyForId(state, collectionId));
  const isContentProtectedAndLocked = useAppSelector((state) =>
    contentClaim ? selectIsProtectedContentLockedFromUserForId(state, contentClaim.claim_id) : false
  );
  const defaultCollectionAction = useAppSelector((state) =>
    selectClientSetting(state, SETTINGS.DEFAULT_COLLECTION_ACTION)
  );

  // -- dispatch helpers --
  const openModal = React.useCallback((id: string, params: {}) => dispatch(doOpenModal(id, params)), [dispatch]);
  const prepareEdit = React.useCallback((c: {}, editUri: string) => dispatch(doPrepareEdit(c, editUri)), [dispatch]);
  const doToast = React.useCallback((params: any) => dispatch(doToastAction(params)), [dispatch]);
  const doChannelMute = React.useCallback((u: string) => dispatch(doChannelMuteAction(u)), [dispatch]);
  const doChannelUnmute = React.useCallback((u: string) => dispatch(doChannelUnmuteAction(u)), [dispatch]);
  const doCommentModBlock = React.useCallback((u: string) => dispatch(doCommentModBlockAction(u)), [dispatch]);
  const doCommentModUnBlock = React.useCallback((u: string) => dispatch(doCommentModUnBlockAction(u)), [dispatch]);
  const doCommentModBlockAsAdmin = React.useCallback(
    (commenterUri: string, offendingCommentId?: string | null, blockerId?: string | null) =>
      dispatch(doCommentModBlockAsAdminAction(commenterUri, offendingCommentId, blockerId)),
    [dispatch]
  );
  const doCommentModUnBlockAsAdmin = React.useCallback(
    (u: string, blockerId: string) => dispatch(doCommentModUnBlockAsAdminAction(u, blockerId)),
    [dispatch]
  );
  const doChannelSubscribe = React.useCallback(
    (sub: SubscriptionArgs) => dispatch(doChannelSubscribeAction(sub)),
    [dispatch]
  );
  const doChannelUnsubscribe = React.useCallback(
    (sub: SubscriptionArgs) => dispatch(doChannelUnsubscribeAction(sub)),
    [dispatch]
  );
  const doEnableCollectionShuffle = React.useCallback(
    (params: { collectionId: string }) => dispatch(doEnableCollectionShuffleAction(params)),
    [dispatch]
  );
  const doRemovePersonalRecommendationCb = React.useCallback(
    (u: string) => dispatch(doRemovePersonalRecommendation(u)),
    [dispatch]
  );
  const doPlaylistAddAndAllowPlaying = React.useCallback(
    (params: { uri: string; collectionName: string; collectionId: string }) =>
      dispatch(doPlaylistAddAndAllowPlayingAction(params)),
    [dispatch]
  );
  const doFetchUriAccessKey = React.useCallback((u: string) => dispatch(doFetchUriAccessKeyAction(u)), [dispatch]);
  const isEmbed = React.useContext(EmbedContext);
  const isChannelPage = React.useContext(ChannelPageContext);
  const navigate = useNavigate();
  const incognitoClaim = contentChannelUri && !contentChannelUri.includes('@');
  const isChannel = !incognitoClaim && !contentSigningChannel;
  const { channelName } = parseURI(contentChannelUri);
  const showDelete = claimIsMine || (fileInfo && (fileInfo.written_bytes > 0 || fileInfo.blobs_completed > 0));
  const subscriptionLabel = isRepost
    ? isSubscribed
      ? __('Unfollow @%channelName%', {
          channelName,
        })
      : __('Follow @%channelName%', {
          channelName,
        })
    : isSubscribed
      ? __('Unfollow')
      : __('Follow');

  if (claim.value_type === 'deleted' && !collectionId) {
    return null;
  }

  const lbryUrl: string = generateLbryContentUrl(claim.canonical_url, claim.permanent_url);
  const shareUrl: string = generateShareUrl(SHARE_DOMAIN, lbryUrl);
  const rssUrl: string = isChannel ? generateRssUrl(SHARE_DOMAIN, claim) : '';
  const isCollectionClaim = claim && claim.value_type === 'collection';
  const collectionNavigateUrl =
    collectionId && defaultCollectionAction !== COLLECTIONS_CONSTS.DEFAULT_ACTION_VIEW
      ? `/$/${PAGES.PLAYLIST}/${collectionId}`
      : `${formatLbryUrlForWeb((claim && claim.canonical_url) || uri || '/')}?lid=${collectionId}`;

  function handleAdd(claimIsInPlaylist, name, collectionId) {
    const itemUrl = contentClaim?.permanent_url;

    if (itemUrl) {
      doPlaylistAddAndAllowPlaying({
        uri: itemUrl,
        collectionName: name,
        collectionId,
      });
    }
  }

  function handleFollow() {
    const subscriptionHandler = isSubscribed ? doChannelUnsubscribe : doChannelSubscribe;

    if (channelName) {
      subscriptionHandler({
        channelName: '@' + channelName,
        uri: contentChannelUri,
        notificationsDisabled: true,
      });
    }
  }

  function handleToggleMute() {
    if (channelIsMuted) {
      doChannelUnmute(contentChannelUri);
    } else {
      doChannelMute(contentChannelUri);
    }
  }

  function handleToggleBlock() {
    if (channelIsBlocked) {
      doCommentModUnBlock(contentChannelUri);
    } else {
      doCommentModBlock(contentChannelUri);
    }
  }

  function handleEdit() {
    if (!isChannel) {
      const signingChannelName = contentSigningChannel && contentSigningChannel.name;
      const uriObject: LbryUrlObj = {
        streamName: claim.name,
        streamClaimId: claim.claim_id,
      };

      if (signingChannelName) {
        uriObject.channelName = signingChannelName;
      }

      const editUri = buildURI(uriObject);
      // TODO: move the logic to create `editUri` into doPrepareEdit since
      // `claim` is passed in.
      prepareEdit(claim, editUri);
    } else {
      const channelUrl = claim.name + ':' + claim.claim_id;
      navigate(`/${channelUrl}?${CP.QUERIES.VIEW}=${CP.VIEWS.EDIT}`);
    }
  }

  /*
  function handleFeature(){
    const { homepage_settings } = settingsByChannelId[Object.keys(settingsByChannelId)[0]];
    console.log('homepage_settings: ', homepage_settings)
  }
  */
  function handleDelete() {
    if (!isRepost && !isChannel) {
      openModal(MODALS.CONFIRM_FILE_REMOVE, {
        uri,
        doGoBack: false,
      });
    } else {
      openModal(MODALS.CONFIRM_CLAIM_REVOKE, {
        claim,
        cb: isChannel && (() => navigate(`/$/${PAGES.CHANNELS}`), { replace: true }),
      });
    }
  }

  function handleSupport() {
    openModal(MODALS.SEND_TIP, {
      uri,
      isSupport: true,
    });
  }

  function handleToggleAdminBlock() {
    if (channelIsAdminBlocked) {
      doCommentModUnBlockAsAdmin(contentChannelUri, '');
    } else {
      doCommentModBlockAsAdmin(contentChannelUri, undefined, undefined);
    }
  }

  function copyToClipboard(textToCopy, successMsg, failureMsg) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        doToast({
          message: __(successMsg),
        });
      })
      .catch(() => {
        doToast({
          message: __(failureMsg),
          isError: true,
        });
      });
  }

  function handleCopyRssLink() {
    copyToClipboard(rssUrl, 'RSS URL copied.', 'Failed to copy RSS URL.');
  }

  function handleCopyLink() {
    const claimId = claim?.claim_id;
    const channelId = getChannelIdFromClaim(claim);

    if (claimIsMine && isUnlisted && channelId && claimId) {
      doFetchUriAccessKey(uri)
        .then((accessKey: UriAccessKey | null | undefined) => {
          if (accessKey === null) {
            throw new Error();
          } else {
            generateShortShareUrl(SHARE_DOMAIN, lbryUrl, null, null, false, null, null, accessKey)
              .then((result) => {
                copyToClipboard(result, 'Unlisted link copied.', 'Failed to copy link.');
              })
              .catch((err) => {
                assert(false, 'ClaimMenuList', err);
              });
          }
        })
        .catch(() => {
          doToast({
            message: __('Failed to generate unlisted URL.'),
            subMessage: __('Please try again later.'),
            duration: 'long',
          });
        });
    } else {
      copyToClipboard(shareUrl, 'Link copied.', 'Failed to copy link.');
    }
  }

  function handleReportContent() {
    const claimId = contentClaim?.claim_id;
    navigate(`/$/${PAGES.REPORT_CONTENT}?claimId=${claimId}`);
  }

  const AddToCollectionContext = () => {
    const WatchLaterMenuItem = () => {
      return (
        <MenuItem
          className="comment__menu-option"
          onSelect={() => handleAdd(hasClaimInWatchLater, __('Watch Later'), COLLECTIONS_CONSTS.WATCH_LATER_ID)}
        >
          <div className="menu__link">
            <Icon aria-hidden icon={ICONS.TIME} />
            {hasClaimInWatchLater ? __('In Watch Later') : __('Watch Later')}
          </div>
        </MenuItem>
      );
    };

    const FavoritesMenuItem = () => {
      return (
        <MenuItem
          className="comment__menu-option"
          onSelect={() => handleAdd(hasClaimInFavorites, __('Favorites'), COLLECTIONS_CONSTS.FAVORITES_ID)}
        >
          <div className="menu__link">
            <Icon aria-hidden icon={ICONS.STAR} />
            {hasClaimInFavorites ? __('In Favorites') : __('Favorites')}
          </div>
        </MenuItem>
      );
    };

    const AddToPlaylistMenuItem = () => {
      // CURRENTLY ONLY SUPPORT PLAYLISTS FOR PLAYABLE; LATER DIFFERENT TYPES
      return (
        <MenuItem
          className="comment__menu-option"
          onSelect={() =>
            openModal(MODALS.COLLECTION_ADD, {
              uri: contentClaim?.permanent_url,
              type: COL_TYPES.PLAYLIST,
            })
          }
        >
          <div className="menu__link">
            <Icon aria-hidden icon={ICONS.PLAYLIST_ADD} />
            {__('Add to Playlist')}
          </div>
        </MenuItem>
      );
    };

    const ToggleLastUsedCollectionMenuItems = () => {
      if (!lastUsedCollections || lastUsedCollections.length === 0) {
        return null;
      }

      return lastUsedCollections.map((lastUsedCollection) => {
        return (
          <MenuItem
            key={lastUsedCollection.id}
            className="comment__menu-option"
            onSelect={() => handleAdd(lastUsedCollection.hasClaim, lastUsedCollection.name, lastUsedCollection.id)}
          >
            <div className="menu__link">
              <Icon aria-hidden icon={lastUsedCollection.hasClaim ? ICONS.PLAYLIST_FILLED : ICONS.PLAYLIST_ADD} />
              {lastUsedCollection.hasClaim
                ? __('In %collection%', {
                    collection: lastUsedCollection.name,
                  })
                : __('Add to %collection%', {
                    collection: lastUsedCollection.name,
                  })}
            </div>
          </MenuItem>
        );
      });
    };

    const RemoveFromCollectionMenuItem = () => {
      // The function doesn't seem to care about the name for the deletion case,
      // so just blank it for now (lazy to get the value).
      const collectionName = '';
      assert(claimInCollection, 'This should only be used when editing a collection');
      return (
        <MenuItem
          className="comment__menu-option"
          onSelect={() => handleAdd(claimInCollection, collectionName, collectionId)}
        >
          <div className="menu__link">
            <Icon aria-hidden icon={ICONS.DELETE} />
            {__('Remove From List')}
          </div>
        </MenuItem>
      );
    };

    const canAdd = isClaimAllowedForCollection(contentClaim);
    return (
      <>
        {isAuthenticated && claimInCollection && isMyCollection && (
          <>
            <RemoveFromCollectionMenuItem />
            <hr className="menu__separator" />
          </>
        )}

        {canAdd && contentClaim && <ButtonAddToQueue uri={contentClaim.permanent_url} menuItem />}

        {isAuthenticated && canAdd && (
          <>
            <WatchLaterMenuItem />
            <FavoritesMenuItem />
            <AddToPlaylistMenuItem />
            <ToggleLastUsedCollectionMenuItems />
            <hr className="menu__separator" />
          </>
        )}
      </>
    );
  };

  const [menuMounted, setMenuMounted] = React.useState(false);

  if (!menuMounted) {
    return (
      <button
        className={classnames('menu__button', {
          'claim__menu-button': !inline,
          'claim__menu-button--inline': inline,
        })}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setMenuMounted(true);
        }}
      >
        <Icon size={20} icon={ICONS.MORE_VERTICAL} />
      </button>
    );
  }

  return (
    <Menu>
      <MenuButton
        className={classnames('menu__button', {
          'claim__menu-button': !inline,
          'claim__menu-button--inline': inline,
        })}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Icon size={20} icon={ICONS.MORE_VERTICAL} />
      </MenuButton>
      <MenuList className="menu__list">
        {claim.value_type === 'deleted' && collectionId ? (
          <AddToCollectionContext />
        ) : (
          claim.value_type !== 'deleted' && (
            <>
              {/* FYP */}
              {fypId && (
                <>
                  <MenuItem className="comment__menu-option" onSelect={() => doRemovePersonalRecommendationCb(uri)}>
                    <div className="menu__link">
                      <Icon aria-hidden icon={ICONS.REMOVE} />
                      {__('Not interested')}
                    </div>
                  </MenuItem>
                  <hr className="menu__separator" />
                </>
              )}

              <>
                {/* COLLECTION OPERATIONS */}
                {collectionId && isCollectionClaim ? (
                  <>
                    <MenuItem className="comment__menu-option" onSelect={() => navigate(collectionNavigateUrl)}>
                      {defaultCollectionAction !== COLLECTIONS_CONSTS.DEFAULT_ACTION_VIEW ? (
                        <a className="menu__link" href={collectionNavigateUrl}>
                          <Icon aria-hidden icon={ICONS.VIEW} />
                          {__('View Playlist')}
                        </a>
                      ) : (
                        <a className="menu__link" href={collectionNavigateUrl}>
                          <Icon aria-hidden icon={ICONS.PLAY} />
                          {__('Play')}
                        </a>
                      )}
                    </MenuItem>
                    {!collectionEmpty && (
                      <MenuItem
                        className="comment__menu-option"
                        onSelect={() =>
                          doEnableCollectionShuffle({
                            collectionId,
                          })
                        }
                      >
                        <div className="menu__link">
                          <Icon aria-hidden icon={ICONS.SHUFFLE} />
                          {__('Shuffle Play')}
                        </div>
                      </MenuItem>
                    )}
                    {isMyCollection && (
                      <>
                        {!collectionEmpty && (
                          <MenuItem
                            className="comment__menu-option"
                            onSelect={() =>
                              navigate(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)
                            }
                          >
                            <div className="menu__link">
                              <Icon aria-hidden iconColor={'red'} icon={ICONS.PUBLISH} />
                              {hasEdits ? __('Publish') : __('Update')}
                            </div>
                          </MenuItem>
                        )}
                        <MenuItem
                          className="comment__menu-option"
                          onSelect={() =>
                            navigate(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.EDIT}`)
                          }
                        >
                          <div className="menu__link">
                            <Icon aria-hidden icon={ICONS.EDIT} />
                            {__('Edit')}
                          </div>
                        </MenuItem>
                        <MenuItem
                          className="comment__menu-option"
                          onSelect={() =>
                            openModal(MODALS.COLLECTION_DELETE, {
                              collectionId,
                            })
                          }
                        >
                          <div className="menu__link">
                            <Icon aria-hidden icon={ICONS.DELETE} />
                            {__('Delete Playlist')}
                          </div>
                        </MenuItem>
                      </>
                    )}
                  </>
                ) : (
                  <AddToCollectionContext />
                )}
              </>

              {contentClaim && isContentProtectedAndLocked && !claimIsMine && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() =>
                    openModal(MODALS.JOIN_MEMBERSHIP, {
                      uri,
                      fileUri: contentClaim.permanent_url,
                      shouldNavigate: true,
                    })
                  }
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.MEMBERSHIP} />
                    {__('Join')}
                  </div>
                </MenuItem>
              )}

              {isAuthenticated && (
                <>
                  {!isChannelPage && (
                    <>
                      <MenuItem className="comment__menu-option" onSelect={handleSupport}>
                        <div className="menu__link">
                          <Icon aria-hidden icon={ICONS.USD} />
                          {__('Support --[button to support a claim]--')}
                        </div>
                      </MenuItem>
                    </>
                  )}

                  {!incognitoClaim && !claimIsMine && !isChannelPage && (
                    <>
                      <hr className="menu__separator" />
                      <MenuItem className="comment__menu-option" onSelect={handleFollow}>
                        <div className="menu__link">
                          <Icon aria-hidden icon={ICONS.SUBSCRIBE} />
                          {subscriptionLabel}
                        </div>
                      </MenuItem>
                    </>
                  )}

                  {!isMyCollection && (
                    <>
                      {(!claimIsMine || channelIsBlocked) && contentChannelUri ? (
                        !incognitoClaim && (
                          <>
                            {isChannelPage && (
                              <MenuItem className="comment__menu-option" onSelect={handleToggleBlock}>
                                <div className="menu__link">
                                  <Icon aria-hidden icon={ICONS.BLOCK} />
                                  {channelIsBlocked ? __('Unblock Channel') : __('Block Channel')}
                                </div>
                              </MenuItem>
                            )}

                            {isAdmin && (
                              <MenuItem className="comment__menu-option" onSelect={handleToggleAdminBlock}>
                                <div className="menu__link">
                                  <Icon aria-hidden icon={ICONS.GLOBE} />
                                  {channelIsAdminBlocked ? __('Global Unblock Channel') : __('Global Block Channel')}
                                </div>
                              </MenuItem>
                            )}
                            <MenuItem className="comment__menu-option" onSelect={handleToggleMute}>
                              <div className="menu__link">
                                <Icon aria-hidden icon={ICONS.EYE_OFF} />
                                {channelIsMuted ? __('Unhide Channel') : __('Hide Channel')}
                              </div>
                            </MenuItem>
                          </>
                        )
                      ) : (
                        <>
                          {/* claimIsMine && (
                <MenuItem className="comment__menu-option" onSelect={handleFeature}>
                <div className="menu__link">
                 <Icon aria-hidden icon={ICONS.HOME} />
                 {__('Feature')}
                </div>
                </MenuItem>
                ) */}
                          {!isRepost && (
                            <MenuItem className="comment__menu-option" onSelect={handleEdit}>
                              <div className="menu__link">
                                <Icon aria-hidden icon={ICONS.EDIT} />
                                {__('Edit')}
                              </div>
                            </MenuItem>
                          )}
                        </>
                      )}

                      {showDelete && (
                        <MenuItem className="comment__menu-option" onSelect={handleDelete}>
                          <div className="menu__link">
                            <Icon aria-hidden icon={ICONS.DELETE} />
                            {__('Delete')}
                          </div>
                        </MenuItem>
                      )}
                    </>
                  )}
                  <hr className="menu__separator" />
                </>
              )}

              <MenuItem className="comment__menu-option" onSelect={handleCopyLink}>
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.COPY_LINK} />
                  {__('Copy Link')}
                </div>
              </MenuItem>

              {isChannelPage && IS_WEB && rssUrl && (
                <MenuItem className="comment__menu-option" onSelect={handleCopyRssLink}>
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.RSS} />
                    {__('Copy RSS URL')}
                  </div>
                </MenuItem>
              )}

              {!claimIsMine && !isMyCollection && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={isEmbed ? (e) => e.preventDefault() : handleReportContent}
                >
                  <NavLink
                    className="menu__link"
                    to={contentClaim ? `/$/${PAGES.REPORT_CONTENT}?claimId=${contentClaim.claim_id}` : ''}
                    target={isEmbed && '_blank'}
                  >
                    <Icon aria-hidden icon={ICONS.REPORT} />
                    {__('Report Content')}
                  </NavLink>
                </MenuItem>
              )}
            </>
          )
        )}
      </MenuList>
    </Menu>
  );
}

export default React.memo(ClaimMenuList);
