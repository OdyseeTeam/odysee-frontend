// @flow
import React from 'react';

import * as MODALS from 'constants/modal_types';

import { useHistory } from 'react-router-dom';

import Button from 'component/button';
import Yrbl from 'component/yrbl';
import BuiltinPlaylists from './internal/builtin-playlists';
import Page from 'component/page';
import CollectionsListMine from './internal/collectionsListMine';

type Props = {
  // -- redux --
  areBuiltinCollectionsEmpty: boolean,
  hasCollections: boolean,
  doOpenModal: (id: string) => void,
};

const PlaylistsPage = (props: Props) => {
  const { areBuiltinCollectionsEmpty, hasCollections, doOpenModal } = props;

  const { push } = useHistory();

  function handleCreatePlaylist() {
    doOpenModal(MODALS.COLLECTION_CREATE);
  }

  if (areBuiltinCollectionsEmpty && !hasCollections) {
    return (
      <Page className="playlists-page-wrapper">
        <div className="claim-grid__wrapper">
          <BuiltinPlaylists />

          <div className="main--empty">
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
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="playlists-page-wrapper">
      <CollectionsListMine handleCreatePlaylist={handleCreatePlaylist} />
    </Page>
  );
};

export default PlaylistsPage;
