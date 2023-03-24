// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { COL_TYPES, SORT_ORDER } from 'constants/collections';
import React from 'react';
import Button from 'component/button';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';

import FileActionButton from 'component/common/file-action-button';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimShareButton from 'component/claimShareButton';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
// import ClaimRepostButton from 'component/claimRepostButton';
// import PlayButton from './internal/playButton';
// import ShuffleButton from './internal/shuffleButton';
// import CollectionDeleteButton from 'component/collectionDeleteButton';
// import CollectionPublishButton from './internal/publishButton';
// import CollectionReportButton from './internal/report-button';
import CollectionSubtitle from '../collectionSubtitle';

type Props = {
  uri: string,
  claimId?: string,
  isMyCollection: boolean,
  collectionId: string,
  showEdit: boolean,
  isHeader: boolean,
  setShowEdit: (boolean) => void,
  isBuiltin: boolean,
  collectionEmpty: boolean,
  collectionSavedForId: boolean,
  collectionType: string,
  doOpenModal: (id: string, props: {}) => void,
  doEnableCollectionShuffle: (params: { collectionId: string }) => void,
  doToggleCollectionSavedForId: (id: string) => void,
  doSortCollectionByReleaseTime: (collectionId: string, sortOrder: string) => void,
};

function CollectionHeaderActions(props: Props) {
  const {
    uri,
    claimId,
    isMyCollection,
    collectionId,
    isBuiltin,
    showEdit,
    isHeader,
    setShowEdit,
    collectionSavedForId,
    collectionEmpty,
    collectionType,
    doOpenModal,
    doEnableCollectionShuffle,
    doToggleCollectionSavedForId,
    doSortCollectionByReleaseTime,
  } = props;

  const {
    location: { search },
  } = useHistory();

  const isMobile = useIsMobile();
  const showPlaybackButtons = !collectionEmpty && collectionType === COL_TYPES.PLAYLIST;
  const urlParams = new URLSearchParams(search);
  const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;

  return (
    <>
      <div>
        <SectionElement>
          <CollectionSubtitle uri={uri} />
          {!isBuiltin && (
            <>
              {uri && (
                <>
                  <ClaimSupportButton uri={uri} fileAction />
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
              <MenuItem className="comment__menu-option" onSelect={() => doEnableCollectionShuffle({ collectionId })}>
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.EDIT} />
                  {__('Edit')}
                </div>
              </MenuItem>
              <MenuItem className="comment__menu-option" onSelect={() => doEnableCollectionShuffle({ collectionId })}>
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.ARRANGE} />
                  {__('Arrange Items')}
                </div>
              </MenuItem>
              <MenuItem
                className="comment__menu-option"
                onSelect={() => doOpenModal(MODALS.COLLECTION_CREATE, { sourceId: collectionId })}
              >
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.COPY} />
                  {__('Copy')}
                </div>
              </MenuItem>
              <MenuItem className="comment__menu-option" onSelect={() => doEnableCollectionShuffle({ collectionId })}>
                <div className="menu__link">
                  <Icon aria-hidden icon={ICONS.DELETE} />
                  {__('Delete')}
                </div>
              </MenuItem>
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
