// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';

import { useIsMobile } from 'effects/use-screensize';
import * as PAGES from 'constants/pages';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimShareButton from 'component/claimShareButton';
// import { ENABLE_FILE_REACTIONS } from 'config';
// import ClaimRepostButton from 'component/claimRepostButton';
import CollectionPublishButton from 'page/collection/internal/collectionActions/internal/publishButton';
// import CollectionSubtitle from '../collectionSubtitle';
import Tooltip from 'component/common/tooltip';
import Spinner from 'component/spinner';

type Props = {
  uri: string,
  claimId?: string,
  isMyCollection: boolean,
  collectionId: string,
  // showEdit: boolean,
  // isHeader: boolean,
  setShowEdit: (boolean) => void,
  isBuiltin: boolean,
  claimIsPending: boolean,
  // collectionSavedForId: boolean,
  // collectionEmpty: boolean,
  // collectionType: string,
  doOpenModal: (id: string, props: {}) => void,
  // doEnableCollectionShuffle: (params: { collectionId: string }) => void,
  doToggleCollectionSavedForId: (id: string) => void,
  // doSortCollectionByReleaseTime: (collectionId: string, sortOrder: string) => void,
};

function CollectionHeaderActions(props: Props) {
  const {
    uri,
    claimId,
    isMyCollection,
    collectionId,
    isBuiltin,
    claimIsPending,
    // showEdit,
    // isHeader,
    setShowEdit,
    // collectionSavedForId,
    // collectionEmpty,
    // collectionType,
    doOpenModal,
    // doEnableCollectionShuffle,
    doToggleCollectionSavedForId,
    // doSortCollectionByReleaseTime,
  } = props;

  const {
    push,
    // location: { search },
  } = useHistory();

  const isNotADefaultList = collectionId !== 'watchlater' && collectionId !== 'favorites';

  return (
    <>
      <div>
        <SectionElement>
          {!isBuiltin && (
            <>
              {isMyCollection && <CollectionPublishButton uri={uri} collectionId={collectionId} />}
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
                  {!isMyCollection && <ClaimSupportButton uri={uri} fileAction />}
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
              {isMyCollection && isNotADefaultList && (
                <MenuItem
                  className="comment__menu-option"
                  onSelect={() =>
                    push(
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
              {!isMyCollection && claimId && (
                <MenuItem className="comment__menu-option" onSelect={() => doToggleCollectionSavedForId(claimId)}>
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
                onSelect={() => doOpenModal(MODALS.COLLECTION_CREATE, { sourceId: collectionId })}
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
                    doOpenModal(MODALS.COLLECTION_DELETE, { uri, collectionId, redirect: `/$/${PAGES.PLAYLISTS}` })
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
                  onSelect={() => push(`/$/${PAGES.REPORT_CONTENT}?claimId=${claimId}`)}
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
  children: any,
};

const SectionElement = (props: SectionProps) => {
  const { children } = props;

  const isMobile = useIsMobile();
  return isMobile ? children : <div className="section__actions">{children}</div>;
};

export default CollectionHeaderActions;
