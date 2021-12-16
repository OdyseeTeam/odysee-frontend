// @flow
import { SIMPLE_SITE } from 'config';
import React, { PureComponent } from 'react';
import { formatBytes } from 'util/format-bytes';

type Props = {
  claim: StreamClaim,
  fileInfo: FileListItem,
  metadata: StreamMetadata,
  contentType: string,
  user: ?any,
};

class FileDetails extends PureComponent<Props> {
  render() {
    const { claim, contentType, fileInfo, metadata } = this.props;

    if (!claim || !metadata) {
      return <span className="empty">{__('Empty claim or metadata info.')}</span>;
    }

    const { languages, license } = metadata;

    const mediaType = contentType || 'unknown';
    const fileSize =
      metadata.source && metadata.source.size
        ? formatBytes(metadata.source.size)
        : fileInfo && fileInfo.download_path && formatBytes(fileInfo.written_bytes);

    return (
      <>
        <div className="media__details">
          <span>{__('LBRY URL')}</span>
          <span>{claim.canonical_url}</span>
        </div>
        <div className="media__details">
          <span>{__('Claim ID')}</span>
          <span>{claim.claim_id}</span>
        </div>

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
          </>
        )}

        {fileSize && (
          <div className="media__details">
            <span>{fileSize}</span>
          </div>
        )}
      </>
    );
  }
}

export default FileDetails;
