// @flow
import React from 'react';

import * as MODALS from 'constants/modal_types';

import { useHistory } from 'react-router-dom';

import Button from 'component/button';
import Yrbl from 'component/yrbl';
import BuiltinPlaylists from './internal/builtin-playlists';
import Page from 'component/page';
import CollectionsListMine from './internal/collectionsListMine';
import Spinner from 'component/spinner';

type Props = {
  // -- redux --
  areBuiltinCollectionsEmpty: boolean,
  hasCollections: boolean,
  isFetchingCollections: ?boolean,
  doOpenModal: (id: string) => void,
  doFetchCollectionListMine: () => void,
};

const PlaylistsPage = (props: Props) => {
  const {
    areBuiltinCollectionsEmpty,
    hasCollections,
    isFetchingCollections,
    doOpenModal,
    doFetchCollectionListMine,
  } = props;

  const { push } = useHistory();

  function handleCreatePlaylist() {
    doOpenModal(MODALS.COLLECTION_CREATE);
  }

  React.useEffect(() => {
    if (isFetchingCollections === undefined) doFetchCollectionListMine();
  }, [isFetchingCollections, doFetchCollectionListMine]);

  if (!hasCollections) {
    if (isFetchingCollections !== false) {
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
                <Button button="secondary" label={__('Explore!')} onClick={() => push('/')} />
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
  <Page className="playlists-page-wrapper">
    <div className="claim-grid__wrapper">
      <BuiltinPlaylists />

      {children}
    </div>
  </Page>
);

export default PlaylistsPage;
