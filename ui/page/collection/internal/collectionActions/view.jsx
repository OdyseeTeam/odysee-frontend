// @flow
import * as ICONS from 'constants/icons';
// import * as MODALS from 'constants/modal_types';
import { COL_TYPES, SORT_ORDER } from 'constants/collections';
import React from 'react';
// import Button from 'component/button';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import FileActionButton from 'component/common/file-action-button';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
// import ClaimSupportButton from 'component/claimSupportButton';
// import ClaimShareButton from 'component/claimShareButton';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
// import ClaimRepostButton from 'component/claimRepostButton';
import PlayButton from './internal/playButton';
import ShuffleButton from './internal/shuffleButton';
// import CollectionDeleteButton from 'component/collectionDeleteButton';
// import CollectionPublishButton from './internal/publishButton';

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
  doToggleCollectionSavedForId: (id: string) => void,
  doSortCollectionByReleaseTime: (collectionId: string, sortOrder: string) => void,
};

function CollectionActions(props: Props) {
  const {
    uri,
    // claimId,
    // isMyCollection,
    collectionId,
    isBuiltin,
    showEdit,
    // isHeader,
    // setShowEdit,
    // collectionSavedForId,
    collectionEmpty,
    collectionType,
    // doOpenModal,
    // doToggleCollectionSavedForId,
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
      <div className={classnames('media__actions justify-space-between collection-actions', { stretch: isMobile })}>
        <SectionElement>
          {showPlaybackButtons && <PlayButton collectionId={collectionId} />}
          {showPlaybackButtons && <ShuffleButton collectionId={collectionId} />}

          {!isBuiltin && <>{uri && <>{ENABLE_FILE_REACTIONS && <FileReactions uri={uri} />}</>}</>}
        </SectionElement>

        {!isOnPublicView && (
          <div className="section__actions">
            {showEdit && (
              <div className="sort-menu__button">
                <Menu>
                  <MenuButton
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <FileActionButton
                      className="button-toggle"
                      icon={ICONS.MENU}
                      title={__('Sort')}
                      label={__('Sort')}
                    />
                  </MenuButton>

                  <MenuList className="menu__list">
                    <MenuItem
                      className="comment__menu-option"
                      onSelect={() => {
                        doSortCollectionByReleaseTime(collectionId, SORT_ORDER.ASC);
                      }}
                    >
                      <div className="menu__link">{__('Newest first')}</div>
                    </MenuItem>
                    <MenuItem
                      className="comment__menu-option"
                      onSelect={() => {
                        doSortCollectionByReleaseTime(collectionId, SORT_ORDER.DESC);
                      }}
                    >
                      <div className="menu__link">{__('Oldest first')}</div>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </div>
            )}
          </div>
        )}
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

export default CollectionActions;
