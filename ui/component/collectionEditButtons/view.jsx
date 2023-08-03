// @flow
import * as ICONS from 'constants/icons';
import Button from 'component/button';
import Icon from 'component/common/icon';
import React from 'react';
import classnames from 'classnames';

type Props = {
  collectionIndex?: number,
  altIndex?: number,
  altCollection?: any,
  collectionUris: Array<Collection>,
  dragHandleProps?: any,
  uri: string,
  isEditPreview?: boolean,
  editCollection: (CollectionEditParams) => void,
  altEditCollection: (CollectionEditParams) => void,
  doDisablePlayerDrag?: (disable: boolean) => void,
};

export default function CollectionButtons(props: Props) {
  const {
    collectionIndex: foundIndex,
    altIndex,
    altCollection,
    collectionUris,
    dragHandleProps,
    uri,
    isEditPreview,
    editCollection,
    altEditCollection,
    doDisablePlayerDrag,
  } = props;

  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const lastCollectionIndex = collectionUris
    ? collectionUris.length - 1
    : !altCollection
    ? 0
    : altCollection.length - 1;
  const collectionIndex = Number(altIndex) || Number(foundIndex);

  function handleOnClick(change) {
    if (!altCollection) {
      editCollection({ isPreview: isEditPreview, ...change });
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
          onClick={() => handleOnClick({ order: { from: collectionIndex, to: 0 } })}
        />

        <OrderButton
          title={__('Move Bottom')}
          icon={ICONS.DOWN_BOTTOM}
          disabled={collectionIndex === lastCollectionIndex}
          onClick={() => handleOnClick({ order: { from: collectionIndex, to: lastCollectionIndex } })}
        />
      </div>

      <div className="collection-preview__edit-group">
        <OrderButton
          title={__('Move Up')}
          icon={ICONS.UP}
          disabled={collectionIndex === 0}
          onClick={() => handleOnClick({ order: { from: collectionIndex, to: collectionIndex - 1 } })}
        />

        <OrderButton
          title={__('Move Down')}
          icon={ICONS.DOWN}
          disabled={collectionIndex === lastCollectionIndex}
          onClick={() => handleOnClick({ order: { from: collectionIndex, to: collectionIndex + 1 } })}
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
              if (!altCollection) {
                editCollection({ uris: [uri], remove: true, isPreview: isEditPreview });
              } else {
                altEditCollection({ delete: { index: collectionIndex } });
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
  className?: string,
};

const OrderButton = (props: ButtonProps) => {
  const { className, ...buttonProps } = props;

  return <Button className={classnames('button-collection-manage', className)} {...buttonProps} />;
};
