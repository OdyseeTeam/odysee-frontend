import { remote } from 'electron';
import React from 'react';
import { lazyImport } from 'util/lazyImport';
import classnames from 'classnames';
import * as RENDER_MODES from 'constants/file_render_modes';
import * as KEYCODES from 'constants/keycodes';
import * as SETTINGS from 'constants/settings';
import { webDownloadClaim } from 'util/downloadClaim';
import analytics from 'analytics';
import DocumentViewer from 'component/viewers/documentViewer';
// @if TARGET='app'
// should match
import DocxViewer from 'component/viewers/docxViewer';
// import ComicBookViewer from 'component/viewers/comicBookViewer';
// import ThreeViewer from 'component/viewers/threeViewer';
// @endif
// const AppViewer = lazyImport(() => import('component/viewers/appViewer' /* webpackChunkName: "appViewer" */));
const HtmlViewer = lazyImport(
  () =>
    import(
      'component/viewers/htmlViewer'
      /* webpackChunkName: "htmlViewer" */
    )
);
const ImageViewer = lazyImport(
  () =>
    import(
      'component/viewers/imageViewer'
      /* webpackChunkName: "imageViewer" */
    )
);
const PdfViewer = lazyImport(
  () =>
    import(
      'component/viewers/pdfViewer'
      /* webpackChunkName: "pdfViewer" */
    )
);
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { makeSelectDownloadPathForUri, selectStreamingUrlForUri } from 'redux/selectors/file_info';
import {
  makeSelectClaimForUri,
  selectThumbnailForUri,
  makeSelectContentTypeForUri,
  makeSelectFileExtensionForUri,
} from 'redux/selectors/claims';
import { selectClientSetting, selectTheme } from 'redux/selectors/settings';
import { makeSelectFileRenderModeForUri } from 'redux/selectors/content';
import { doAnalyticsViewForUri } from 'redux/actions/app';
import { doClaimEligiblePurchaseRewards } from 'redux/actions/rewards';
import withStreamClaimRender from 'hocs/withStreamClaimRender';

type Props = {
  uri: string;
  embedded?: boolean;
  className?: string;
};

function StreamClaimRenderInline(props: Props) {
  const { uri, embedded, className } = props;
  const dispatch = useAppDispatch();

  const autoplay = useAppSelector((state) => (embedded ? false : selectClientSetting(state, SETTINGS.AUTOPLAY_MEDIA)));
  const currentTheme = useAppSelector(selectTheme);
  const claim = useAppSelector((state) => makeSelectClaimForUri(uri)(state));
  const thumbnail = useAppSelector((state) => selectThumbnailForUri(state, uri));
  const contentType = useAppSelector((state) => makeSelectContentTypeForUri(uri)(state));
  const downloadPath = useAppSelector((state) => makeSelectDownloadPathForUri(uri)(state));
  const fileExtension = useAppSelector((state) => makeSelectFileExtensionForUri(uri)(state));
  const streamingUrl = useAppSelector((state) => selectStreamingUrlForUri(state, uri));
  const renderMode = useAppSelector((state) => makeSelectFileRenderModeForUri(uri)(state));

  const prevUriRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    analytics.event.playerLoaded(renderMode, embedded);

    if (uri && streamingUrl) {
      prevUriRef.current = uri;
      dispatch(doAnalyticsViewForUri(uri)).then(() => dispatch(doClaimEligiblePurchaseRewards()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (uri && streamingUrl && uri !== prevUriRef.current) {
      prevUriRef.current = uri;
      dispatch(doAnalyticsViewForUri(uri)).then(() => dispatch(doClaimEligiblePurchaseRewards()));
    }
  }, [uri, streamingUrl, dispatch]);

  // @if TARGET='app'
  React.useEffect(() => {
    const escapeListener = (e: KeyboardEvent) => {
      if (e.keyCode === KEYCODES.ESCAPE) {
        e.preventDefault();
        remote.getCurrentWindow().setFullScreen(false);
        return false;
      }
    };

    window.addEventListener('keydown', escapeListener, true);
    return () => {
      window.removeEventListener('keydown', escapeListener, true);
    };
  }, []);
  // @endif

  function renderViewer() {
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
        return (
          <DocumentViewer
            source={{
              stream: source,
              contentType,
            }}
            renderMode={renderMode}
            theme={currentTheme}
          />
        );

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
              title={__('Download')}
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
              title={__('Download')}
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
              title={__('Download')}
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
              title={__('Download')}
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

  return (
    <div
      className={classnames('file-render', className, {
        'file-render--document': RENDER_MODES.TEXT_MODES.includes(renderMode) && !embedded,
        'file-render--embed': embedded,
      })}
    >
      {renderViewer()}
    </div>
  );
}

export default withStreamClaimRender(StreamClaimRenderInline);
