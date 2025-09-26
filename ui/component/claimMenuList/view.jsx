// @flow
import { URL, SHARE_DOMAIN_URL } from 'config';
import { NavLink } from 'react-router-dom';
import { ChannelPageContext } from 'contexts/channel';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { COL_TYPES } from 'constants/collections';
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import { COLLECTION_PAGE as CP } from 'constants/urlParams';
import Icon from 'component/common/icon';
import {
  generateShareUrl,
  generateRssUrl,
  generateLbryContentUrl,
  generateShortShareUrl,
  formatLbryUrlForWeb,
} from 'util/url';
import { useHistory } from 'react-router';
// import { getChannelIdFromClaim } from 'util/claim';
import { buildURI, parseURI } from 'util/lbryURI';
import { EmbedContext } from 'contexts/embed';
import ButtonAddToQueue from 'component/buttonAddToQueue';
import { isClaimAllowedForCollection } from 'util/collections';

const SHARE_DOMAIN = SHARE_DOMAIN_URL || URL;

type SubscriptionArgs = {
  channelName: string,
  uri: string,
  notificationsDisabled?: boolean,
};

type Props = {
  uri: string,
  claim: Claim,
  isRepost: boolean,
  contentClaim: ?Claim,
  contentSigningChannel: ?Claim,
  contentChannelUri: string,
  openModal: (id: string, {}) => void,
  inline?: boolean,
  channelIsMuted: boolean,
  channelIsBlocked: boolean,
  channelIsAdminBlocked: boolean,
  isAdmin: boolean,
  doChannelMute: (string) => void,
  doChannelUnmute: (string) => void,
  doCommentModBlock: (string) => void,
  doCommentModUnBlock: (string) => void,
  doCommentModBlockAsAdmin: (commenterUri: string, offendingCommentId: ?string, blockerId: ?string) => void,
  doCommentModUnBlockAsAdmin: (string, string) => void,
  hasClaimInWatchLater: boolean,
  hasClaimInFavorites: boolean,
  claimInCollection: boolean,
  collectionId: string,
  isMyCollection: boolean,
  // isUnlisted: boolean,
  fypId?: string,
  doToast: ({ message: string, isError?: boolean, linkText?: string, linkTarget?: string }) => void,
  claimIsMine: boolean,
  // settingsByChannelId: boolean,
  fileInfo: FileListItem,
  prepareEdit: ({}, string) => void,
  isSubscribed: boolean,
  doChannelSubscribe: (SubscriptionArgs) => void,
  doChannelUnsubscribe: (SubscriptionArgs) => void,
  hasEdits: Collection,
  isAuthenticated: boolean,
  doEnableCollectionShuffle: (params: { collectionId: string }) => void,
  lastUsedCollections: ?Array<any>,
  doRemovePersonalRecommendation: (uri: string) => void,
  collectionEmpty: boolean,
  doPlaylistAddAndAllowPlaying: (params: { uri: string, collectionName: string, collectionId: string }) => void,
  isContentProtectedAndLocked: boolean,
  defaultCollectionAction: string,
  doFetchUriAccessKey: (uri: string) => Promise<?UriAccessKey>,
};

