// @flow
import React from 'react';

import ClaimList from 'component/claimList';
import withCollectionItems from 'hocs/withCollectionItems';

// prettier-ignore
const Lazy = {
  DragDropContext: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.DragDropContext }))),
  Droppable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Droppable }))),
};

type Props = {
  collectionId: string,
  isEditPreview?: boolean,
  // -- redux --
  collectionUrls: ?Array<string>,
  doCollectionEdit: (id: string, params: CollectionEditParams) => void,
};

const CollectionItemsList = (props: Props) => {
  const { collectionId, isEditPreview, collectionUrls, doCollectionEdit, ...claimListProps } = props;

  function handleOnDragEnd(result: any) {
    const { source, destination } = result;

    if (!destination) return;

    const { index: from } = source;
    const { index: to } = destination;

    doCollectionEdit(collectionId, { order: { from, to }, isPreview: isEditPreview });
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
