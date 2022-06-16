// @flow
import React from 'react';
import CollectionPreview from './internal/collectionPreview';
import Button from 'component/button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import * as MODALS from 'constants/modal_types';
import Yrbl from 'component/yrbl';
import classnames from 'classnames';
import { FormField, Form } from 'component/common/form';
import { useIsMobile } from 'effects/use-screensize';
import { useHistory } from 'react-router-dom';
import BuiltinPlaylists from './internal/builtin-playlists';
import SectionLabel from './internal/label';
import SectionDivider from 'component/common/section-divider';
import TableHeader from './internal/table-header';

type Props = {
  publishedCollections: CollectionGroup,
  unpublishedCollections: CollectionGroup,
  isFetchingCollections: boolean,
  areBuiltinCollectionsEmpty: boolean,
  hasCollections: boolean,
  doOpenModal: (id: string) => void,
};

const LIST_TYPE = Object.freeze({ ALL: 'All', PRIVATE: 'Private', PUBLIC: 'Public' });
const PLAYLIST_SHOW_COUNT = Object.freeze({ DEFAULT: 12, MOBILE: 6 });

export default function CollectionsListMine(props: Props) {
  const {
    publishedCollections,
    unpublishedCollections,
    isFetchingCollections,
    areBuiltinCollectionsEmpty,
    hasCollections,
    doOpenModal,
  } = props;

  const isMobile = useIsMobile();

  const { push } = useHistory();

  const unpublishedCollectionsList = (Object.keys(unpublishedCollections || {}): any);
  const publishedList = (Object.keys(publishedCollections || {}): any);
  const collectionsUnresolved = unpublishedCollectionsList.length === 0 && publishedList.length === 0 && hasCollections;
  const [filterType, setFilterType] = React.useState(LIST_TYPE.ALL);
  const [searchText, setSearchText] = React.useState('');
  const playlistShowCount = isMobile ? PLAYLIST_SHOW_COUNT.MOBILE : PLAYLIST_SHOW_COUNT.DEFAULT;

  let collectionsToShow = [];
  if (filterType === LIST_TYPE.ALL) {
    collectionsToShow = unpublishedCollectionsList.concat(publishedList);
  } else if (filterType === LIST_TYPE.PRIVATE) {
    collectionsToShow = unpublishedCollectionsList;
  } else if (filterType === LIST_TYPE.PUBLIC) {
    collectionsToShow = publishedList;
  }

  let filteredCollections;
  if (searchText && collectionsToShow) {
    filteredCollections = collectionsToShow
      .filter((id) => {
        return (
          (unpublishedCollections[id] &&
            unpublishedCollections[id].name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) ||
          (publishedCollections[id] &&
            publishedCollections[id].name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()))
        );
      })
      .slice(0, playlistShowCount);
  } else {
    filteredCollections = collectionsToShow.slice(0, playlistShowCount) || [];
  }

  const totalLength = collectionsToShow ? collectionsToShow.length : 0;
  const filteredLength = filteredCollections.length;
  const isTruncated = totalLength > filteredLength;

  function escapeListener(e: SyntheticKeyboardEvent<*>) {
    if (e.keyCode === KEYCODES.ESCAPE) {
      e.preventDefault();
      setSearchText('');
    }
  }

  function onTextareaFocus() {
    window.addEventListener('keydown', escapeListener);
  }

  function onTextareaBlur() {
    window.removeEventListener('keydown', escapeListener);
  }

  function handleCreatePlaylist() {
    doOpenModal(MODALS.COLLECTION_CREATE);
  }

  if (areBuiltinCollectionsEmpty && !hasCollections) {
    return (
      <div className="claim-grid__wrapper">
        <BuiltinPlaylists />

        <div className="main--empty">
          <Yrbl
            type={'happy'}
            title={__('You can add videos to your Playlists')}
            subtitle={__('Do you want to find some content to save for later, or create a brand new playlist?')}
            actions={
              <div className="section__actions">
                <Button button="secondary" label={__('Explore!')} onClick={() => push('/')} />
                <Button button="primary" label={__('New Playlist')} onClick={handleCreatePlaylist} />
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="claim-grid__wrapper">
        <BuiltinPlaylists />

        <SectionDivider />

        <SectionLabel label={__('Your Playlists')} />

        {/* Playlists: search */}
        {hasCollections && (
          <div className="section__header-action-stack">
            <div className="section__header--actions">
              <div className="claim-search__menu-group">
                {Object.values(LIST_TYPE).map((value) => (
                  <Button
                    label={__(String(value))}
                    key={String(value)}
                    button="alt"
                    onClick={() => setFilterType(value)}
                    className={classnames('button-toggle', {
                      'button-toggle--active': filterType === value,
                    })}
                  />
                ))}
              </div>

              <div className="claim-search__wrapper--wrap">
                <div className="claim-search__menu-group">
                  <Form onSubmit={() => {}} className="wunderbar--inline">
                    <Icon icon={ICONS.SEARCH} />
                    <FormField
                      name="collection_search"
                      onFocus={onTextareaFocus}
                      onBlur={onTextareaBlur}
                      className="wunderbar__input--inline"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      type="text"
                      placeholder={__('Search')}
                    />
                  </Form>
                </div>

                <Button button="primary" label={__('New Playlist')} onClick={handleCreatePlaylist} />
              </div>
            </div>

            {isTruncated && (
              <p className="collection-grid__results-summary">
                {__('Showing %filtered% results of %total%', { filtered: filteredLength, total: totalLength })}
                {`${searchText ? ' (' + __('filtered') + ') ' : ' '}`}
              </p>
            )}
          </div>
        )}

        {/* Playlists: tiles */}
        {hasCollections && !collectionsUnresolved ? (
          <>
            {!isMobile && <TableHeader />}

            <ul className={classnames('ul--no-style claim-list', { playlists: !isMobile })}>
              {filteredCollections &&
                filteredCollections.length > 0 &&
                filteredCollections.map((key) => <CollectionPreview collectionId={key} key={key} />)}
              {!filteredCollections.length && <div className="empty main--empty">{__('No matching playlists')}</div>}
            </ul>
          </>
        ) : !isFetchingCollections && !collectionsUnresolved ? (
          <div className="main--empty">
            <Yrbl
              type={'sad'}
              title={__('You have no Playlists yet. Better start hoarding!')}
              actions={
                <div className="section__actions">
                  <Button button="primary" label={__('Create a Playlist')} onClick={handleCreatePlaylist} />
                </div>
              }
            />
          </div>
        ) : (
          <div className="main--empty">
            <h2 className="main--empty empty">{__('Loading...')}</h2>
          </div>
        )}
      </div>
    </>
  );
}
