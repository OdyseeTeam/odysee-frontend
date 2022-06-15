// @flow
import React from 'react';
import Page from 'component/page';
import CollectionsListMine from './internal/collectionsListMine';

const PlaylistsPage = () => (
  <Page className="playlists-page__wrapper">
    <CollectionsListMine />
  </Page>
);

export default PlaylistsPage;
