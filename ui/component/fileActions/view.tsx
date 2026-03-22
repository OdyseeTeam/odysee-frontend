import { useIsMobile } from 'effects/use-screensize';
import { SITE_NAME, ENABLE_FILE_REACTIONS } from 'config';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as ICONS from 'constants/icons';
import React from 'react';
import { buildURI } from 'util/lbryURI';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as RENDER_MODES from 'constants/file_render_modes';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimCollectionAddButton from 'component/claimCollectionAddButton';
import { useLocation, useNavigate } from 'react-router-dom';
import FileReactions from 'component/fileReactions';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import Icon from 'component/common/icon';
import { webDownloadClaim } from 'util/downloadClaim';
import ClaimShareButton from 'component/claimShareButton';
import ClaimRepostButton from 'component/claimRepostButton';
import ClaimPublishButton from './internal/claimPublishButton';
import ClaimDeleteButton from './internal/claimDeleteButton';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectClaimIsMine,
  selectClaimForUri,
  selectHasChannels,
  makeSelectTagInClaimOrChannelForUri,
  selectClaimIsNsfwForUri,
  selectPreorderTagForUri,
  selectProtectedContentTagForUri,
  selectIsFiatRequiredForUri,
  selectIsFiatPaidForUri,
  selectPurchaseMadeForClaimId,
  selectCostInfoForUri,
  selectScheduledStateForUri,
} from 'redux/selectors/claims';
import { selectStreamingUrlForUri } from 'redux/selectors/file_info';
import { doPrepareEdit } from 'redux/actions/publish';
import { doDownloadUri } from 'redux/actions/content';
import { doToast } from 'redux/actions/notifications';
import { doOpenModal } from 'redux/actions/app';
import { makeSelectFileRenderModeForUri, selectContentStates } from 'redux/selectors/content';
import { selectNoRestrictionOrUserIsMemberForContentClaimId } from 'redux/selectors/memberships';
import { DISABLE_DOWNLOAD_BUTTON_TAG, DISABLE_REACTIONS_ALL_TAG, DISABLE_REACTIONS_VIDEO_TAG } from 'constants/tags';
import { isStreamPlaceholderClaim } from 'util/claim';
type Props = {
  uri: string;
  hideRepost?: boolean;
};

