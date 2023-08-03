// @flow
import React from 'react';
import FileDownloadLink from 'component/fileDownloadLink';
import * as RENDER_MODES from 'constants/file_render_modes';
import Card from 'component/common/card';

type Props = {
  uri: string,
  renderMode: string,
};

export default function FileRenderDownload(props: Props) {
  const { uri, renderMode } = props;

  // @if TARGET='web'
  if (RENDER_MODES.UNSUPPORTED_IN_THIS_APP.includes(renderMode)) {
    return (
      <Card
        title={__('Download')}
        subtitle={<p>{__("This file type can't be viewed on Odysee.")}</p>}
        actions={
          <div className="section__actions">
            <FileDownloadLink uri={uri} buttonType="primary" showLabel />
          </div>
        }
      />
    );
  }
  // @endif

  return <Card title={__('Download')} actions={<FileDownloadLink uri={uri} buttonType="primary" showLabel />} />;
}
