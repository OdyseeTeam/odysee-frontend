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

const DocumentViewer = (props: Props) => {
  const { source, theme, renderMode } = props;
  const { stream, contentType } = source;
  const [content, setContent] = React.useState();

  React.useEffect(() => {
    if (stream) {
      https.get(stream, (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            setContent(data);
          });
        } else {
          setContent(null);
        }
      });
    }
  }, [stream]);

  const getRenderDocument = (stream, content, theme, renderMode, contentType) => {
    return renderMode === RENDER_MODES.MARKDOWN ? (
      <MarkdownPreview content={content} isMarkdownPost promptLinks />
    ) : (
      <CodeViewer value={content} contentType={contentType} theme={theme} />
    );
  };

  if (content === undefined) {
    return <LoadingScreen transparent />;
  }

  return (
    <div className="file-viewer file-viewer--document">
      {content === null && <LoadingScreen transparent status={__("Sorry, looks like we can't load the document.")} />}
      {content && getRenderDocument(stream, content, theme, renderMode, contentType)}
    </div>
  );
};

export default DocumentViewer;
