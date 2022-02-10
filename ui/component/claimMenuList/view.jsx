// @flow
import { URL, SHARE_DOMAIN_URL } from 'config';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import React from 'react';
import classnames from 'classnames';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { MenuItem, MenuLink } from 'component/common/menu-components';
import CollectionMenuItems from 'component/collectionMenuItems';
import Icon from 'component/common/icon';
import { generateShareUrl, generateRssUrl } from 'util/url';
import { useHistory } from 'react-router';
import { buildURI, parseURI } from 'util/lbryURI';
import { getChannelPermanentUrlFromClaim, getIsClaimPlayable } from 'util/claim';

const SHARE_DOMAIN = SHARE_DOMAIN_URL || URL;
const PAGE_VIEW_QUERY = 'view';
const EDIT_PAGE = 'edit';

type Props = {
  uri: string,
  claim: ?Claim,
  inline?: boolean,
  channelIsMuted?: boolean,
  channelIsBlocked?: boolean,
  channelIsAdminBlocked?: boolean,
  isAdmin: boolean,
  hasClaimInWatchLater?: boolean,
  hasClaimInFavorites?: boolean,
  isMyCollection?: boolean,
  claimIsMine?: boolean,
  isSubscribed?: boolean,
  isChannelPage?: boolean,
  isAuthenticated: boolean,
  doCollectionEdit: (collectionId: string, params: CollectionEditParams) => void,
  doOpenModal: (id: string, {}) => void,
  doPrepareEdit: (claim: StreamClaim, uri: string) => void,
  doToast: ({ message: string, isError?: boolean }) => void,
  doToggleBlockChannel: (commenterUri: string) => void,
  doToggleBlockChannelAsAdmin: (commenterUri: string) => void,
  doToggleMute: (uri: string) => void,
  doToggleSubscribe: (subscription: Subscription) => void,
};

