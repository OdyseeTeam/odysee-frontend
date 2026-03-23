import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from 'component/common/menu';
import Icon from 'component/common/icon';
import { useIsMobile } from 'effects/use-screensize';
import * as PAGES from 'constants/pages';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useNavigate } from 'react-router-dom';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimShareButton from 'component/claimShareButton';
// import { ENABLE_FILE_REACTIONS } from 'config';
// import ClaimRepostButton from 'component/claimRepostButton';
import CollectionPublishButton from 'page/collection/internal/collectionActions/internal/publishButton';
// import CollectionSubtitle from '../collectionSubtitle';
import Tooltip from 'component/common/tooltip';
import Spinner from 'component/spinner';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMine,
  selectCollectionAutoPublishForId,
  selectCollectionIsPublishingForId,
  selectCollectionPublishErrorForId,
  selectCollectionHasEditsForId,
} from 'redux/selectors/collections';
import { doOpenModal } from 'redux/actions/app';
import {
  doToggleCollectionSavedForId,
  doSetCollectionAutoPublish,
  doRetryCollectionPublish,
} from 'redux/actions/collections';
type Props = {
  uri: string;
  collectionId: string;
  showEdit: boolean;
  setShowEdit: (arg0: boolean) => void;
  isBuiltin: boolean;
  claimIsPending: boolean;
};

function CollectionHeaderActions(props: Props) {
  const { uri, collectionId, isBuiltin, claimIsPending, showEdit, setShowEdit } = props;
  const dispatch = useAppDispatch();
  const claimId = useAppSelector((state) => selectClaimForUri(state, uri))?.claim_id;
  const isMyCollection = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const autoPublish = useAppSelector((state) => selectCollectionAutoPublishForId(state, collectionId));
  const isPublishing = useAppSelector((state) => selectCollectionIsPublishingForId(state, collectionId));
  const publishError = useAppSelector((state) => selectCollectionPublishErrorForId(state, collectionId));
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const navigate = useNavigate();
  const isNotADefaultList = collectionId !== 'watchlater' && collectionId !== 'favorites';
  return (
    <>
      <div>
        <SectionElement>
          {!isBuiltin && (
            <>
              {isMyCollection && <CollectionPublishButton uri={uri} collectionId={collectionId} showEdit={showEdit} />}
              {uri && (
                <>
                  {claimIsPending && (
                    <Tooltip
                      title={__('Your publish is being confirmed and will be live soon')}
                      arrow={false}
                      enterDelay={100}
                    >
                      <div className="pending-change">
                        <Spinner />
                      </div>
                    </Tooltip>
                  )}
                  {isPublishing && (
                    <Tooltip title={__('Publishing playlist updates in the background')} arrow={false} enterDelay={100}>
                      <div className="pending-change">
                        <Spinner />
                      </div>
                    </Tooltip>
                  )}
                  {collectionHasEdits && publishError && (
                    <Tooltip title={__('Last publish failed. Open menu to retry.')} arrow={false} enterDelay={100}>
                      <div className="pending-change">
                        <Icon icon={ICONS.WARNING} />
                      </div>
                    </Tooltip>
                  )}
                  {<ClaimSupportButton uri={uri} fileAction />}
                  {/* <ClaimRepostButton uri={uri} /> */}
                  <ClaimShareButton uri={uri} collectionId={collectionId} fileAction webShareable />
                </>
              )}
            </>
          )}
          <Menu>
            <MenuButton
              className="menu__button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Icon size={20} icon={ICONS.MORE_VERTICAL} />
            </MenuButton>
            <MenuList className="menu__list">
              {isMyCollection && isNotADefaultList && !showEdit && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() =>
                    navigate(
                      `/$/${PAGES.PLAYLIST}/${collectionId}?${COLLECTION_PAGE.QUERIES.VIEW}=${COLLECTION_PAGE.VIEWS.EDIT}`
                    )
                  }
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.EDIT} />
                    {__('Edit')}
                  </div>
                </MenuItem>
              )}
              {isMyCollection && !isBuiltin && claimId && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() => dispatch(doSetCollectionAutoPublish(collectionId, !autoPublish))}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.PUBLISH} />
                    {autoPublish ? __('Disable Auto-publish') : __('Enable Auto-publish')}
                  </div>
                </MenuItem>
              )}
              {isMyCollection && !isBuiltin && claimId && collectionHasEdits && publishError && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() => dispatch(doRetryCollectionPublish(collectionId))}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.REFRESH} />
                    {__('Retry Publish Now')}
                  </div>
                </MenuItem>
              )}
              {!isMyCollection && claimId && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() => dispatch(doToggleCollectionSavedForId(claimId))}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.PLAYLIST_ADD} />
                    {__('Save')}
                  </div>
                </MenuItem>
              )}
              {isMyCollection && (
                <MenuItem className="comment__menu-option" onSelect={() => setShowEdit(true)}>
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.ARRANGE} />
                    {__('Arrange Items')}
                  </div>
                </MenuItem>
              )}
              <MenuItem
                className="comment__menu-option"
                onSelect={() =>
                  dispatch(
                    doOpenModal(MODALS.COLLECTION_CREATE, {
                      sourceId: collectionId,
                    })
                  )
                }
              >
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.COPY} />
                  {__('Copy')}
                </div>
              </MenuItem>
              {isMyCollection && isNotADefaultList && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() =>
                    dispatch(
                      doOpenModal(MODALS.COLLECTION_DELETE, {
                        uri,
                        collectionId,
                        redirect: `/$/${PAGES.PLAYLISTS}`,
                      })
                    )
                  }
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.DELETE} />
                    {__('Delete')}
                  </div>
                </MenuItem>
              )}
              {!isMyCollection && claimId && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() => navigate(`/$/${PAGES.REPORT_CONTENT}?claimId=${claimId}`)}
                >
                  <div className="menu__link">
                    <Icon aria-hidden icon={ICONS.REPORT} />
                    {__('Report')}
                  </div>
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </SectionElement>
      </div>
    </>
  );
}

type SectionProps = {
  children: any;
};

const SectionElement = (props: SectionProps) => {
  const { children } = props;
  const isMobile = useIsMobile();
  return isMobile ? children : <div className="section__actions">{children}</div>;
};

export default CollectionHeaderActions;
