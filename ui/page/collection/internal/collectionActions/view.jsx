// @flow
import * as ICONS from 'constants/icons';
import { COL_TYPES, SORT_ORDER, SORT_KEYS } from 'constants/collections';
import React from 'react';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import FileActionButton from 'component/common/file-action-button';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
import PlayButton from './internal/playButton';
import ShuffleButton from './internal/shuffleButton';

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
  doSortCollectionByKey: (collectionId: string, sortByKey: string, sortOrder: string) => void,
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
    doSortCollectionByKey,
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

        {!isOnPublicView && showEdit && (
          <div className="section__actions">
            <div className="sort-menu__button">
              <Menu>
                <MenuButton
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <FileActionButton className="button-toggle" icon={ICONS.MENU} title={__('Sort')} label={__('Sort')} />
                </MenuButton>

                <MenuList className="menu__list">
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => {
                      doSortCollectionByKey(collectionId, SORT_KEYS.RELEASED_AT, SORT_ORDER.ASC);
                    }}
                  >
                    <div className="menu__link">{__('Newest first')}</div>
                  </MenuItem>
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => {
                      doSortCollectionByKey(collectionId, SORT_KEYS.RELEASED_AT, SORT_ORDER.DESC);
                    }}
                  >
                    <div className="menu__link">{__('Oldest first')}</div>
                  </MenuItem>
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => {
                      doSortCollectionByKey(collectionId, SORT_KEYS.NAME, SORT_ORDER.DESC);
                    }}
                  >
                    <div className="menu__link">{__('A-Z')}</div>
                  </MenuItem>
                  <MenuItem
                    className="comment__menu-option"
                    onSelect={() => {
                      doSortCollectionByKey(collectionId, SORT_KEYS.NAME, SORT_ORDER.ASC);
                    }}
                  >
                    <div className="menu__link">{__('Z-A')}</div>
                  </MenuItem>
                </MenuList>
              </Menu>
            </div>
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
