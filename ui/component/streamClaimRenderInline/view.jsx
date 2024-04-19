// @flow
import { remote } from 'electron';
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import classnames from 'classnames';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as KEYCODES from 'constants/keycodes';
import { webDownloadClaim } from 'util/downloadClaim';

// import fs from 'fs';
import analytics from 'analytics';

import DocumentViewer from 'component/viewers/documentViewer';

// @if TARGET='app'
// should match
import DocxViewer from 'component/viewers/docxViewer';
// import ComicBookViewer from 'component/viewers/comicBookViewer';
// import ThreeViewer from 'component/viewers/threeViewer';
// @endif

// const AppViewer = lazyImport(() => import('component/viewers/appViewer' /* webpackChunkName: "appViewer" */));
const HtmlViewer = lazyImport(() => import('component/viewers/htmlViewer' /* webpackChunkName: "htmlViewer" */));
const ImageViewer = lazyImport(() => import('component/viewers/imageViewer' /* webpackChunkName: "imageViewer" */));
const PdfViewer = lazyImport(() => import('component/viewers/pdfViewer' /* webpackChunkName: "pdfViewer" */));

type Props = {
  uri: string,
  streamingUrl: string,
  embedded?: boolean,
  contentType: string,
  claim: StreamClaim,
  currentTheme: string,
  downloadPath: string,
  fileExtension: string,
  autoplay: boolean,
  renderMode: string,
  thumbnail: string,
  className?: string,
  doAnalyticsViewForUri: (string) => any,
  claimRewards: () => void,
};

type State = {
  prevUri?: string,
};

class StreamClaimRenderInline extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    (this: any).escapeListener = this.escapeListener.bind(this);
    this.state = { prevUri: undefined };
  }

  componentDidMount() {
    const { renderMode, embedded, doAnalyticsViewForUri, uri, claimRewards, streamingUrl } = this.props;
    analytics.event.playerLoaded(renderMode, embedded);

    if (uri && streamingUrl) {
      this.setState({ prevUri: uri });
      doAnalyticsViewForUri(uri).then(claimRewards);
    }
    // @if TARGET='app'
    window.addEventListener('keydown', this.escapeListener, true);
    // @endif
  }

  componentWillUnmount() {
    // @if TARGET='app'
    window.removeEventListener('keydown', this.escapeListener, true);
    // @endif
  }

  componentDidUpdate() {
    const { doAnalyticsViewForUri, uri, claimRewards, streamingUrl } = this.props;
    if (uri && streamingUrl && uri !== this.state.prevUri) {
      this.setState({ prevUri: uri });
      doAnalyticsViewForUri(uri).then(claimRewards);
    }
  }

  escapeListener(e: SyntheticKeyboardEvent<*>) {
    if (e.keyCode === KEYCODES.ESCAPE) {
      e.preventDefault();
      this.exitFullscreen();
      return false;
    }
  }

  exitFullscreen() {
    remote.getCurrentWindow().setFullScreen(false);
  }

  renderViewer() {
    const { currentTheme, contentType, downloadPath, streamingUrl, uri, renderMode, thumbnail } = this.props;
    const source = streamingUrl;

    switch (renderMode) {
      case RENDER_MODES.IMAGE:
        return (
          <React.Suspense fallback={null}>
            <ImageViewer uri={uri} source={source} />
          </React.Suspense>
        );
      case RENDER_MODES.HTML:
        return (
          <React.Suspense fallback={null}>
            <HtmlViewer source={downloadPath || source} />
          </React.Suspense>
        );
      case RENDER_MODES.DOCUMENT:
      case RENDER_MODES.MARKDOWN:
        return <DocumentViewer source={{ stream: source, contentType }} renderMode={renderMode} theme={currentTheme} />;
      case RENDER_MODES.DOCX:
        return <DocxViewer source={downloadPath} />;
      case RENDER_MODES.PDF:
        return (
          <React.Suspense fallback={null}>
            <PdfViewer source={downloadPath || source} />
          </React.Suspense>
        );
      case RENDER_MODES.CAD:
        return (
          <React.Suspense fallback={null}>
            <ImageViewer
              uri={uri}
              source={thumbnail}
              onClick={() => {
                webDownloadClaim(streamingUrl, 'file', false);
              }}
            />
          </React.Suspense>
          /*
          <ThreeViewer
            source={{
              fileType: fileExtension,
              downloadPath,
            }}
            theme={currentTheme}
          />
          */
        );
      case RENDER_MODES.COMIC:
        return (
          <React.Suspense fallback={null}>
            <ImageViewer
              uri={uri}
              source={thumbnail}
              onClick={() => {
                webDownloadClaim(streamingUrl, 'file', false);
              }}
            />
          </React.Suspense>
          /*
          <ComicBookViewer
            source={{
              // @if TARGET='app'
              file: (options) => fs.createReadStream(downloadPath, options),
              // @endif
              stream: source,
            }}
            theme={currentTheme}
          />
        */
        );
      case RENDER_MODES.APPLICATION:
        return (
          <React.Suspense fallback={null}>
            <ImageViewer
              uri={uri}
              source={thumbnail}
              onClick={() => {
                webDownloadClaim(streamingUrl, 'file', false);
              }}
            />
          </React.Suspense>
          /*
          <React.Suspense fallback={null}>
            <AppViewer uri={uri} />
          </React.Suspense>
          */
        );
      case RENDER_MODES.DOWNLOAD:
        return (
          <React.Suspense fallback={null}>
            <ImageViewer
              uri={uri}
              source={thumbnail}
              onClick={() => {
                webDownloadClaim(streamingUrl, 'file', false);
              }}
            />
          </React.Suspense>
          /*
          <React.Suspense fallback={null}>
            <AppViewer uri={uri} />
          </React.Suspense>
          */
        );
    }

    return null;
  }

  render() {
    const { embedded, renderMode, className } = this.props;

    return (
      <div
        className={classnames('file-render', className, {
          'file-render--document': RENDER_MODES.TEXT_MODES.includes(renderMode) && !embedded,
          'file-render--embed': embedded,
        })}
      >
        {this.renderViewer()}
      </div>
    );
  }
}

export default StreamClaimRenderInline;
