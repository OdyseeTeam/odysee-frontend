// @flow
import * as React from 'react';
import Button from 'component/button';
import Spinner from 'component/spinner';
import Yrbl from 'component/yrbl';
import {
  ensureYouTubeInnertubeConfig,
  getStoredYouTubeInnertubeConfig,
  searchYouTubeInnertube,
} from 'util/youtubeInnertube';
import type { YouTubeSearchResultItem } from 'util/youtubeInnertube';

type Props = {
  query: string,
};

export default function YouTubeSearchResults(props: Props) {
  const { query } = props;
  const [items, setItems] = React.useState<Array<YouTubeSearchResultItem>>([]);
  const [continuationToken, setContinuationToken] = React.useState<?string>(null);
  const [estimatedResults, setEstimatedResults] = React.useState<?string>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<?string>(null);

  const trimmedQuery = query.trim();

  const loadResults = React.useCallback(
    async (append: boolean, nextContinuationToken?: ?string) => {
      if (!trimmedQuery) {
        setItems([]);
        setContinuationToken(null);
        setEstimatedResults(null);
        setError(null);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const config = await ensureYouTubeInnertubeConfig();
        const storedConfig = getStoredYouTubeInnertubeConfig();
        const page = await searchYouTubeInnertube({
          query: trimmedQuery,
          ...(nextContinuationToken ? { continuationToken: nextContinuationToken } : {}),
          config: storedConfig.apiKey ? storedConfig : config,
          timeoutMs: 12000,
        });

        setItems((prev) => {
          const nextItems = append ? prev.concat(page.items) : page.items;
          const deduped: Array<YouTubeSearchResultItem> = [];
          const seen = new Set();

          nextItems.forEach((item) => {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              deduped.push(item);
            }
          });

          return deduped;
        });
        setContinuationToken(page.continuationToken || null);
        setEstimatedResults(page.estimatedResults || null);
      } catch (err) {
        setError(err && err.message ? err.message : String(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [trimmedQuery]
  );

  React.useEffect(() => {
    loadResults(false);
  }, [loadResults]);

  if (!trimmedQuery) {
    return (
      <div className="main--empty">
        <Yrbl subtitle={__('Enter a search query to look up YouTube results.')} alwaysShow />
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="main--empty">
        <Yrbl type="sad" subtitle={error} alwaysShow />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="main--empty">
        <Yrbl type="sad" subtitle={__('No YouTube results found.')} alwaysShow />
      </div>
    );
  }

  return (
    <section className="youtube-search-results">
      <div className="youtube-search-results__header">
        <div>
          <h2 className="youtube-search-results__title">{__('YouTube Results')}</h2>
          <div className="youtube-search-results__subtitle">
            {estimatedResults
              ? __('Approx. %count% results from YouTube', { count: estimatedResults })
              : __('Results fetched via the shared YouTube proxy')}
          </div>
        </div>
      </div>

      <div className="youtube-search-results__list">
        {items.map((item) => (
          <article key={item.id} className="youtube-search-results__item">
            <div className="youtube-search-results__media">
              {item.thumbnailUrl ? (
                <img alt="" className="youtube-search-results__thumb" src={item.thumbnailUrl} />
              ) : (
                <div className="youtube-search-results__thumb youtube-search-results__thumb--empty" />
              )}
            </div>

            <div className="youtube-search-results__body">
              <div className="youtube-search-results__meta-row">
                <span className="youtube-search-results__type">{item.type}</span>
                {item.durationText && <span>{item.durationText}</span>}
                {item.viewsText && <span>{item.viewsText}</span>}
                {item.publishedText && <span>{item.publishedText}</span>}
                {item.isLive && <span>{__('LIVE')}</span>}
                {item.isShort && <span>{__('SHORT')}</span>}
              </div>

              <div className="youtube-search-results__item-title">{item.title}</div>

              {(item.channelName || item.channelUrl) && (
                <div className="youtube-search-results__channel">
                  {item.channelUrl ? (
                    <Button button="link" href={item.channelUrl} label={item.channelName || __('Open channel')} />
                  ) : (
                    item.channelName
                  )}
                </div>
              )}

              <div className="youtube-search-results__actions">
                {item.videoId ? (
                  <Button button="secondary" navigate={`/$/${item.videoId}`} label={__('Watch on Odysee')} />
                ) : null}
                <Button button="link" href={item.url} label={__('Open on YouTube')} />
              </div>
            </div>
          </article>
        ))}
      </div>

      {(continuationToken || loadingMore || error) && (
        <div className="youtube-search-results__footer">
          {error && items.length > 0 && <div className="help">{error}</div>}
          {continuationToken && (
            <Button
              button="secondary"
              label={loadingMore ? __('Loading...') : __('Load More')}
              onClick={() => loadResults(true, continuationToken)}
              disabled={loadingMore}
            />
          )}
        </div>
      )}
    </section>
  );
}
