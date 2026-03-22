import React from 'react';
import ClaimList from 'component/claimList';
import withCollectionItems from 'hocs/withCollectionItems';
import { doCollectionEdit } from 'redux/actions/collections';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import { selectUrlsForCollectionId, selectUrlsForCollectionIdNonDeleted } from 'redux/selectors/collections';
import { useAppSelector, useAppDispatch } from 'redux/hooks';

// prettier-ignore
const Lazy = {
  DragDropContext: React.lazy(() => import('@hello-pangea/dnd'
  /* webpackChunkName: "dnd" */
  ).then(module => ({
    default: module.DragDropContext
  }))),
  Droppable: React.lazy(() => import('@hello-pangea/dnd'
  /* webpackChunkName: "dnd" */
  ).then(module => ({
    default: module.Droppable
  })))
};
type Props = {
  collectionId: string;
  isEditPreview?: boolean;
};

const CollectionItemsList = (props: Props) => {
  const { collectionId, isEditPreview, ...claimListProps } = props;

  const dispatch = useAppDispatch();
  const collectionUrls = useAppSelector((state) =>
    collectionId === COLLECTIONS_CONSTS.WATCH_LATER_ID
      ? selectUrlsForCollectionIdNonDeleted(state, collectionId)
      : selectUrlsForCollectionId(state, collectionId)
  );

  function handleOnDragEnd(result: any) {
    const { source, destination } = result;
    if (!destination) return;
    const { index: from } = source;
    const { index: to } = destination;
    dispatch(
      doCollectionEdit(collectionId, {
        order: {
          from,
          to,
        },
        isPreview: isEditPreview,
      })
    );
  }

  return (
    <React.Suspense fallback={null}>
      <Lazy.DragDropContext onDragEnd={handleOnDragEnd}>
        <Lazy.Droppable droppableId="list__ordering">
          {(DroppableProvided) => (
            <ClaimList
              collectionId={collectionId}
              uris={collectionUrls}
              isEditPreview={isEditPreview}
              droppableProvided={DroppableProvided}
              {...claimListProps}
            />
          )}
        </Lazy.Droppable>
      </Lazy.DragDropContext>
    </React.Suspense>
  );
};

export default withCollectionItems(CollectionItemsList);
