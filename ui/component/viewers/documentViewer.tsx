import React from 'react';
import LoadingScreen from 'component/common/loading-screen';
import { lazyImport } from 'util/lazyImport';
import * as RENDER_MODES from 'constants/file_render_modes';

const MarkdownPreview = lazyImport(
  () =>
    import(
      'component/common/markdown-preview'
      /* webpackChunkName: "markdown-preview" */
    )
);
const CodeViewer = lazyImport(
  () =>
    import(
      'component/viewers/codeViewer'
      /* webpackChunkName: "codeViewer" */
    )
);

type Props = {
  theme: string;
  renderMode: string;
  source: {
    stream: string;
    contentType: string;
  };
};

const DocumentViewer = (props: Props) => {
  const { source, theme, renderMode } = props;
  const { stream, contentType } = source;
  const [content, setContent] = React.useState();
  React.useEffect(() => {
    if (stream) {
      fetch(stream)
        .then((res) => {
          if (res.ok) {
            return res.text();
          }
          return null;
        })
        .then((data) => setContent(data))
        .catch(() => setContent(null));
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
      {content && (
        <React.Suspense fallback={<LoadingScreen transparent />}>
          {getRenderDocument(stream, content, theme, renderMode, contentType)}
        </React.Suspense>
      )}
    </div>
  );
};

export default DocumentViewer;