export default function ClaimMenuList(props: Props) {
  const {
    uri,
    claim,
    inline = false,
    channelIsMuted,
    channelIsBlocked,
    channelIsAdminBlocked,
    isAdmin,
    hasClaimInWatchLater,
    hasClaimInFavorites,
    isMyCollection,
    claimIsMine,
    isSubscribed,
    isChannelPage = false,
    isAuthenticated,
    doCollectionEdit,
    doOpenModal,
    doPrepareEdit,
    doToast,
    doToggleBlockChannel,
    doToggleBlockChannelAsAdmin,
    doToggleMute,
    doToggleSubscribe,
  } = props;

  const { push } = useHistory();

  const contentClaim = (claim && claim.reposted_claim) || claim;
  // $FlowFixMe
  const isPlayable = getIsClaimPlayable(contentClaim);
  // $FlowFixMe
  const contentChannelUrl = getChannelPermanentUrlFromClaim(contentClaim);

  const isRepost = Boolean(claim && claim.reposted_claim);
  const isChannel = claim && claim.value_type === 'channel';
  const isCollectionClaim = claim && claim.value_type === 'collection';
  const collectionClaimId = isCollectionClaim && claim && claim.claim_id;

  let contentChannelName;
  if (contentChannelUrl) {
    try {
      const { channelName } = parseURI(contentChannelUrl);
      contentChannelName = channelName;
    } catch (e) {}
  }

  const shareUrl = generateShareUrl(SHARE_DOMAIN, uri);
  const rssUrl = isChannel && generateRssUrl(SHARE_DOMAIN, claim);

  function handleAdd(isInSource, name, collectionId) {
    if (contentClaim) {
      doCollectionEdit(collectionId, {
        uris: [contentClaim.permanent_url],
        remove: isInSource,
        type: 'playlist',
      });

      doToast({
        message: isInSource ? __('Item removed from %name%', { name }) : __('Item added to %name%', { name }),
      });
    }
  }

  function handleFollow() {
    if (contentChannelName && contentChannelUrl) {
      doToggleSubscribe({
        channelName: '@' + contentChannelName,
        uri: contentChannelUrl,
        notificationsDisabled: true,
      });
    }
  }

  function handleEdit() {
    if (!isChannel && contentClaim) {
      const editUri = buildURI({
        channelName: contentChannelName,
        streamName: contentClaim && contentClaim.name,
        streamClaimId: contentClaim && contentClaim.claim_id,
      });

      push(`/$/${PAGES.UPLOAD}`);
      // $FlowFixMe
      doPrepareEdit(contentClaim, editUri);
    } else {
      if (contentChannelUrl) {
        push(`/${contentChannelUrl}?${PAGE_VIEW_QUERY}=${EDIT_PAGE}`);
      }
    }
  }

  function handleDelete() {
    if (!isRepost && !isChannel) {
      doOpenModal(MODALS.CONFIRM_FILE_REMOVE, { uri, doGoBack: false });
    } else {
      doOpenModal(MODALS.CONFIRM_CLAIM_REVOKE, { claim });
    }
  }

  function copyToClipboard(textToCopy, successMsg, failureMsg) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        doToast({ message: __(successMsg) });
      })
      .catch(() => {
        doToast({ message: __(failureMsg), isError: true });
      });
  }

  return (
    <Menu>
      <MenuButton
        className={classnames('menu__button', { 'claim__menu-button': !inline, 'claim__menu-button--inline': inline })}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Icon size={20} icon={ICONS.MORE_VERTICAL} />
      </MenuButton>

      <MenuList className="menu__list">
        {/* COLLECTION OPERATIONS */}
        {collectionClaimId ? (
          <CollectionMenuItems collectionId={collectionClaimId} />
        ) : (
          isAuthenticated &&
          isPlayable && (
            <>
              {/* ADD TO WATCH LATER */}
              <MenuItem
                onSelect={() => handleAdd(hasClaimInWatchLater, __('Watch Later'), COLLECTIONS_CONSTS.WATCH_LATER_ID)}
                icon={hasClaimInWatchLater ? ICONS.DELETE : ICONS.TIME}
                label={hasClaimInWatchLater ? __('In Watch Later') : __('Watch Later')}
              />

              {/* ADD TO FAVORITES */}
              <MenuItem
                onSelect={() => handleAdd(hasClaimInFavorites, __('Favorites'), COLLECTIONS_CONSTS.FAVORITES_ID)}
                icon={hasClaimInFavorites ? ICONS.DELETE : ICONS.STAR}
                label={hasClaimInFavorites ? __('In Favorites') : __('Favorites')}
              />

              {/* CURRENTLY ONLY SUPPORT PLAYLISTS FOR PLAYABLE; LATER DIFFERENT TYPES */}
              <MenuItem
                onSelect={() => doOpenModal(MODALS.COLLECTION_ADD, { uri, type: 'playlist' })}
                icon={ICONS.STACK}
                label={__('Add to Lists')}
              />
            </>
          )
        )}

        {isAuthenticated && (
          <>
            {!isChannelPage && (
              <>
                <hr className="menu__separator" />

                <MenuItem
                  onSelect={() => doOpenModal(MODALS.SEND_TIP, { uri, isSupport: true })}
                  icon={ICONS.LBC}
                  label={__('Support --[button to support a claim]--')}
                />

                {contentChannelName && !claimIsMine && (
                  <MenuItem
                    onSelect={handleFollow}
                    icon={ICONS.SUBSCRIBE}
                    label={
                      isSubscribed
                        ? __('Unfollow @%channelName%', { channelName: contentChannelName })
                        : __('Follow @%channelName%', { channelName: contentChannelName })
                    }
                  />
                )}
              </>
            )}

            {(!claimIsMine || channelIsBlocked) && contentChannelName && (
              <>
                {!isChannelPage && <hr className="menu__separator" />}

                <MenuItem
                  onSelect={() => contentChannelUrl && doToggleBlockChannel(contentChannelUrl)}
                  icon={ICONS.BLOCK}
                  label={
                    channelIsBlocked
                      ? __('Unblock @%channelName%', { channelName: contentChannelName })
                      : __('Block @%channelName%', { channelName: contentChannelName })
                  }
                />

                {isAdmin && (
                  <MenuItem
                    onSelect={() => contentChannelUrl && doToggleBlockChannelAsAdmin(contentChannelUrl)}
                    icon={ICONS.GLOBE}
                    label={
                      channelIsAdminBlocked
                        ? __('Global Unblock @%channelName%', { channelName: contentChannelName })
                        : __('Global Block @%channelName%', { channelName: contentChannelName })
                    }
                  />
                )}

                <MenuItem
                  onSelect={() => contentChannelUrl && doToggleMute(contentChannelUrl)}
                  icon={ICONS.MUTE}
                  label={
                    channelIsMuted
                      ? __('Unmute @%channelName%', { channelName: contentChannelName })
                      : __('Mute @%channelName%', { channelName: contentChannelName })
                  }
                />
              </>
            )}

            {claimIsMine && !isChannelPage && !isRepost && !isCollectionClaim && (
              <MenuItem onSelect={handleEdit} icon={ICONS.EDIT} label={__('Edit')} />
            )}

            {claimIsMine && !isCollectionClaim && (
              <MenuItem onSelect={handleDelete} icon={ICONS.DELETE} label={__('Delete')} />
            )}

            <hr className="menu__separator" />
          </>
        )}

        <MenuItem
          onSelect={() => copyToClipboard(shareUrl, 'Link copied.', 'Failed to copy link.')}
          icon={ICONS.COPY_LINK}
          label={__('Copy Link')}
        />

        {isChannelPage && IS_WEB && rssUrl && (
          <MenuItem
            onSelect={() => copyToClipboard(rssUrl, 'RSS URL copied.', 'Failed to copy RSS URL.')}
            icon={ICONS.RSS}
            label={__('Copy RSS URL')}
          />
        )}

        {!claimIsMine && !isMyCollection && contentClaim && (
          <MenuLink
            page={`${PAGES.REPORT_CONTENT}?claimId=${contentClaim.claim_id}`}
            icon={ICONS.REPORT}
            label={__('Report Content')}
          />
        )}
      </MenuList>
    </Menu>
  );
}
