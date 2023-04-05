// @flow
import React, { useState } from 'react';
import classnames from 'classnames';
import { FormField } from 'component/common/form';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';

// prettier-ignore
const Lazy = {
  // $FlowFixMe: cannot resolve dnd
  DragDropContext: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.DragDropContext }))),
  // $FlowFixMe: cannot resolve dnd
  Droppable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Droppable }))),
  // $FlowFixMe: cannot resolve dnd
  Draggable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Draggable }))),
};

const NON_CATEGORY = Object.freeze({
  BANNER: { label: 'Banner' },
  FOLLOWING: { label: 'Following' },
  PORTALS: { label: 'Portals' },
  FYP: { label: 'Recommended' },
});

// ****************************************************************************
// Helpers
// ****************************************************************************

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  destClone.splice(droppableDestination.index, 0, removed);

  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone,
  };
};

function getInitialList(listId, savedOrder, homepageSections, userHasOdyseeMembership) {
  const savedActiveOrder = savedOrder.active || [];
  const savedHiddenOrder = savedOrder.hidden || [];
  const sectionKeys = Object.keys(homepageSections);

  // From the saved entries, trim those that no longer exists in the latest (or different) Homepage.
  let activeOrder: Array<string> = savedActiveOrder.filter((x) => sectionKeys.includes(x));
  let hiddenOrder: Array<string> = savedHiddenOrder.filter((x) => sectionKeys.includes(x));

  // Add any new categories found into 'active' ...
  sectionKeys.forEach((key: string) => {
    if (!activeOrder.includes(key) && !hiddenOrder.includes(key)) {
      if (homepageSections[key].hideByDefault) {
        // ... unless it is a 'hideByDefault' category.
        hiddenOrder.push(key);
      } else {
        if (key === 'BANNER') {
          activeOrder.unshift(key);
        } else if (key === 'PORTALS') {
          activeOrder.splice(2, 0, key);
        } else {
          activeOrder.push(key);
        }
      }
    }
  });

  // Final check to exclude items that were previously moved to Hidden.
  activeOrder = activeOrder.filter((x) => !hiddenOrder.includes(x));

  // Clean categories in case premium section has accidentally been added
  if (!userHasOdyseeMembership) {
    if (activeOrder.indexOf('FYP') !== -1) {
      activeOrder.splice(activeOrder.indexOf('FYP'), 1);
    }
    if (hiddenOrder.indexOf('FYP') !== -1) {
      hiddenOrder.splice(hiddenOrder.indexOf('FYP'), 1);
    }
  }

  return listId === 'ACTIVE' ? activeOrder : hiddenOrder;
}

// ****************************************************************************
// HomepageSort
// ****************************************************************************

type HomepageOrder = { active: ?Array<string>, hidden: ?Array<string> };

type Props = {
  onUpdate: (newOrder: HomepageOrder) => void,
  // --- redux:
  homepageData: any,
  homepageOrder: HomepageOrder,
  userHasOdyseeMembership: boolean,
};

