// @flow

import React from 'react';
import LoadingScreen from 'component/common/loading-screen';
import MarkdownPreview from 'component/common/markdown-preview';
import CodeViewer from 'component/viewers/codeViewer';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as https from 'https';

type Props = {
  theme: string,
  renderMode: string,
  source: {
    stream: string,
    contentType: string,
  },
};

type State = {
  content: ?string,
};

class DocumentViewer extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      content: undefined,
    };
  }

  componentDidMount() {
    const { source } = this.props;

    if (source && source.stream) {
      https.get(source.stream, (response) => {
        if (response.statusCode === 200) {
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => {
            this.setState({ content: data });
          });
        } else {
          this.setState({ content: null });
        }
      });
    }
  }

  renderDocument() {
    const { content } = this.state;
    const { source, theme, renderMode } = this.props;
    const { contentType } = source;

    return renderMode === RENDER_MODES.MARKDOWN ? (
      <MarkdownPreview content={content} isMarkdownPost promptLinks />
    ) : (
      <CodeViewer value={content} contentType={contentType} theme={theme} />
    );
  }

  render() {
    const { content } = this.state;

    if (content === undefined) {
      return <LoadingScreen transparent />;
    }

    return (
      <div className="file-viewer file-viewer--document">
        {content === null && <LoadingScreen transparent status={__("Sorry, looks like we can't load the document.")} />}
        {content && this.renderDocument()}
      </div>
    );
  }
}

export default DocumentViewer;
