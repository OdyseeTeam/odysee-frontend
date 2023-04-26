/**
 * Wrapper to enable drag-and-drop sorting on any list of elements.
 *
 * Encapsulates the complexity of 'react-beautiful-dnd' for clients that just
 * want the ability to drag and sort items.
 *
 * It is parked under ChannelFinder for now, but it is meant to be a generic/
 * re-usable component (css side still requires some work to make it generic by
 * getting props from client).
 */

// @flow
import React from 'react';
import classnames from 'classnames';
import './style';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

// prettier-ignore
const Lazy = {
  DragDropContext: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.DragDropContext }))),
  Droppable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Droppable }))),
  Draggable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Draggable }))),
};

// ****************************************************************************
// ****************************************************************************

type Props = {
  list: Array<any>,
  onGetElemAtIndex: (item: any, index: number) => React$Element<any>,
  onIsHiddenAtIndex?: (item: any, index: number) => boolean,
  onDragEnd: ({ source: any, destination: any }) => void,
};

export default function SortableList(props: Props) {
  const { list, onGetElemAtIndex, onIsHiddenAtIndex, onDragEnd } = props;

  const draggedItemRef = React.useRef();

  const DraggableItem = ({ item, index }: any) => {
    return (
      <Lazy.Draggable draggableId={item} index={index}>
        {(draggableProvided, snapshot) => {
          if (snapshot.isDragging) {
            // Handle strange offset (https://github.com/atlassian/react-beautiful-dnd/issues/1881#issuecomment-691237307)
            const dp = draggableProvided.draggableProps;
            if (draggedItemRef.current && dp.style && dp.style.left && dp.style.top) {
              // $FlowFixMe (`.offsetLeft` is wrong; should be `.current.offsetLeft`. But Firefox breaks without wrong code).
              dp.style.left = draggedItemRef.offsetLeft;
              // $FlowIgnore (already confirmed 'style' is not null and not NotDraggingStyle)
              dp.style.top = dp.style.top - document.getElementsByClassName('modal')[0].offsetTop;
            }
          }
          return (
            <div
              className={classnames('sortable__item', {
                'sortable__item--hidden': onIsHiddenAtIndex && onIsHiddenAtIndex(item, index),
              })}
              ref={draggableProvided.innerRef}
              {...draggableProvided.draggableProps}
              {...draggableProvided.dragHandleProps}
            >
              <div className="sortable__drag-handle" ref={draggedItemRef}>
                <Icon icon={ICONS.MENU} title={__('Drag')} size={20} />
              </div>
              {onGetElemAtIndex(item, index)}
            </div>
          );
        }}
      </Lazy.Draggable>
    );
  };

  const DroppableBin = ({ list, className }: any) => {
    return (
      <Lazy.Droppable droppableId="bin-1">
        {(provided /* ,snapshot */) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className={classnames('sortable__bin', className)}>
            {list.map((item, index) => (
              <DraggableItem key={item} item={item} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Lazy.Droppable>
    );
  };

  return (
    <React.Suspense fallback={null}>
      <div className="sortable">
        <Lazy.DragDropContext onDragEnd={onDragEnd}>
          <DroppableBin list={list} />
        </Lazy.DragDropContext>
      </div>
    </React.Suspense>
  );
}
