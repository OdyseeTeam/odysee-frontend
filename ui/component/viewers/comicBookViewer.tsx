import * as React from 'react';
import { Archive } from 'libarchive.js/main.js';
import Button from 'component/button';
import LoadingScreen from 'component/common/loading-screen';
import * as ICONS from 'constants/icons';
// @if TARGET='web'
import useStream from 'effects/use-stream';
// @endif
// @if TARGET='app'
import useFileStream from 'effects/use-stream-file';
// @endif

type Props = {
  source: {
    file: (arg0: string | null | undefined) => any;
    stream: string;
  };
  theme: string;
};

type ComicPage = {
  name: string;
  url: string;
};

type ArchiveFileEntry = {
  file: File | { name?: string; extract: () => Promise<File> } | string;
  path: string;
};

const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const pagePathComparer = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

let workerUrl = 'webworkers/worker-bundle.js';

if (process.env.NODE_ENV !== 'production') {
  workerUrl = `/${workerUrl}`;
}

Archive.init({ workerUrl });

function isImageEntry(entryPath: string) {
  return IMAGE_FILE_PATTERN.test(entryPath);
}

function createArchiveFile(blob: Blob) {
  return new File([blob], 'comic-book', {
    type: blob.type || 'application/octet-stream',
  });
}

function sortPages(a: { path: string }, b: { path: string }) {
  return pagePathComparer.compare(a.path, b.path);
}

function getEntryName(entry: ArchiveFileEntry) {
  if (typeof entry.file === 'string') {
    return `${entry.path}${entry.file}`;
  }

  return `${entry.path}${entry.file.name || ''}`;
}

export default function ComicBookViewer(props: Props) {
  const { source, theme } = props;
  let finalSource;
  // @if TARGET='web'
  finalSource = useStream(source.stream);
  // @endif
  // @if TARGET='app'
  finalSource = useFileStream(source.file);
  // @endif

  const { error, loading, content } = finalSource;
  const [extracting, setExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState(false);
  const [pages, setPages] = React.useState<ComicPage[]>([]);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const viewerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let currentUrls: string[] = [];

    async function extractArchive(blob: Blob) {
      setExtracting(true);
      setExtractError(false);

      try {
        const archive = await Archive.open(createArchiveFile(blob));
        const files = await archive.getFilesArray();

        const extractedPages = await Promise.all(
          files
            .filter((entry: ArchiveFileEntry) => isImageEntry(getEntryName(entry)))
            .toSorted(sortPages)
            .map(async (entry: ArchiveFileEntry) => {
              const path = getEntryName(entry);
              const file = entry.file instanceof File ? entry.file : await entry.file.extract();
              const url = URL.createObjectURL(file);
              currentUrls.push(url);

              return {
                name: path,
                url,
              };
            })
        );

        if (!cancelled) {
          setPages(extractedPages);
          setCurrentPage(0);
          setZoom(1);
          setExtractError(extractedPages.length === 0);
        }
      } catch {
        if (!cancelled) {
          setExtractError(true);
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setExtracting(false);
        }
      }
    }

    if (content) {
      extractArchive(content);
    } else {
      setPages([]);
      setCurrentPage(0);
      setZoom(1);
      setExtractError(false);
    }

    return () => {
      cancelled = true;
      currentUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [content]);

  const ready = pages.length > 0 && !loading && !error && !extracting && !extractError;
  const current = pages[currentPage];
  const errorMessage = __("Sorry, looks like we can't load the archive.");
  const canGoBackward = currentPage > 0;
  const canGoForward = currentPage < pages.length - 1;

  const goBackward = React.useCallback(() => {
    setCurrentPage((page) => Math.max(page - 1, 0));
  }, []);

  const goForward = React.useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, pages.length - 1));
  }, [pages.length]);

  const toggleFullscreen = React.useCallback(() => {
    const element = viewerRef.current;

    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      document.exitFullscreen?.();
    } else {
      element.requestFullscreen?.();
    }
  }, []);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!ready) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBackward();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goForward();
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (event.key === '-') {
        event.preventDefault();
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
      } else if (event.key === '0') {
        event.preventDefault();
        setZoom(1);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBackward, goForward, ready, toggleFullscreen]);

  return (
    <div className="file-render__viewer file-render__viewer--comic" ref={viewerRef}>
      {(loading || extracting) && <LoadingScreen status={__('Loading')} isDocument />}
      {ready && current && (
        <div className={`comic-viewer comic-viewer--${theme === 'dark' ? 'dark' : 'light'}`}>
          <div className="comic-viewer__toolbar">
            <div className="comic-viewer__toolbar-group">
              <Button
                button="alt"
                icon={ICONS.ARROW_LEFT}
                aria-label={__('Previous page')}
                disabled={!canGoBackward}
                onClick={goBackward}
              />
              <Button
                button="alt"
                icon={ICONS.ARROW_RIGHT}
                aria-label={__('Next page')}
                disabled={!canGoForward}
                onClick={goForward}
              />
              <span className="comic-viewer__status">
                {__('Page %page% of %pages%', {
                  page: currentPage + 1,
                  pages: pages.length,
                })}
              </span>
            </div>

            <div className="comic-viewer__toolbar-group">
              <Button button="alt" label={__('Reset')} onClick={() => setZoom(1)} />
              <Button
                button="alt"
                icon={ICONS.REMOVE}
                aria-label={__('Zoom out')}
                onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
              />
              <span className="comic-viewer__zoom">{`${Math.round(zoom * 100)}%`}</span>
              <Button
                button="alt"
                icon={ICONS.ADD}
                aria-label={__('Zoom in')}
                onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
              />
              <Button
                button="alt"
                icon={ICONS.EXPAND}
                aria-label={__('Toggle fullscreen')}
                onClick={toggleFullscreen}
              />
            </div>
          </div>

          <div className="comic-viewer__stage">
            <img
              alt={current.name}
              className="comic-viewer__image"
              src={current.url}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            />
          </div>
        </div>
      )}
      {(error || extractError) && <LoadingScreen status={errorMessage} spinner={false} />}
    </div>
  );
}
