// @flow
import * as React from 'react';
import IframeReact from 'component/IframeReact';
import Button from 'component/button';
import Spinner from 'component/spinner';

type Props = {
  source: string,
};

type State = {
  loading: boolean,
  error: ?string,
  pdfDoc: ?any,
  pageNum: number,
  numPages: number,
  scale: number,
};

class PdfViewer extends React.PureComponent<Props, State> {
  canvasRef: { current: null | HTMLCanvasElement };
  containerRef: { current: null | HTMLDivElement };
  pdfjs: ?any;

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      pdfDoc: null,
      pageNum: 1,
      numPages: 0,
      scale: 1.0,
      containerWidth: 0,
      showPageSelector: false,
    };
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();
    this.pdfjs = null;
  }

  componentDidMount() {
    if (window.cordova) {
      this.loadPdfJs();
    }
  }

  componentWillUnmount() {
    if (this.state.pdfDoc) {
      this.state.pdfDoc.destroy();
    }
  }

  loadPdfJs = async () => {
    try {
      const pdfjs = await import('pdfjs-dist');
      const pdfjsLib = pdfjs.default || pdfjs;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      this.pdfjs = pdfjsLib;
      this.loadPdf();
    } catch (error) {
      console.error('Failed to load PDF.js:', error);
      this.setState({ error: __('Failed to load PDF viewer'), loading: false });
    }
  };

  retry = () => {
    this.setState({ loading: true, error: null }, () => {
      this.loadPdfJs();
    });
  };

  loadPdf = async () => {
    const { source } = this.props;

    if (!this.pdfjs) return;

    try {
      const loadingTask = this.pdfjs.getDocument(source);
      const pdf = await loadingTask.promise;

      this.setState(
        {
          pdfDoc: pdf,
          numPages: pdf.numPages,
          loading: false,
        },
        () => {
          this.renderPage(1);
        }
      );
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.setState({ error: __('Failed to load PDF'), loading: false });
    }
  };

  renderPage = async (pageNumber: number, customScale?: number) => {
    const { pdfDoc } = this.state;
    const canvas = this.canvasRef.current;
    const container = this.containerRef.current;

    if (!pdfDoc || !canvas || !container) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);
      const containerWidth = container.clientWidth - 40;

      let scale = customScale;
      if (!scale) {
        const viewport = page.getViewport({ scale: 1.0 });
        scale = containerWidth / viewport.width;
      }

      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      this.setState({ pageNum: pageNumber, scale, containerWidth });
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  nextPage = () => {
    const { pageNum, numPages } = this.state;
    if (pageNum < numPages) {
      this.renderPage(pageNum + 1);
    }
  };

  prevPage = () => {
    const { pageNum } = this.state;
    if (pageNum > 1) {
      this.renderPage(pageNum - 1);
    }
  };

  zoomIn = () => {
    const newScale = this.state.scale + 0.25;
    this.renderPage(this.state.pageNum, newScale);
  };

  zoomOut = () => {
    const newScale = Math.max(0.25, this.state.scale - 0.25);
    this.renderPage(this.state.pageNum, newScale);
  };

  togglePageSelector = () => {
    this.setState({ showPageSelector: !this.state.showPageSelector });
  };

  goToPage = (page: number) => {
    this.renderPage(page);
    this.setState({ showPageSelector: false });
  };

  render() {
    const { source } = this.props;
    const { loading, error, pageNum, numPages, showPageSelector } = this.state;
    const src = IS_WEB ? source : `file://${source}`;

    if (window.cordova) {
      return (
        <div
          className="file-viewer file-viewer--document"
          style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
        >
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spinner />
            </div>
          )}
          {error && (
            <div className="file-viewer__message" style={{ padding: '20px', textAlign: 'center' }}>
              <p>{error}</p>
              <Button button="primary" label={__('Retry')} onClick={this.retry} style={{ marginTop: '10px' }} />
            </div>
          )}
          {!loading && !error && (
            <>
              <div style={{ background: 'var(--color-header-background)', flexShrink: 0 }}>
                <div
                  style={{
                    padding: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Button button="secondary" label="−" onClick={this.zoomOut} disabled={this.state.scale <= 0.5} />
                  <Button button="secondary" label="+" onClick={this.zoomIn} />
                  <span>{Math.round(this.state.scale * 100)}%</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderTop: '1px solid var(--color-border)',
                    position: 'relative',
                  }}
                >
                  <Button
                    button="secondary"
                    label={__('Previous')}
                    onClick={this.prevPage}
                    disabled={pageNum <= 1}
                    style={{ flex: 1, borderRadius: 0, height: '48px' }}
                  />
                  <div style={{ position: 'relative' }}>
                    <span
                      onClick={this.togglePageSelector}
                      style={{
                        padding: '0 20px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'block',
                      }}
                    >
                      {__('Page %page% of %total%', { page: pageNum, total: numPages })}
                    </span>
                    {showPageSelector && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--color-header-background)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          minWidth: '150px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                          <div
                            key={page}
                            onClick={() => this.goToPage(page)}
                            style={{
                              padding: '10px 20px',
                              cursor: 'pointer',
                              background: page === pageNum ? 'var(--color-primary)' : 'transparent',
                              color: page === pageNum ? 'var(--color-primary-alt)' : 'inherit',
                              borderBottom: page < numPages ? '1px solid var(--color-border)' : 'none',
                            }}
                          >
                            {__('Page %page%', { page })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    button="secondary"
                    label={__('Next')}
                    onClick={this.nextPage}
                    disabled={pageNum >= numPages}
                    style={{ flex: 1, borderRadius: 0, height: '48px' }}
                  />
                </div>
              </div>
              <div
                ref={this.containerRef}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  background: 'var(--color-card-background)',
                  WebkitOverflowScrolling: 'touch',
                  minHeight: 'calc(100vw * 1.414)',
                }}
              >
                <div style={{ padding: '20px', paddingBottom: '80vh' }}>
                  <canvas ref={this.canvasRef} style={{ display: 'block', margin: '0 auto' }} />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

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
