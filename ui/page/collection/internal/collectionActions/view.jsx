// @flow
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { COL_TYPES, SORT_ORDER } from 'constants/collections';
import React from 'react';
import Button from 'component/button';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import ClaimSupportButton from 'component/claimSupportButton';
import ClaimShareButton from 'component/claimShareButton';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
// import ClaimRepostButton from 'component/claimRepostButton';
import PlayButton from './internal/playButton';
import ShuffleButton from './internal/shuffleButton';
import CollectionDeleteButton from 'component/collectionDeleteButton';
import CollectionPublishButton from './internal/publishButton';
import CollectionReportButton from './internal/report-button';

type Props = {
  uri: string,
  claimId?: string,
  isMyCollection: boolean,
  collectionId: string,
  showEdit: boolean,
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
    claimId,
    isMyCollection,
    collectionId,
    isBuiltin,
    showEdit,
    setShowEdit,
    collectionSavedForId,
    collectionEmpty,
    collectionType,
    doOpenModal,
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
    <div className={classnames('media__actions justify-space-between', { stretch: isMobile })}>
      <SectionElement>
        {showPlaybackButtons && <PlayButton collectionId={collectionId} />}
        {showPlaybackButtons && <ShuffleButton collectionId={collectionId} />}

        {!isBuiltin && (
          <>
            {uri && (
              <>
                {ENABLE_FILE_REACTIONS && <FileReactions uri={uri} />}
                <ClaimSupportButton uri={uri} fileAction />
                {/* <ClaimRepostButton uri={uri} /> */}
                <ClaimShareButton uri={uri} collectionId={collectionId} fileAction webShareable />
              </>
            )}

            {!isOnPublicView &&
              (isMyCollection ? (
                <>
                  <CollectionPublishButton uri={uri} collectionId={collectionId} />
                  <CollectionDeleteButton uri={uri} collectionId={collectionId} />
                </>
              ) : (
                claimId && <CollectionReportButton claimId={claimId} />
              ))}
          </>
        )}
      </SectionElement>

      {!isOnPublicView && (
        <div>
          <Button
            requiresAuth
            title={__('Copy')}
            className="button-toggle"
            icon={ICONS.COPY}
            onClick={() => doOpenModal(MODALS.COLLECTION_CREATE, { sourceId: collectionId })}
          />

          {isMyCollection ? (
            !collectionEmpty && (
              <Button
                title={__('Arrange')}
                className={classnames('button-toggle', { 'button-toggle--active': showEdit })}
                icon={ICONS.ARRANGE}
                onClick={() => setShowEdit(!showEdit)}
              />
            )
          ) : (
            <Button
              requiresAuth
              title={__('Save')}
              className="button-toggle"
              icon={collectionSavedForId ? ICONS.PLAYLIST_FILLED : ICONS.PLAYLIST_ADD}
              onClick={() => doToggleCollectionSavedForId(collectionId)}
            />
          )}
        </div>
      )}
    </div>
      {showEdit && (
      <div className="sort__actions">
        <div>
          <Button
            title={__('Sort by release time: Ascending')}
            className="button-toggle"
            onClick={() => {doSortCollectionByReleaseTime(collectionId, SORT_ORDER.ASC)}}
            icon={ICONS.UP}
          />
          <Button
            title={__('Sort by release time: Descending')}
            className="button-toggle"
            onClick={() => {doSortCollectionByReleaseTime(collectionId, SORT_ORDER.DESC)}}
            icon={ICONS.DOWN}
          />
        </div>
      </div>
      )}
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
