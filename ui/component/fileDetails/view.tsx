import { SIMPLE_SITE } from 'config';
import React from 'react';
import Button from 'component/button';
import { formatBytes } from 'util/format-bytes';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { makeSelectContentTypeForUri, makeSelectMetadataForUri, selectClaimForUri } from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';
import { selectUser } from 'redux/selectors/user';
import { doOpenFileInFolder } from 'redux/actions/file';

type Props = {
  uri: string;
};

const FileDetails = React.memo(function FileDetails({ uri }: Props) {
  const dispatch = useAppDispatch();

  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const contentType = useAppSelector((state) => makeSelectContentTypeForUri(uri)(state));
  const fileInfo = useAppSelector((state) => makeSelectFileInfoForUri(uri)(state));
  const metadata = useAppSelector((state) => makeSelectMetadataForUri(uri)(state));

  const openFolder = (path: string) => dispatch(doOpenFileInFolder(path));

  if (!claim || !metadata) {
    return <span className="empty">{__('Empty claim or metadata info.')}</span>;
  }

  const { languages, license, license_url } = metadata;
  const mediaType = contentType || 'unknown';
  const fileSize =
    metadata.source && metadata.source.size
      ? formatBytes(metadata.source.size)
      : fileInfo && fileInfo.download_path && formatBytes(fileInfo.written_bytes);
  let downloadPath =
    fileInfo && fileInfo.download_path ? fileInfo.download_path.replace(/\\/g, '/').replace(/\/+/g, '/') : null;
  let downloadNote;

  // If the path is blank, file is not available. Streamed files won't have any blobs saved
  // Create path from name so the folder opens on click.
  if (fileInfo && fileInfo.blobs_completed >= 1 && fileInfo.download_path === null) {
    downloadPath = `${fileInfo.download_directory}/${fileInfo.file_name}`;
    downloadNote = __('This file may have been streamed, moved or deleted');
  }

  return (
    <>
      {!SIMPLE_SITE && (
        <>
          {languages && (
            <div className="media__details">
              <span>{__('Languages')}</span>
              <span>{languages.join(' ')}</span>
            </div>
          )}

          {mediaType && (
            <div className="media__details">
              <span>{__('Media Type')}</span>
              <span>{mediaType}</span>
            </div>
          )}

          <div className="media__details">
            <span>{__('License')}</span>
            <span>{license}</span>
          </div>

          {downloadPath && (
            <div className="media__details">
              <span>{__('Downloaded to')}</span>
              <span>
                <Button
                  button="link"
                  className="button--download-link"
                  onClick={() => {
                    if (downloadPath) {
                      openFolder(downloadPath);
                    }
                  }}
                  label={downloadNote || downloadPath.replace(/(.{10})/g, '$1\u200b')}
                />
              </span>
            </div>
          )}
        </>
      )}

      {SIMPLE_SITE && (
        <>
          {license !== 'None' && (
            <div className="file-detail">
              <span className="file-detail__label">{__('License')}</span>
              <span className="file-detail__value">{license}</span>
              {license_url && <span className="file-detail__value">{license_url}</span>}
            </div>
          )}

          {fileSize && (
            <div className="file-detail">
              <span className="file-detail__label">{__('File size')}</span>
              <span className="file-detail__value">{fileSize}</span>
            </div>
          )}
        </>
      )}
    </>
  );
});

export default FileDetails;
