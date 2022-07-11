// @flow
import React from 'react';

const TableHeader = () => (
  <table className="table table--playlists">
    <thead>
      <tr>
        <th className="table-column__playlist">{__('Playlist')}</th>
        <th className="table-column__visibility">{__('Visibility')}</th>
        <th className="table-column__video-count">{__('Video Count')}</th>
        <th className="table-column__create-at">{__('Created at')}</th>
        <th className="table-column__update-at">{__('Last updated at')}</th>
      </tr>
    </thead>
  </table>
);

export default TableHeader;