export default function HomepageSort(props: Props) {
  const { onUpdate, homepageData, homepageOrder, userHasOdyseeMembership } = props;
  const { categories } = homepageData;

  const SECTIONS = { ...NON_CATEGORY, ...categories };
  const [listActive, setListActive] = useState(() =>
    getInitialList('ACTIVE', homepageOrder, SECTIONS, userHasOdyseeMembership)
  );
  const [listHidden, setListHidden] = useState(() =>
    getInitialList('HIDDEN', homepageOrder, SECTIONS, userHasOdyseeMembership)
  );

  const BINS = {
    ACTIVE: { id: 'ACTIVE', title: 'Active', list: listActive, setList: setListActive },
    HIDDEN: { id: 'HIDDEN', title: 'Hidden', list: listHidden, setList: setListHidden },
  };

  const [showBanner, setShowBanner] = React.useState(BINS['ACTIVE'].list.includes('BANNER'));

  function onDragEnd(result) {
    const { source, destination } = result;

    if (destination) {
      if (source.droppableId === destination.droppableId) {
        const newList = reorder(BINS[source.droppableId].list, source.index, destination.index);
        BINS[source.droppableId].setList(newList);
      } else {
        const result = move(BINS[source.droppableId].list, BINS[destination.droppableId].list, source, destination);
        BINS[source.droppableId].setList(result[source.droppableId]);
        BINS[destination.droppableId].setList(result[destination.droppableId]);
      }
    }
  }

  function toggleBanner() {
    const result = BINS;
    if (result['ACTIVE'].list.indexOf('BANNER') !== -1) {
      result['ACTIVE'].list.splice(result['ACTIVE'].list.indexOf('BANNER'), 1);
      result['HIDDEN'].list.push('BANNER');
      setShowBanner(false);
    } else {
      result['HIDDEN'].list.splice(result['HIDDEN'].list.indexOf('BANNER'), 1);
      result['ACTIVE'].list.push('BANNER');
      setShowBanner(true);
    }
    BINS['ACTIVE'].setList(result['ACTIVE'].list);
    BINS['HIDDEN'].setList(result['HIDDEN'].list);

    onUpdate({ active: BINS['ACTIVE'].list, hidden: BINS['HIDDEN'].list });
  }

  const draggedItemRef = React.useRef();

  const DraggableItem = ({ item, index }: any) => {
    return (
      <Lazy.Draggable draggableId={item} index={index}>
        {(draggableProvided, snapshot) => {
          if (snapshot.isDragging) {
            // https://github.com/atlassian/react-beautiful-dnd/issues/1881#issuecomment-691237307
            // $FlowFixMe
            draggableProvided.draggableProps.style.left = draggedItemRef.offsetLeft;
            draggableProvided.draggableProps.style.top =
              draggableProvided.draggableProps.style.top - document.getElementsByClassName('modal')[0].offsetTop;
          }
          return (
            <div
              className={classnames('homepage-sort__entry', {
                'homepage-sort__entry--special': item === 'BANNER' || item === 'PORTALS',
              })}
              ref={draggableProvided.innerRef}
              {...draggableProvided.draggableProps}
              {...draggableProvided.dragHandleProps}
            >
              <div ref={draggedItemRef}>
                <Icon icon={ICONS.MENU} title={__('Drag')} size={20} />
              </div>
              {__(SECTIONS[item].label)}
            </div>
          );
        }}
      </Lazy.Draggable>
    );
  };

  const DroppableBin = ({ bin, className }: any) => {
    return (
      <Lazy.Droppable droppableId={bin.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={classnames('homepage-sort__bin', className, {
              'homepage-sort__bin--highlight': snapshot.isDraggingOver,
            })}
          >
            <div className="homepage-sort__bin-header">{__(bin.title)}</div>

            {bin.id === 'ACTIVE' && (
              <div className="homepage-sort__entry homepage-sort__entry--special">
                <FormField
                  type="checkbox"
                  name="homepage_banner"
                  label={__('Banner')}
                  checked={showBanner}
                  onChange={() => toggleBanner()}
                />
              </div>
            )}
            {bin.list.map((item, index) => (
              <>{item !== 'BANNER' && <DraggableItem key={item} item={item} index={index} />}</>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Lazy.Droppable>
    );
  };

  React.useEffect(() => {
    if (onUpdate) {
      return onUpdate({ active: listActive, hidden: listHidden });
    }
  }, [listActive, listHidden, onUpdate]);

  return (
    <React.Suspense fallback={null}>
      <div className="homepage-sort">
        <Lazy.DragDropContext onDragEnd={onDragEnd}>
          <DroppableBin bin={BINS.ACTIVE} />
          <DroppableBin bin={BINS.HIDDEN} />
        </Lazy.DragDropContext>
      </div>
    </React.Suspense>
  );
}