export default function FileActions(props: Props) {
  const { uri, hideRepost } = props;
  const navigate = useNavigate();
  const { search } = useLocation();
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const permanentUrl = (claim && claim.permanent_url) || '';
  const isPostClaim = useAppSelector(
    (state) => makeSelectFileRenderModeForUri(permanentUrl)(state) === RENDER_MODES.MARKDOWN
  );
  const disableFileReactions = useAppSelector(
    (state) =>
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_ALL_TAG)(state) ||
      makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_VIDEO_TAG)(state)
  );
  const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
  const renderMode = useAppSelector((state) => makeSelectFileRenderModeForUri(uri)(state));
  const costInfo = useAppSelector((state) => selectCostInfoForUri(state, uri));
  const hasChannels = useAppSelector(selectHasChannels);
  const uriAccessKey = useAppSelector((state) => selectContentStates(state).uriAccessKeys[uri]);
  const isLivestreamClaim = isStreamPlaceholderClaim(claim);
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const disableDownloadButton = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, DISABLE_DOWNLOAD_BUTTON_TAG)(state)
  );
  const isMature = useAppSelector((state) => selectClaimIsNsfwForUri(state, uri));
  const isAPreorder = Boolean(useAppSelector((state) => selectPreorderTagForUri(state, uri)));
  const isProtectedContent = Boolean(useAppSelector((state) => selectProtectedContentTagForUri(state, uri)));
  const isFiatRequired = useAppSelector((state) => selectIsFiatRequiredForUri(state, uri));
  const isFiatPaid = useAppSelector((state) => selectIsFiatPaidForUri(state, uri));
  const isFiatPaidAsPurchase = Boolean(useAppSelector((state) => selectPurchaseMadeForClaimId(state, claim?.claim_id)));
  const isTierUnlocked = useAppSelector(
    (state) => claim && selectNoRestrictionOrUserIsMemberForContentClaimId(state, claim?.claim_id)
  );
  const scheduledState = useAppSelector((state) => selectScheduledStateForUri(state, uri));

  const doOpenModal_ = (...args: Parameters<typeof doOpenModal>) => dispatch(doOpenModal(...args));
  const doPrepareEdit_ = (...args: Parameters<typeof doPrepareEdit>) => dispatch(doPrepareEdit(...args));
  const doToast_ = (...args: Parameters<typeof doToast>) => dispatch(doToast(...args));
  const doDownloadUri_ = (...args: Parameters<typeof doDownloadUri>) => dispatch(doDownloadUri(...args));
  const [downloadClicked, setDownloadClicked] = React.useState(false);
  const { claim_id: claimId, signing_channel: signingChannel, value, meta: claimMeta } = claim || {};
  const channelName = signingChannel && signingChannel.name;
  const fileName = value && value.source && value.source.name;
  const claimType = isLivestreamClaim ? 'livestream' : isPostClaim ? 'post' : 'upload';
  const isCollectionClaim = claim && claim.value_type === 'collection';
  const isChannel = claim && claim.value_type === 'channel';
  const webShareable =
    (costInfo && costInfo.cost === 0 && RENDER_MODES.WEB_SHAREABLE_MODES.includes(renderMode)) ||
    RENDER_MODES.TEXT_MODES.includes(renderMode) ||
    isCollectionClaim ||
    isChannel;
  const urlParams = new URLSearchParams(search);
  const collectionId = urlParams.get(COLLECTIONS_CONSTS.COLLECTION_ID);
  const showDownload =
    !isLivestreamClaim &&
    !(disableDownloadButton && !claimIsMine) &&
    !isMature &&
    (!isFiatRequired || isFiatPaidAsPurchase) &&
    (!isProtectedContent || isTierUnlocked) &&
    (scheduledState === 'non-scheduled' || scheduledState === 'started');
  const showRepost = !hideRepost && !isLivestreamClaim;
  // We want to use the short form uri for editing
  // This is what the user is used to seeing, they don't care about the claim id
  // We will select the claim id before they publish
  let editUri;

  if (claimIsMine) {
    const uriObject: LbryUrlObj = {
      streamName: claim.name,
      streamClaimId: claim.claim_id,
    };

    if (channelName) {
      uriObject.channelName = channelName;
    }

    editUri = buildURI(uriObject);
  }

  const canReactToFile = claimIsMine || ((!isFiatRequired || isFiatPaid) && isTierUnlocked); // should it be OR instead?

  function handleWebDownload() {
    // doDownloadUri() causes 'streamingUrl' to be populated.
    doDownloadUri_(uri);
    setDownloadClicked(true);
  }

  React.useEffect(() => {
    if (downloadClicked && streamingUrl) {
      webDownloadClaim(streamingUrl, fileName, false, uriAccessKey);
      setDownloadClicked(false);
    }
  }, [downloadClicked, streamingUrl, fileName, uriAccessKey]);

  function handleRepostClick() {
    if (!hasChannels) {
      doToast_({
        message: __('A channel is required to repost on %SITE_NAME%', {
          SITE_NAME,
        }),
      });
      return;
    }

    doOpenModal_(MODALS.REPOST, {
      uri,
    });
  }

  return (
    <div className="media__actions">
      {ENABLE_FILE_REACTIONS && !disableFileReactions && canReactToFile && <FileReactions uri={uri} />}

      {!isAPreorder && !isFiatRequired && <ClaimSupportButton uri={uri} fileAction />}

      <ClaimCollectionAddButton uri={uri} />

      {!hideRepost && !isMobile && !isLivestreamClaim && <ClaimRepostButton uri={uri} />}

      <ClaimShareButton uri={uri} fileAction webShareable={webShareable} collectionId={collectionId} />

      {claimIsMine && !isMobile && (
        <>
          <ClaimPublishButton uri={uri} claimType={claimType} />
          <ClaimDeleteButton uri={uri} />
        </>
      )}

      {((isMobile && (showRepost || claimIsMine)) || showDownload || !claimIsMine) && (
        <Menu>
          <MenuButton
            className="button--file-action--menu"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Icon size={20} icon={ICONS.MORE} />
          </MenuButton>

          <MenuList className="menu__list">
            {isMobile && (
              <>
                {showRepost && (
                  <MenuItem className="comment__menu-option" onSelect={handleRepostClick}>
                    <div className="menu__link">
                      <Icon aria-hidden icon={ICONS.REPOST} />
                      {claimMeta?.reposted > 1
                        ? __(`%repost_total% Reposts`, {
                            repost_total: claimMeta.reposted,
                          })
                        : __('Repost')}
                    </div>
                  </MenuItem>
                )}

                {claimIsMine && (
                  <>
                    <MenuItem
                      className="comment__menu-option"
                      onSelect={() => {
                        doPrepareEdit_(claim, editUri);
                      }}
                    >
                      <div className="menu__link">
                        <Icon aria-hidden icon={ICONS.EDIT} />
                        {isLivestreamClaim ? __('Update or Publish Replay') : __('Edit')}
                      </div>
                    </MenuItem>

                    <MenuItem
                      className="comment__menu-option"
                      onSelect={() =>
                        doOpenModal_(MODALS.CONFIRM_FILE_REMOVE, {
                          uri,
                        })
                      }
                    >
                      <div className="menu__link">
                        <Icon aria-hidden icon={ICONS.DELETE} />
                        {__('Delete')}
                      </div>
                    </MenuItem>
                  </>
                )}
              </>
            )}

            {showDownload && (
              <MenuItem className="comment__menu-option" onSelect={handleWebDownload}>
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.DOWNLOAD} />
                  {__('Download')}
                  {disableDownloadButton && claimIsMine && ' (' + __('Creator only') + ')'}
                </div>
              </MenuItem>
            )}

            {!claimIsMine && (
              <MenuItem
                className="comment__menu-option"
                onSelect={() => navigate(`/$/${PAGES.REPORT_CONTENT}?claimId=${claimId}`)}
              >
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.REPORT} />
                  {__('Report content')}
                </div>
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      )}
    </div>
  );
}
