import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Icon from 'component/common/icon';
import React from 'react';
import classnames from 'classnames';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { doCollectionEdit } from 'redux/actions/collections';
import { selectIndexForUrlInCollectionForId, selectUrlsForCollectionId } from 'redux/selectors/collections';

type Props = {
  uri?: string;
  collectionId?: string;
  altIndex?: number;
  altCollection?: any;
  dragHandleProps?: any;
  isEditPreview?: boolean;
  altEditCollection?: (arg0: CollectionEditParams) => void;
  doDisablePlayerDrag?: (disable: boolean) => void;
};

export default function CollectionButtons(props: Props) {
  const {
    uri,
    collectionId,
    altIndex,
    altCollection,
    dragHandleProps,
    isEditPreview,
    altEditCollection,
    doDisablePlayerDrag,
  } = props;
  const dispatch = useAppDispatch();
  const foundIndex = useAppSelector((state) =>
    collectionId && uri ? selectIndexForUrlInCollectionForId(state, collectionId, uri) : undefined
  );
  const collectionUris = useAppSelector((state) =>
    collectionId ? selectUrlsForCollectionId(state, collectionId) : undefined
  );

  const editCollection = (params: CollectionEditParams) => {
    if (collectionId) dispatch(doCollectionEdit(collectionId, params));
  };

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const lastCollectionIndex = collectionUris
    ? collectionUris.length - 1
    : !altCollection
      ? 0
      : altCollection.length - 1;
  const collectionIndex = Number(altIndex) || Number(foundIndex);

  function handleOnClick(change) {
    if (!altCollection) {
      editCollection({
        isPreview: isEditPreview,
        ...change,
      });
    } else {
      altEditCollection(change);
    }
  }

  return (
    <div
      className="collection-preview__edit-buttons"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="collection-preview__edit-group" {...dragHandleProps}>
        <div
          className="button-collection-manage button-collection-drag top-left bottom-left"
          onMouseEnter={doDisablePlayerDrag ? () => doDisablePlayerDrag(true) : undefined}
          onMouseLeave={doDisablePlayerDrag ? () => doDisablePlayerDrag(false) : undefined}
        >
          <Icon icon={ICONS.DRAG} title={__('Drag')} size={20} />
        </div>
      </div>

      <div className="collection-preview__edit-group">
        <OrderButton
          title={__('Move Top')}
          icon={ICONS.UP_TOP}
          disabled={collectionIndex === 0}
          onClick={() =>
            handleOnClick({
              order: {
                from: collectionIndex,
                to: 0,
              },
            })
          }
        />

        <OrderButton
          title={__('Move Bottom')}
          icon={ICONS.DOWN_BOTTOM}
          disabled={collectionIndex === lastCollectionIndex}
          onClick={() =>
            handleOnClick({
              order: {
                from: collectionIndex,
                to: lastCollectionIndex,
              },
            })
          }
        />
      </div>

      <div className="collection-preview__edit-group">
        <OrderButton
          title={__('Move Up')}
          icon={ICONS.UP}
          disabled={collectionIndex === 0}
          onClick={() =>
            handleOnClick({
              order: {
                from: collectionIndex,
                to: collectionIndex - 1,
              },
            })
          }
        />

        <OrderButton
          title={__('Move Down')}
          icon={ICONS.DOWN}
          disabled={collectionIndex === lastCollectionIndex}
          onClick={() =>
            handleOnClick({
              order: {
                from: collectionIndex,
                to: collectionIndex + 1,
              },
            })
          }
        />
      </div>

      {!confirmDelete ? (
        <div className="collection-preview__edit-group collection-preview__delete ">
          <Button
            className="button-collection-manage button-collection-delete top-right bottom-right"
            icon={ICONS.DELETE}
            title={__('Remove')}
            onClick={() => setConfirmDelete(true)}
          />
        </div>
      ) : (
        <div className="collection-preview__edit-group collection-preview__delete">
          <Button
            className="button-collection-manage button-collection-delete-cancel top-right"
            icon={ICONS.REMOVE}
            title={__('Cancel')}
            onClick={() => setConfirmDelete(false)}
          />

          <OrderButton
            className="button-collection-delete-confirm bottom-right"
            title={__('Remove')}
            icon={ICONS.DELETE}
            onClick={() => {
              if (!altCollection && uri) {
                editCollection({
                  uris: [uri],
                  remove: true,
                  isPreview: isEditPreview,
                });
              } else if (altCollection) {
                altEditCollection({
                  delete: {
                    index: collectionIndex,
                  },
                });
                setConfirmDelete(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
type ButtonProps = {
  className?: string;
};

const OrderButton = (props: ButtonProps) => {
  const { className, ...buttonProps } = props;
  return <Button className={classnames('button-collection-manage', className)} {...buttonProps} />;
};
