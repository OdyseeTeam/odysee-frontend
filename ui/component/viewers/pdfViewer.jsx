// @flow
import * as React from 'react';
import IframeReact from 'component/IframeReact';

type Props = {
  source: string,
};

class PdfViewer extends React.PureComponent<Props> {
  render() {
    const { source } = this.props;
    const src = source;
    return (
      <div className="file-viewer file-viewer--document">
        <div className="file-viewer file-viewer--iframe">
          <IframeReact title={__('File preview')} src={src} />
        </div>
      </div>
    );
  }
}

export default PdfViewer;
