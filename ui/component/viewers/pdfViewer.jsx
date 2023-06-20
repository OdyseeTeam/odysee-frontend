// @flow
import * as React from 'react';
import IframeReact from 'component/IframeReact';

type Props = {|
  source: string,
|};

function PdfViewer(props: Props) {
  const { source } = props;
  const src = IS_WEB ? source : `file://${source}`;

  return (
    <div className="file-viewer file-viewer--document">
      <div className="file-viewer file-viewer--iframe">
        <IframeReact title={__('File preview')} src={src} useDirectFetch />
      </div>
    </div>
  );
}

export default PdfViewer;
