// @flow
import React from 'react';
import classnames from 'classnames';
import ClaimList from 'component/claimList';
import Card from 'component/common/card';
import Button from 'component/button';
import * as PAGES from 'constants/pages';
import * as DRAWERS from 'constants/drawer_types';
import * as COLLECTIONS_CONSTS from 'constants/collections';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { NavLink } from 'react-router-dom';
import UriIndicator from 'component/uriIndicator';
import I18nMessage from 'component/i18nMessage';
import ShuffleButton from './internal/shuffleButton';
import LoopButton from './internal/loopButton';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';

// prettier-ignore
const Lazy = {
  // $FlowFixMe
  DragDropContext: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.DragDropContext }))),
  // $FlowFixMe
  Droppable: React.lazy(() => import('react-beautiful-dnd' /* webpackChunkName: "dnd" */).then((module) => ({ default: module.Droppable }))),
};

type Props = {
  id: string,
  url: string,
  customTitle?: string,
  isMyCollection: boolean,
  collectionUrls: Array<Claim>,
  collectionName: string,
  isPrivateCollection: boolean,
  publishedCollectionName: string | boolean,
  playingItemIndex: number,
  collectionLength: number,
  bodyOpen?: boolean,
  playItemsOnClick?: boolean,
  useDrawer?: boolean,
  createUnpublishedCollection: (string, Array<any>, ?string) => void,
  doCollectionEdit: (string, CollectionEditParams) => void,
  enableCardBody?: () => void,
};

export default function PlaylistCard(props: Props) {
  const { isMyCollection, collectionName, id, useDrawer } = props;

  const [showEdit, setShowEdit] = React.useState(false);

  const playlistCardProps = { showEdit, setShowEdit, ...props };

  if (useDrawer) {
    return (
      <>
        <DrawerExpandButton
          fixed
          icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[id] || ICONS.PLAYLIST}
          label={__('Now playing: --[Which Playlist is currently playing]--') + ' ' + collectionName}
          type={DRAWERS.PLAYLIST}
        />

        <SwipeableDrawer
          type={DRAWERS.PLAYLIST}
          title={
            // returns the card title element
            <PlaylistCardComponent
              {...playlistCardProps}
              className="playlist-card--drawer-header"
              colorHeader={false}
              titleOnly
            />
          }
          actions={
            isMyCollection && (
              <Button
                title={__('Edit')}
                className={classnames('button-toggle', { 'button-toggle--active': showEdit })}
                icon={ICONS.EDIT}
                onClick={() => setShowEdit(!showEdit)}
              />
            )
          }
          hasSubtitle
        >
          {/* returns the card body element */}
          <PlaylistCardComponent {...playlistCardProps} className="playlist-card" bodyOnly />
        </SwipeableDrawer>
      </>
    );
  }

  // returns the full card element
  return <PlaylistCardComponent {...playlistCardProps} className="playlist-card" />;
}

type PlaylistCardProps = Props & {
  titleOnly?: boolean,
  bodyOnly?: boolean,
  showEdit: boolean,
  setShowEdit: (show: boolean) => void,
};

const PlaylistCardComponent = (props: PlaylistCardProps) => {
  const {
    isMyCollection,
    collectionUrls,
    collectionName,
    id,
    url,
    customTitle,
    bodyOpen = true,
    isPrivateCollection,
    publishedCollectionName,
    doCollectionEdit,
    playingItemIndex,
    collectionLength,
    enableCardBody,
    playItemsOnClick,
    titleOnly,
    bodyOnly,
    showEdit,
    setShowEdit,
    ...cardProps
  } = props;

  function handleOnDragEnd(result) {
    const { source, destination } = result;

    if (!destination) return;

    const { index: from } = source;
    const { index: to } = destination;

    doCollectionEdit(id, { order: { from, to } });
  }

  return (
    <Card
      {...cardProps}
      smallTitle
      slimHeader={!enableCardBody}
      gridHeader={Boolean(enableCardBody)}
      singlePane
      headerActions={
        !bodyOpen || bodyOnly ? undefined : (
          <span className="playlist-card-actions">
            <LoopButton id={id} />
            <ShuffleButton url={url} id={id} />
          </span>
        )
      }
      title={
        bodyOnly ? undefined : (
          <NavLink to={`/$/${PAGES.PLAYLIST}/${id}`} className="a--styled">
            {customTitle || (
              <Icon icon={COLLECTIONS_CONSTS.PLAYLIST_ICONS[id] || ICONS.PLAYLIST} className="icon--margin-right" />
            )}
            {collectionName}
          </NavLink>
        )
      }
      titleActions={
        bodyOnly || titleOnly ? undefined : (
          <>
            {isMyCollection && bodyOpen && (
              <Button
                title={__('Edit')}
                className={classnames('button-toggle', { 'button-toggle--active': showEdit })}
                icon={ICONS.EDIT}
                onClick={() => setShowEdit(!showEdit)}
              />
            )}
            {enableCardBody && (
              <Button
                className={classnames('button-toggle')}
                icon={bodyOpen ? ICONS.UP : ICONS.DOWN}
                onClick={enableCardBody}
              />
            )}
          </>
        )
      }
      subtitle={
        bodyOnly ? undefined : (
          <>
            {isPrivateCollection ? (
              <I18nMessage tokens={{ lock_icon: <Icon icon={ICONS.LOCK} style={{ transform: 'translateY(3px)' }} /> }}>
                Private %lock_icon%
              </I18nMessage>
            ) : (
              <UriIndicator link uri={publishedCollectionName} />
            )}

            {` - ${playingItemIndex}/${collectionLength}`}
          </>
        )
      }
      body={
        !bodyOpen || titleOnly ? undefined : (
          <React.Suspense fallback={null}>
            <Lazy.DragDropContext onDragEnd={handleOnDragEnd}>
              <Lazy.Droppable droppableId="list__ordering">
                {(DroppableProvided) => (
                  <ClaimList
                    type="small"
                    activeUri={url}
                    uris={collectionUrls}
                    collectionId={id}
                    empty={__('Playlist is Empty')}
                    showEdit={showEdit}
                    droppableProvided={DroppableProvided}
                    smallThumbnail
                    showIndexes
                    playItemsOnClick={playItemsOnClick}
                  />
                )}
              </Lazy.Droppable>
            </Lazy.DragDropContext>
          </React.Suspense>
        )
      }
    />
  );
};
