// @flow
import * as React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Page from 'component/page';
import Card from 'component/common/card';
import Spinner from 'component/spinner';
import classnames from 'classnames';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from 'constants/player';
import ClaimListDiscover from 'component/claimListDiscover';
import { useIsMobile, useIsSmallScreen } from 'effects/use-screensize';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import Empty from 'component/common/empty';
import CommentsForWoo from './comments';
import { formatLbryUrlForWeb } from 'util/url';
import './style.scss';

type OEmbed = {
  title: string,
  author_name: string,
  author_url: string,
  html: string,
  provider_name: string,
  thumbnail_url?: string,
};

export default function WooPage(): React.Node {
  const { ytId } = useParams();
  const history = useHistory();
  const [data, setData] = React.useState<?OEmbed>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<?string>(null);
  const [shouldLoadEmbed, setShouldLoadEmbed] = React.useState<boolean>(false);

  // 1) Try to resolve the YouTube ID to an existing Odysee claim; redirect if found.
  React.useEffect(() => {
    let cancelled = false;
    setShouldLoadEmbed(false);
    const controller = new AbortController();

    const url = `https://api.odysee.com/yt/resolve?video_ids=${encodeURIComponent(ytId)}`;
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const resolved = json && json.data && json.data.videos && json.data.videos[ytId];
        if (resolved) {
          const lbryUri = `lbry://${resolved}`;
          const webPath = formatLbryUrlForWeb(lbryUri);
          history.replace(webPath);
        } else {
          setShouldLoadEmbed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setShouldLoadEmbed(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [ytId, history]);

  React.useEffect(() => {
    if (!shouldLoadEmbed) return;
    setLoading(true);
    setError(null);
    setData(null);

    const controller = new AbortController();
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
      ytId
    )}&format=json`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch oEmbed (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        try {
          document.title = `${json.title} - Watch On Odysee`;
        } catch (e) {}
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [ytId, shouldLoadEmbed]);

  const { escapeHtmlProperty } = require('util/web');

  // Adjust the oEmbed HTML to be responsive and 16:9 like the standard player
  const responsiveEmbedHtml = React.useMemo(() => {
    if (!data?.html) return null;
    // Remove width/height attributes and force responsive style.
    const noSize = data.html
      .replace(/\swidth="\d+"/i, '')
      .replace(/\sheight="\d+"/i, '')
      .replace('<iframe', '<iframe style="width:100%; aspect-ratio: 16 / 9; border:0;"');
    return noSize;
  }, [data]);

  const isMobile = useIsMobile();
  const isSmallScreen = useIsSmallScreen() && !isMobile;

  return (
    <Page className="file-page" filePage>
      <div className={classnames('section card-stack', 'file-page__video')}>
        {loading && (
          <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
            <Spinner delayed />
          </div>
        )}

        {error && (
          <Card
            title={__('Unable to load video')}
            body={<div className="help">{__(`Error: %err%`, { err: error })}</div>}
          />
        )}

        {data && (
          <>
            <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
              {/* Responsive 16:9 iframe */}
              <div className="file-render file-render--video">
                <div dangerouslySetInnerHTML={{ __html: responsiveEmbedHtml }} />
              </div>
            </div>

            <div className="file-page__secondary-content">
              <section className="file-page__media-actions">
                <Card
                  isPageTitle
                  noTitleWrap
                  title={escapeHtmlProperty(data.title)}
                  body={
                    <div className="media__subtitle--between">
                      <div className="file__viewdate">
                        <Icon icon={ICONS.YOUTUBE} size={16} />
                        <span className="media__subtitle--centered" style={{ marginLeft: '0.5rem' }}>
                          {__('YouTube')} •{' '}
                          <a href={data.author_url} target="_blank" rel="noreferrer noopener">
                            {data.author_name}
                          </a>
                        </span>
                      </div>
                    </div>
                  }
                  actions={
                    <div className="media__info-text--contracted media__info-text--fade">
                      <div className="mediaInfo__description">
                        <div className="notranslate markdown-preview markdown-preview--description">
                          <p>
                            {__(
                              "This creator is not on Odysee (yet!). Please let them know you'd like to watch their videos on Odysee instead."
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                />

                {/* Comments placeholder (external content has no Odysee claim) */}
                <CommentsForWoo claimId={ytId} uri={`/woo/${ytId}`} />
              </section>
            </div>
          </>
        )}
      </div>

      {/* Right-side content: reuse player sidebar styling via file-page__recommended */}
      <div className="card-stack--spacing-m">
        <Card className="file-page__recommended woo__recommended" isBodyList smallTitle={!isMobile && !isSmallScreen}>
          <ClaimListDiscover
            type="small"
            tileLayout={false}
            showHeader={false}
            hideAdvancedFilter
            hideFilters
            hasSource
            claimType={['stream']}
            orderBy="trending"
            pageSize={10}
            infiniteScroll={false}
            maxClaimRender={10}
            csOptionsHook={(o) => ({ ...o, page_size: 10, page: 1 })}
          />
        </Card>
      </div>
    </Page>
  );
}
