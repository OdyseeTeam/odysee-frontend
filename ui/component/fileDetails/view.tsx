import React from 'react';
import { formatBytes } from 'util/format-bytes';
import { useAppSelector } from 'redux/hooks';
import { makeSelectMetadataForUri, selectClaimForUri } from 'redux/selectors/claims';
import { makeSelectFileInfoForUri } from 'redux/selectors/file_info';

type Props = {
  uri: string;
};

const FileDetails = React.memo(function FileDetails({ uri }: Props) {
  const claim = useAppSelector((state) => selectClaimForUri(state, uri));
  const fileInfo = useAppSelector((state) => makeSelectFileInfoForUri(uri)(state));
  const metadata = useAppSelector((state) => makeSelectMetadataForUri(uri)(state));

  if (!claim || !metadata) {
    return <span className="empty">{__('Empty claim or metadata info.')}</span>;
  }

  const { license, license_url } = metadata;
  const fileSize =
    metadata.source && metadata.source.size
      ? formatBytes(metadata.source.size)
      : fileInfo && fileInfo.download_path && formatBytes(fileInfo.written_bytes);

  return (
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
  );
});

export default FileDetails;
