import React from 'react';
import FileDownloadLink from 'component/fileDownloadLink';
import * as RENDER_MODES from 'constants/file_render_modes';
import Card from 'component/common/card';
import { useAppSelector } from 'redux/hooks';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
type Props = {
  uri: string;
};
export default function FileRenderDownload(props: Props) {
  const { uri } = props;
  const renderMode = useAppSelector((state) => makeSelectFileRenderModeForUri(uri)(state));

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
