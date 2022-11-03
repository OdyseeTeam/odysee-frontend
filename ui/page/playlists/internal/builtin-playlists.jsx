// @flow
import React from 'react';
import classnames from 'classnames';
import * as COLS from 'constants/collections';
import CollectionPreview from './collectionsListMine/internal/collectionPreview';
import SectionLabel from './collectionsListMine/internal/label';
import TableHeader from './collectionsListMine/internal/table-header';
import { useIsMobile } from 'effects/use-screensize';

const BuiltinPlaylists = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <SectionLabel label={__('Default Playlists')} />

      {!isMobile && <TableHeader />}

      <ul className={classnames('ul--no-style claim-list', { playlists: !isMobile })}>
        {COLS.BUILTIN_PLAYLISTS.map(
          (playlist) => playlist !== COLS.QUEUE_ID && <CollectionPreview collectionId={playlist} key={playlist} />
        )}
      </ul>
    </>
  );
};

export default BuiltinPlaylists;
