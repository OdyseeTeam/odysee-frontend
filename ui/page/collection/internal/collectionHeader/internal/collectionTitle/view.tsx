import React from 'react';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { useLocation, useNavigate } from 'react-router-dom';
import { COLLECTION_PAGE } from 'constants/urlParams';
import { CollectionPageContext } from 'page/collection/context';
import Icon from 'component/common/icon';
import Skeleton from '@mui/material/Skeleton';
import Button from 'component/button';
import { useAppSelector } from 'redux/hooks';
import {
  selectCollectionTitleForId,
  selectCollectionHasEditsForId,
  selectCollectionIsMine,
  selectCollectionTypeForId,
} from 'redux/selectors/collections';
type Props = {
  collectionId: string;
  noIcon?: boolean;
};

const CollectionTitle = (props: Props) => {
  const { collectionId, noIcon } = props;
  const navigate = useNavigate();
  const { search } = useLocation();
  const { togglePublicCollection } = React.useContext(CollectionPageContext);
  const collectionTitle = useAppSelector((state) => selectCollectionTitleForId(state, collectionId));
  const collectionHasEdits = useAppSelector((state) => selectCollectionHasEditsForId(state, collectionId));
  const isMyCollection = useAppSelector((state) => selectCollectionIsMine(state, collectionId));
  const collectionType = useAppSelector((state) => selectCollectionTypeForId(state, collectionId));
  const isBuiltin = COLLECTIONS_CONSTS.BUILTIN_PLAYLISTS.includes(collectionId);
  const urlParams = new URLSearchParams(search);
  const isOnPublicView = urlParams.get(COLLECTION_PAGE.QUERIES.VIEW) === COLLECTION_PAGE.VIEWS.PUBLIC;
  const showEditButton =
    isMyCollection &&
    !isBuiltin &&
    !isOnPublicView &&
    collectionType !== COLLECTIONS_CONSTS.COL_TYPES.FEATURED_CHANNELS;
  return (
    <div className="card__title card__title--with-actions">
      <h2 className="card-title__text">
        {!noIcon && (
          <Icon
            icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[collectionId] || ICONS.PLAYLIST}
            className="icon--margin-right"
          />
        )}

        {collectionTitle ? (
          <label>{isBuiltin ? __(collectionTitle) : collectionTitle}</label>
        ) : (
          <Skeleton
            variant="text"
            animation="wave"
            className="header__navigationItem--balanceLoading"
            style={{
              display: 'inline-block',
            }}
          />
        )}
      </h2>

      {(collectionHasEdits || showEditButton) && (
        <div className="card-title__action-buttons">
          {collectionHasEdits && (
            <Button
              label={isOnPublicView ? __('View pending changes') : __('View public version')}
              iconColor={isOnPublicView && 'red'}
              className="button-toggle"
              icon={ICONS.EYE}
              onClick={togglePublicCollection}
            />
          )}

          {showEditButton && (
            <Button
              title={__('Edit')}
              className="button-toggle"
              icon={ICONS.EDIT}
              onClick={() =>
                navigate(
                  `/$/${PAGES.PLAYLIST}/${collectionId}?${COLLECTION_PAGE.QUERIES.VIEW}=${COLLECTION_PAGE.VIEWS.EDIT}`
                )
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionTitle;
