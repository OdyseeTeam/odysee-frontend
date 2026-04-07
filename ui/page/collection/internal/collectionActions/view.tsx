import { COL_TYPES } from 'constants/collections';
import React from 'react';
import { useIsMobile } from 'effects/use-screensize';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { useLocation } from 'react-router-dom';
import FileReactions from 'component/fileReactions';
import classnames from 'classnames';
import { ENABLE_FILE_REACTIONS } from 'config';
import PlayButton from './internal/playButton';
import ShuffleButton from './internal/shuffleButton';
import SortButton from './internal/sortButton';
import { useAppSelector } from 'redux/hooks';
import { selectClaimForUri, makeSelectTagInClaimOrChannelForUri } from 'redux/selectors/claims';
import {
  selectCollectionIsMine,
  selectCollectionIsEmptyForId,
  selectCollectionSavedForId,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
import { DISABLE_REACTIONS_VIDEO_TAG } from 'constants/tags';
type Props = {
  uri: string;
  collectionId: string;
  showEdit: boolean;
  isHeader?: boolean;
  setShowEdit?: (arg0: boolean) => void;
  isBuiltin: boolean;
};

function CollectionActions(props: Props) {
  const { uri, collectionId, isBuiltin, showEdit } = props;
  const claimId = useAppSelector((state) => selectClaimForUri(state, uri))?.claim_id;
  const disableFileReactions = useAppSelector((state) =>
    makeSelectTagInClaimOrChannelForUri(uri, DISABLE_REACTIONS_VIDEO_TAG)(state)
  );
  const isMyCollection = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const collectionEmpty = useAppSelector((state) => selectCollectionIsEmptyForId(state, collectionId));
  const collectionSavedForId = useAppSelector((state) => selectCollectionSavedForId(state, collectionId));
  const collectionType = useAppSelector((state) => selectCollectionTypeForId(state, collectionId));
  const { search } = useLocation();
  const isMobile = useIsMobile();
  const showPlaybackButtons = !collectionEmpty && collectionType === COL_TYPES.PLAYLIST;
  const urlParams = new URLSearchParams(search);
  const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;
  return (
    <>
      <div
        className={classnames('media__actions justify-space-between collection-actions', {
          stretch: isMobile,
        })}
      >
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
  children: any;
};

const SectionElement = (props: SectionProps) => {
  const { children } = props;
  const isMobile = useIsMobile();
  return isMobile ? children : <div className="section__actions">{children}</div>;
};

export default CollectionActions;
