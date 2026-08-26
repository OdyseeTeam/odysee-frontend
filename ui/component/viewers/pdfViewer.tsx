import React from 'react';
import IframeReact from 'component/IframeReact';
type Props = {
  source: string;
};

function PdfViewer({ source }: Props) {
  return (
    <div className="file-viewer file-viewer--document">
      <div className="file-viewer file-viewer--iframe">
        <IframeReact title={__('File preview')} src={source} />
      </div>
    </div>
  );
}

export default PdfViewer;
