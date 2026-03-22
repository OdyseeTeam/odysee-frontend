import React from 'react';
import * as MODALS from 'constants/modal_types';
import { useNavigate } from 'react-router-dom';
import Button from 'component/button';
import Yrbl from 'component/yrbl';
import BuiltinPlaylists from './internal/builtin-playlists';
import Page from 'component/page';
import CollectionsListMine from './internal/collectionsListMine';
import Spinner from 'component/spinner';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectAreBuiltinCollectionsEmpty,
  selectHasCollections,
  selectIsFetchingMyCollections,
} from 'redux/selectors/collections';
import { doFetchCollectionListMine } from 'redux/actions/collections';
import { doOpenModal } from 'redux/actions/app';
import './style.scss';

const PlaylistsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const areBuiltinCollectionsEmpty = useAppSelector(selectAreBuiltinCollectionsEmpty);
  const hasCollections = useAppSelector(selectHasCollections);
  const isFetchingCollections = useAppSelector(selectIsFetchingMyCollections);

  function handleCreatePlaylist() {
    dispatch(doOpenModal(MODALS.COLLECTION_CREATE));
  }

  React.useEffect(() => {
    if (isFetchingCollections === undefined) dispatch(doFetchCollectionListMine());
  }, [isFetchingCollections, dispatch]);

  if (!hasCollections) {
    if (isFetchingCollections) {
      // Fetching collection_list
      return (
        <Wrapper>
          <div className="main--empty empty">
            <Spinner text={__('Loading your playlists...')} />
          </div>
        </Wrapper>
      );
    }

    if (areBuiltinCollectionsEmpty) {
      // Has nothing in watchlater/favorites, "teach" how to use playlists
      return (
        <Wrapper>
          <Yrbl
            type="happy"
            title={__('You can add videos to your Playlists')}
            subtitle={__('Do you want to find some content to save for later, or create a brand new playlist?')}
            actions={
              <div className="section__actions">
                <Button button="secondary" label={__('Explore!')} onClick={() => navigate('/')} />
                <Button button="primary" label={__('New Playlist')} onClick={handleCreatePlaylist} />
              </div>
            }
          />
        </Wrapper>
      );
    }

    // Has items in watchlater/favorites but no created playlists, show this message
    return (
      <Wrapper>
        <Yrbl
          type="sad"
          title={__('You have no Playlists yet. Better start hoarding!')}
          actions={
            <div className="section__actions">
              <Button button="primary" label={__('Create a Playlist')} onClick={handleCreatePlaylist} />
            </div>
          }
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <CollectionsListMine handleCreatePlaylist={handleCreatePlaylist} />
    </Wrapper>
  );
};

const Wrapper = ({ children }: { children: any }) => (
  <Page className="playlists-page__wrapper">
    <div className="claim-grid__wrapper">
      <BuiltinPlaylists />

      {children}
    </div>
  </Page>
);

export default PlaylistsPage;
