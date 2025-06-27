// @flow
import { COL_TYPES } from 'constants/collections';
import React from 'react';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useHistory } from 'react-router-dom';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
import PlayButton from './internal/playButton';
import ShuffleButton from './internal/shuffleButton';
import SortButton from './internal/sortButton';

type Props = {
  uri: string,
  claimId?: string,
  isMyCollection: boolean,
  disableFileReactions: boolean,
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
};

function CollectionActions(props: Props) {
  const {
    uri,
    // claimId,
    // isMyCollection,
    disableFileReactions,
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

          {!isBuiltin && !disableFileReactions && (
            <>{uri && <>{ENABLE_FILE_REACTIONS && <FileReactions uri={uri} />}</>}</>
          )}
        </SectionElement>

        {!isOnPublicView && showEdit && <SortButton collectionId={collectionId} />}
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