function ClaimMenuList(props: Props) {
  const {
    uri,
    claim,
    isRepost,
    contentClaim,
    contentSigningChannel,
    contentChannelUri,
    openModal,
    inline = false,
    doChannelMute,
    doChannelUnmute,
    channelIsMuted,
    channelIsBlocked,
    channelIsAdminBlocked,
    isAdmin,
    claimInCollection,
    doCommentModBlock,
    doCommentModUnBlock,
    doCommentModBlockAsAdmin,
    doCommentModUnBlockAsAdmin,
    hasClaimInWatchLater,
    hasClaimInFavorites,
    collectionId,
    isMyCollection,
    // isUnlisted,
    fypId,
    doToast,
    claimIsMine,
    // settingsByChannelId,
    fileInfo,
    prepareEdit,
    isSubscribed,
    doChannelSubscribe,
    doChannelUnsubscribe,
    hasEdits,
    isAuthenticated,
    doEnableCollectionShuffle,
    lastUsedCollections,
    doRemovePersonalRecommendation,
    collectionEmpty,
    doPlaylistAddAndAllowPlaying,
    isContentProtectedAndLocked,
    defaultCollectionAction,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const isChannelPage = React.useContext(ChannelPageContext);

  const { push, replace } = useHistory();

  const incognitoClaim = contentChannelUri && !contentChannelUri.includes('@');
  const isChannel = !incognitoClaim && !contentSigningChannel;
  const { channelName } = parseURI(contentChannelUri);
  const showDelete = claimIsMine || (fileInfo && (fileInfo.written_bytes > 0 || fileInfo.blobs_completed > 0));
  const subscriptionLabel = isRepost
    ? isSubscribed
      ? __('Unfollow @%channelName%', { channelName })
      : __('Follow @%channelName%', { channelName })
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
      doPlaylistAddAndAllowPlaying({ uri: itemUrl, collectionName: name, collectionId });
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
      push(`/${channelUrl}?${CP.QUERIES.VIEW}=${CP.VIEWS.EDIT}`);
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
      openModal(MODALS.CONFIRM_FILE_REMOVE, { uri, doGoBack: false });
    } else {
      openModal(MODALS.CONFIRM_CLAIM_REVOKE, { claim, cb: isChannel && (() => replace(`/$/${PAGES.CHANNELS}`)) });
    }
  }

  function handleSupport() {
    openModal(MODALS.SEND_TIP, { uri, isSupport: true });
  }

  function handleToggleAdminBlock() {
    if (channelIsAdminBlocked) {
      doCommentModUnBlockAsAdmin(contentChannelUri, '');
    } else {
      doCommentModBlockAsAdmin(contentChannelUri, undefined, undefined);
    }
  }

  function copyToClipboard(textToCopy, successMsg, failureMsg) {
    if (window.cordova) {
      var textArea = document.createElement('textarea');
      textArea.value = textToCopy;

      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      if (document.body) document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        doToast({ message: __(successMsg) });
      } catch {
        // doToast({ message: __(failureMsg), isError: true });
      }
      if (document.body) document.body.removeChild(textArea);
    } else {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          doToast({ message: __(successMsg) });
        })
        .catch((err) => {
          console.log('Copy err: ', err);
          doToast({ message: __(failureMsg), isError: true });
        });
    }
  }

  function handleCopyRssLink() {
    copyToClipboard(rssUrl, 'RSS URL copied.', 'Failed to copy RSS URL.');
  }

  function handleCopyLink() {
    // eslint-disable-next-line no-unused-expressions
    () =>
      function (event) {
        event.preventDefault();
      };
    copyToClipboard(shareUrl, 'Link copied.', 'Failed to copy link.');
  }

  function handleReportContent() {
    const claimId = contentClaim?.claim_id;
    // $FlowFixMe
    push(`/$/${PAGES.REPORT_CONTENT}?claimId=${claimId}`);
  }

  const AddToCollectionContext = () => {
    const WatchLaterMenuItem = () => {
      return (
        <MenuItem
          className="comment__menu-option"
          onSelect={() => handleAdd(hasClaimInWatchLater, __('Watch Later'), COLLECTIONS_CONSTS.WATCH_LATER_ID)}
        >
          <div className="menu__link">
            <Icon aria-hidden icon={hasClaimInWatchLater ? ICONS.DELETE : ICONS.TIME} />
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
            <Icon aria-hidden icon={hasClaimInFavorites ? ICONS.DELETE : ICONS.STAR} />
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
            openModal(MODALS.COLLECTION_ADD, { uri: contentClaim?.permanent_url, type: COL_TYPES.PLAYLIST })
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
      return lastUsedCollections.map((lastUsedCollection) => {
        return (
          <MenuItem
            key={lastUsedCollection.id}
            className="comment__menu-option"
            onSelect={() => handleAdd(lastUsedCollection.hasClaim, lastUsedCollection.name, lastUsedCollection.id)}
          >
            <div className="menu__link">
              {!lastUsedCollection.hasClaim && <Icon aria-hidden icon={ICONS.ADD} />}
              {lastUsedCollection.hasClaim && <Icon aria-hidden icon={ICONS.DELETE} />}
              {!lastUsedCollection.hasClaim && __('Add to %collection%', { collection: lastUsedCollection.name })}
              {lastUsedCollection.hasClaim && __('In %collection%', { collection: lastUsedCollection.name })}
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

    // $FlowFixMe: claims not typed right
    const canAdd = isClaimAllowedForCollection(contentClaim);

    return (
      <>
        {isAuthenticated && claimInCollection && (
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

  return (
    <Menu>
      <MenuButton
        className={classnames('menu__button menu__button-fix', {
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
                  <MenuItem className="comment__menu-option" onSelect={() => doRemovePersonalRecommendation(uri)}>
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
                    <MenuItem className="comment__menu-option" onSelect={() => push(collectionNavigateUrl)}>
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
                        onSelect={() => doEnableCollectionShuffle({ collectionId })}
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
                              push(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.PUBLISH}`)
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
                            push(`/$/${PAGES.PLAYLIST}/${collectionId}?${CP.QUERIES.VIEW}=${CP.VIEWS.EDIT}`)
                          }
                        >
                          <div className="menu__link">
                            <Icon aria-hidden icon={ICONS.EDIT} />
                            {__('Edit')}
                          </div>
                        </MenuItem>
                        <MenuItem
                          className="comment__menu-option"
                          onSelect={() => openModal(MODALS.COLLECTION_DELETE, { collectionId })}
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
                    to={{ pathname: contentClaim ? `/$/${PAGES.REPORT_CONTENT}?claimId=${contentClaim.claim_id}` : '' }}
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

export default ClaimMenuList;
