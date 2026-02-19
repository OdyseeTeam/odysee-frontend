// @flow
import { PRIMARY_IMAGE_WRAPPER_CLASS, PRIMARY_PLAYER_WRAPPER_CLASS } from 'constants/player';
import * as React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import * as DRAWERS from 'constants/drawer_types';
import * as RENDER_MODES from 'constants/file_render_modes';
import FileTitleSection from 'component/fileTitleSection';
import StreamClaimRenderInline from 'component/streamClaimRenderInline';
import FileRenderDownload from 'component/fileRenderDownload';
import RecommendedContent from 'component/recommendedContent';
import FileViewCount from 'component/fileViewCount';
import FileReactions from 'component/fileReactions';
import FileActionButton from 'component/common/file-action-button';
import Empty from 'component/common/empty';
import Card from 'component/common/card';
import Icon from 'component/common/icon';
import Spinner from 'component/spinner';
import SwipeableDrawer from 'component/swipeableDrawer';
import DrawerExpandButton from 'component/swipeableDrawerExpand';
import { useIsMobile, useIsMobileLandscape } from 'effects/use-screensize';
import { LivestreamContext } from 'contexts/livestream';
import { useHistory } from 'react-router';
import { Lbryio } from 'lbryinc';
import { buildWooUriFromYtId, buildWooWebPathFromYtId, isWooClaimId } from 'util/woo';
import type { WooContentType } from 'util/woo';
import 'web/page/woo/style.scss';

const CommentsList = lazyImport(() => import('component/commentsList' /* webpackChunkName: "comments" */));
const LivestreamChat = lazyImport(() => import('component/chat' /* webpackChunkName: "chat" */));
const MarkdownPostPage = lazyImport(() => import('./internal/markdownPost' /* webpackChunkName: "markdownPost" */));
const VideoPlayersPage = lazyImport(() => import('./internal/videoPlayers' /* webpackChunkName: "videoPlayersPage" */));
const LivestreamPage = lazyImport(() => import('./internal/livestream' /* webpackChunkName: "livestream" */));
const ShortsPage = lazyImport(() => import('./internal/shorts'));
const { escapeHtmlProperty } = require('util/web');

type WooOEmbed = {
  title: string,
  author_name: string,
  author_url: string,
  html: string,
  provider_name: string,
  thumbnail_url?: string,
};

type Props = {
  uri: string,
  // -- redux --
  commentsListTitle: string,
  costInfo: ?{ includesData: boolean, cost: number },
  thumbnail: ?string,
  isMature: boolean,
  linkedCommentId?: string,
  renderMode: string,
  commentsDisabled: ?boolean,
  threadCommentId?: string,
  isProtectedContent?: boolean,
  contentUnlocked: boolean,
  isLivestream: boolean,
  isClaimBlackListed: boolean,
  isClaimFiltered: boolean,
  isClaimShort: boolean,
  disableShortsView: boolean,
  isWooContent?: boolean,
  wooYtId?: ?string,
  wooClaimId?: ?string,
  wooType?: ?WooContentType,
  wooTimestamp?: ?number,
  wooData?: ?WooOEmbed,
  wooLoading?: boolean,
  wooError?: ?string,
  autoplayMedia?: boolean,
  videoTheaterMode?: boolean,
  doSetContentHistoryItem: (uri: string) => void,
  doSetPrimaryUri: (uri: ?string) => void,
  doToggleAppDrawer: (type: string) => void,
  doCommentSocketConnect: (uri: string, channelName: string, claimId: string, subCategory?: ?string) => void,
  doCommentSocketDisconnect: (claimId: string, channelName: string, subCategory?: ?string) => void,
};

const StreamClaimPage = (props: Props) => {
  const {
    uri,
    // -- redux --
    commentsListTitle,
    costInfo,
    thumbnail,
    isMature,
    linkedCommentId,
    renderMode,
    commentsDisabled,
    threadCommentId,
    isProtectedContent,
    contentUnlocked,
    isLivestream,
    isClaimBlackListed,
    isClaimFiltered,
    isClaimShort,
    disableShortsView,
    isWooContent,
    wooYtId,
    wooClaimId,
    wooType,
    wooTimestamp,
    wooData,
    wooLoading,
    wooError,
    autoplayMedia,
    videoTheaterMode,
    doSetContentHistoryItem,
    doSetPrimaryUri,
    doToggleAppDrawer,
    doCommentSocketConnect,
    doCommentSocketDisconnect,
  } = props;

  const isMobile = useIsMobile();
  const isLandscapeRotated = useIsMobileLandscape();
  const history = useHistory();

  const isHidden = isClaimFiltered || isClaimBlackListed;

  const cost = costInfo ? costInfo.cost : null;
  const isMarkdown = renderMode === RENDER_MODES.MARKDOWN;
  const accessStatus = !isProtectedContent ? undefined : contentUnlocked ? 'unlocked' : 'locked';

  const { search } = history.location;
  const urlParams = new URLSearchParams(search);
  const shortsView = urlParams.get('view') === 'shorts';
  const isShortVideo = isClaimShort && !disableShortsView;
  const emptyMsgProps = { padded: !isMobile };
  const effectiveCommentsTitle = commentsListTitle || __('Comments');
  const effectiveWooClaimId = React.useMemo(() => (isWooClaimId(wooClaimId) ? wooClaimId : undefined), [wooClaimId]);
  const isWooLive = isWooContent && wooType === 'live';
  const isWooShort = isWooContent && wooType === 'short';
  const showWooRecommended = !isWooShort && !isWooLive;
  const livestreamChatEnabled = Boolean(isWooLive && effectiveWooClaimId);
  const showWooLivestreamChat = livestreamChatEnabled && (!isMobile || isLandscapeRotated) && !videoTheaterMode;
  const showWooLivestreamChatInTheater =
    livestreamChatEnabled && (!isMobile || isLandscapeRotated) && Boolean(videoTheaterMode);
  const showWooLivestreamDrawer = livestreamChatEnabled && isMobile && !isLandscapeRotated;
  const wooLiveChannelName = React.useMemo(() => {
    const authorName = wooData && wooData.author_name ? wooData.author_name.trim() : '';
    return authorName || 'YouTube';
  }, [wooData]);

  const responsiveEmbedHtml = React.useMemo(() => {
    if (!wooData || !wooData.html) return null;

    const autoplayValue = autoplayMedia ? '1' : '0';
    const embedAspectRatio = isWooShort ? '9 / 16' : '16 / 9';
    const wooEmbedHtml = wooData.html;
    const setParamFallback = (source, name, value) => {
      const paramPattern = new RegExp(`([?&])${name}=[^&]*`, 'i');

      if (paramPattern.test(source)) {
        return source.replace(paramPattern, `$1${name}=${value}`);
      }

      return `${source}${source.includes('?') ? '&' : '?'}${name}=${value}`;
    };

    const htmlWithAutoplay = wooEmbedHtml.replace(/src="([^"]+)"/i, (full, src) => {
      let updatedSrc = src;

      try {
        const isProtocolRelative = src.startsWith('//');
        const normalizedSrc = isProtocolRelative ? `https:${src}` : src;
        const url = new URL(normalizedSrc);
        url.searchParams.set('autoplay', autoplayValue);
        if (wooTimestamp !== null && wooTimestamp !== undefined) {
          url.searchParams.set('start', String(wooTimestamp));
        }
        if (isWooLive) {
          url.searchParams.set('live_stream', '1');
        }
        updatedSrc = url.toString();

        if (isProtocolRelative) {
          updatedSrc = updatedSrc.replace(/^https:/, '');
        }
      } catch {
        updatedSrc = setParamFallback(src, 'autoplay', autoplayValue);

        if (wooTimestamp !== null && wooTimestamp !== undefined) {
          updatedSrc = setParamFallback(updatedSrc, 'start', String(wooTimestamp));
        }
        if (isWooLive) {
          updatedSrc = setParamFallback(updatedSrc, 'live_stream', '1');
        }
      }

      return `src="${updatedSrc}"`;
    });

    return htmlWithAutoplay
      .replace(/\swidth="\d+"/i, '')
      .replace(/\sheight="\d+"/i, '')
      .replace('<iframe', `<iframe style="width:100%; aspect-ratio: ${embedAspectRatio}; border:0;"`);
  }, [autoplayMedia, isWooLive, isWooShort, wooData, wooTimestamp]);

  const [wooShareCopied, setWooShareCopied] = React.useState(false);
  const wooShareUrl = React.useMemo(() => {
    const wooPath = wooYtId ? buildWooWebPathFromYtId(wooYtId) : '';
    const query = new URLSearchParams();
    if (wooTimestamp !== null && wooTimestamp !== undefined) {
      query.set('t', String(wooTimestamp));
    }
    if (wooType) {
      query.set('type', wooType);
    }
    const queryStr = query.toString();
    const wooPathWithQuery = queryStr ? `${wooPath}?${queryStr}` : wooPath;

    if (typeof window === 'undefined') {
      return wooPathWithQuery;
    }

    return wooPathWithQuery ? `${window.location.origin}${wooPathWithQuery}` : window.location.href;
  }, [wooTimestamp, wooType, wooYtId]);
  const wooYoutubeUrl = React.useMemo(() => {
    if (wooYtId) {
      const url = new URL('https://www.youtube.com/watch');
      url.searchParams.set('v', wooYtId);
      if (wooTimestamp !== null && wooTimestamp !== undefined) {
        url.searchParams.set('t', String(wooTimestamp));
      }

      return url.toString();
    }

    return 'https://www.youtube.com';
  }, [wooTimestamp, wooYtId]);

  const handleWooShare = React.useCallback(() => {
    if (!wooShareUrl) return;

    const shareTitle = wooData?.title || __('Watch on Odysee');

    if (navigator.share) {
      navigator
        .share({
          title: shareTitle,
          url: wooShareUrl,
        })
        .catch(() => {});
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(wooShareUrl)
        .then(() => {
          setWooShareCopied(true);
          window.setTimeout(() => setWooShareCopied(false), 1500);
        })
        .catch(() => {
          window.prompt(__('Copy this link'), wooShareUrl);
        });
      return;
    }

    window.prompt(__('Copy this link'), wooShareUrl);
  }, [wooData, wooShareUrl]);

  React.useEffect(() => {
    const wooTitle = wooData && wooData.title;
    if (isWooContent && wooTitle) {
      document.title = `${wooTitle} - Watch On Odysee`;
    }
  }, [isWooContent, wooData]);

  React.useEffect(() => {
    const wooAuthorUrl = wooData && wooData.author_url;
    if (isWooContent && wooAuthorUrl) {
      // eslint-disable-next-line no-console
      console.log('[WOO] author_url:', wooAuthorUrl);
    }
  }, [isWooContent, wooData]);

  const lastWooViewedIdRef = React.useRef<?string>(null);
  React.useEffect(() => {
    if (!isWooContent || !effectiveWooClaimId || lastWooViewedIdRef.current === effectiveWooClaimId) return;

    lastWooViewedIdRef.current = effectiveWooClaimId;

    const params: { claim_id: string, uri?: string } = { claim_id: effectiveWooClaimId };
    if (wooYtId) {
      params.uri = buildWooUriFromYtId(wooYtId);
    }

    Lbryio.call('file', 'view', params).catch(() => {});
  }, [effectiveWooClaimId, isWooContent, wooYtId]);

  React.useEffect(() => {
    if (!isWooLive || !effectiveWooClaimId || !wooLiveChannelName) return;

    doCommentSocketConnect(uri, wooLiveChannelName, effectiveWooClaimId);

    return () => {
      doCommentSocketDisconnect(effectiveWooClaimId, wooLiveChannelName);
    };
  }, [doCommentSocketConnect, doCommentSocketDisconnect, effectiveWooClaimId, isWooLive, uri, wooLiveChannelName]);

  React.useEffect(() => {
    if ((linkedCommentId || threadCommentId) && isMobile) {
      doToggleAppDrawer(DRAWERS.CHAT);
    }
    // only on mount, otherwise clicking on a comments timestamp and linking it
    // would trigger the drawer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isClaimShort && shortsView) {
      const urlParams = new URLSearchParams(search);
      urlParams.delete('view');
      const newSearch = urlParams.toString();
      const { pathname } = window.location;
      const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      window.location.reload();
    }
  }, [isClaimShort, shortsView, search]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(search);
    if (isShortVideo && shortsView) {
      urlParams.set('view', 'shorts');
      const newSearch = urlParams.toString();
      const { pathname } = window.location;
      const newUrl = `${pathname}?${newSearch}`;
      window.history.replaceState({}, '', newUrl);
    } else if (!isShortVideo && shortsView) {
      urlParams.delete('view');
      const newSearch = urlParams.toString();
      history.replace(`${history.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }
  }, [isShortVideo, shortsView, urlParams, search, history]);

  React.useEffect(() => {
    doSetContentHistoryItem(uri);
    doSetPrimaryUri(uri);

    return () => doSetPrimaryUri(null);
  }, [doSetContentHistoryItem, doSetPrimaryUri, uri]);

  if (isWooContent) {
    const commentsListProps = {
      uri,
      linkedCommentId,
      threadCommentId,
      claimIdOverride: effectiveWooClaimId,
    };
    const wooMetaCard = wooData ? (
      <Card
        isPageTitle
        noTitleWrap
        title={escapeHtmlProperty(wooData.title)}
        titleActions={
          <span className="woo__source-note woo__source-note--title">
            <a
              className="woo__source-title-link"
              href={wooYoutubeUrl}
              target="_blank"
              rel="noreferrer noopener"
              title={__('Open on YouTube')}
            >
              {__('Not on Odysee yet, played from YouTube')}
            </a>
            <button className="woo__source-info-link" type="button" aria-label={__('More information')}>
              <Icon icon={ICONS.INFO} size={14} />
            </button>
          </span>
        }
        body={
          <>
            <div className="woo__meta-header">
              <div className="woo__channel-meta">
                <a
                  className="woo__channel-button"
                  href={wooData.author_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={__('Open channel on YouTube')}
                >
                  <Icon icon={ICONS.YOUTUBE} size={16} />
                  <span>{wooData.author_name}</span>
                </a>
                {effectiveWooClaimId && (
                  <div className="file__viewdate woo__view-count">
                    <Icon icon={ICONS.INVITE} />
                    <FileViewCount uri={uri} claimIdOverride={effectiveWooClaimId} hideHelpLink />
                  </div>
                )}
              </div>
              <div className="media__actions woo__meta-actions">
                {effectiveWooClaimId && <FileReactions uri={uri} claimIdOverride={effectiveWooClaimId} />}
                <FileActionButton
                  title={__('Share this content')}
                  className="woo__share-button"
                  icon={ICONS.SHARE}
                  label={wooShareCopied ? __('Copied!') : __('Share')}
                  onClick={handleWooShare}
                />
              </div>
            </div>
          </>
        }
      />
    ) : (
      <Card
        isPageTitle
        noTitleWrap
        title={__('Video metadata unavailable')}
        body={
          <p className="woo__meta-unavailable">
            {__('The YouTube embed could not return metadata, but comments will still stay attached to this video ID.')}
          </p>
        }
        actions={
          <div className="section__actions woo__action-row">
            <FileActionButton
              title={__('Share this content')}
              className="woo__share-button"
              icon={ICONS.SHARE}
              label={wooShareCopied ? __('Copied!') : __('Share')}
              onClick={handleWooShare}
            />
          </div>
        }
      />
    );

    if (isWooLive) {
      const wooLiveDesktopChat = showWooLivestreamChat ? (
        <React.Suspense fallback={null}>
          <LivestreamChat
            uri={uri}
            claimIdOverride={effectiveWooClaimId}
            channelTitleOverride={wooLiveChannelName}
            contentUnlockedOverride
          />
        </React.Suspense>
      ) : null;

      const wooLiveTheaterChat = showWooLivestreamChatInTheater ? (
        <React.Suspense fallback={null}>
          <LivestreamChat
            uri={uri}
            claimIdOverride={effectiveWooClaimId}
            channelTitleOverride={wooLiveChannelName}
            contentUnlockedOverride
          />
        </React.Suspense>
      ) : null;

      return (
        <LivestreamContext.Provider value={{ livestreamPage: true }}>
          <section
            className={classnames('card-stack', 'file-page__video', 'woo__video-stack', {
              'woo__video-stack--live': isWooLive,
            })}
          >
            {wooLoading && (
              <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
                <Spinner delayed />
              </div>
            )}

            {wooError && (
              <Card
                title={__('Unable to load video')}
                body={<div className="help">{__(`Error: %err%`, { err: wooError })}</div>}
              />
            )}

            {wooData && (
              <div
                className={classnames(PRIMARY_PLAYER_WRAPPER_CLASS, {
                  'woo__player-wrapper--short': isWooShort,
                })}
              >
                <div
                  className={classnames('file-render file-render--video', {
                    'woo__file-render--short': isWooShort,
                  })}
                >
                  <div dangerouslySetInnerHTML={{ __html: responsiveEmbedHtml || '' }} />
                </div>
              </div>
            )}

            {!wooLoading && (
              <div className="file-page__secondary-content">
                <div className="file-page__media-actions">
                  <div className="section card-stack">
                    {showWooLivestreamDrawer && (
                      <React.Suspense fallback={null}>
                        <SwipeableDrawer type={DRAWERS.CHAT} title={<h2>{__('Live Chat')}</h2>}>
                          <LivestreamChat
                            uri={uri}
                            hideHeader
                            claimIdOverride={effectiveWooClaimId}
                            channelTitleOverride={wooLiveChannelName}
                            contentUnlockedOverride
                          />
                        </SwipeableDrawer>

                        <DrawerExpandButton icon={ICONS.CHAT} label={__('Open Live Chat')} type={DRAWERS.CHAT} />
                      </React.Suspense>
                    )}

                    {wooMetaCard}
                  </div>
                </div>

                {wooLiveTheaterChat}
              </div>
            )}
          </section>

          {wooLiveDesktopChat}
        </LivestreamContext.Provider>
      );
    }

    const wooComments = (
      <React.Suspense fallback={null}>
        {isMobile && !isLandscapeRotated ? (
          <React.Fragment>
            <SwipeableDrawer type={DRAWERS.CHAT} title={<h2>{effectiveCommentsTitle}</h2>}>
              <CommentsList {...commentsListProps} />
            </SwipeableDrawer>

            <DrawerExpandButton icon={ICONS.CHAT} label={<h2>{effectiveCommentsTitle}</h2>} type={DRAWERS.CHAT} />
          </React.Fragment>
        ) : (
          <CommentsList {...commentsListProps} notInDrawer />
        )}
      </React.Suspense>
    );

    return (
      <>
        <div
          className={classnames('section card-stack', 'file-page__video', 'woo__video-stack', {
            'woo__video-stack--short': isWooShort,
          })}
        >
          {wooLoading && (
            <div className={PRIMARY_PLAYER_WRAPPER_CLASS}>
              <Spinner delayed />
            </div>
          )}

          {wooError && (
            <Card
              title={__('Unable to load video')}
              body={<div className="help">{__(`Error: %err%`, { err: wooError })}</div>}
            />
          )}

          {wooData && (
            <div
              className={classnames(PRIMARY_PLAYER_WRAPPER_CLASS, {
                'woo__player-wrapper--short': isWooShort,
              })}
            >
              <div
                className={classnames('file-render file-render--video', {
                  'woo__file-render--short': isWooShort,
                })}
              >
                <div dangerouslySetInnerHTML={{ __html: responsiveEmbedHtml || '' }} />
              </div>
            </div>
          )}

          {!wooLoading && (
            <div className="file-page__secondary-content">
              <section className="file-page__media-actions woo__media-actions">
                <div className="woo__media-main">
                  {wooMetaCard}
                  {wooComments}
                </div>
              </section>
            </div>
          )}
        </div>

        {showWooRecommended && (
          <div className="woo__recommended-wrap">
            <RecommendedContent
              uri={uri}
              recommendationClaimId={effectiveWooClaimId}
              recommendationTitle={wooData && wooData.title}
              titleLabel={__('Related videos on Odysee')}
              className="woo__recommended"
            />
          </div>
        )}
      </>
    );
  }

  if (!isHidden && isMarkdown) {
    return (
      <React.Suspense fallback={null}>
        <MarkdownPostPage uri={uri} accessStatus={accessStatus} />
      </React.Suspense>
    );
  }

  if (!isHidden && RENDER_MODES.FLOATING_MODES.includes(renderMode)) {
    if (isLivestream) {
      return (
        <React.Suspense fallback={null}>
          <LivestreamPage uri={uri} accessStatus={accessStatus} />
        </React.Suspense>
      );
    }

    if (isShortVideo) {
      return (
        <React.Suspense fallback={null}>
          <ShortsPage uri={uri} accessStatus={accessStatus} key={uri} />
        </React.Suspense>
      );
    }

    return (
      <React.Suspense fallback={null}>
        <VideoPlayersPage uri={uri} accessStatus={accessStatus} />
      </React.Suspense>
    );
  }

  function renderClaimLayout() {
    if (RENDER_MODES.UNRENDERABLE_MODES.includes(renderMode)) {
      return (
        <>
          {thumbnail && (
            <div className={PRIMARY_IMAGE_WRAPPER_CLASS}>
              <StreamClaimRenderInline uri={uri} />
            </div>
          )}
          <FileRenderDownload uri={uri} isFree={cost === 0} />
        </>
      );
    }

    if (RENDER_MODES.TEXT_MODES.includes(renderMode)) {
      return (
        <div className="file-page__pdf-wrapper">
          <StreamClaimRenderInline uri={uri} />
        </div>
      );
    }

    if (renderMode === RENDER_MODES.IMAGE) {
      return (
        <div className={PRIMARY_IMAGE_WRAPPER_CLASS}>
          <StreamClaimRenderInline uri={uri} />
        </div>
      );
    }

    return <StreamClaimRenderInline uri={uri} />;
  }

  function dmcaInfo() {
    return (
      <section className="card--section dmca-info">
        <p>
          {__(
            'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications. Content may also be blocked due to DMCA Red Flag rules which are obvious copyright violations we come across, are discussed in public channels, or reported to us.'
          )}
        </p>
        <p>
          {__('Please remove the content, or reach out to %email% if you think there has been a mistake.', {
            email: 'help@odysee.com',
          })}
        </p>
        <div className="section__actions">
          <Button
            button="link"
            href="https://help.odysee.tv/category-uploading/dmca-content/#receiving-a-dmca-notice"
            label={__('Read More')}
          />
        </div>
      </section>
    );
  }

  function filteredInfo() {
    return (
      <section className="card--section dmca-info">
        <p>{__('This content violates the terms and conditions of Odysee and has been filtered.')}</p>
        <p>
          {__('Please remove the content, or reach out to %email% if you think there has been a mistake.', {
            email: 'help@odysee.com',
          })}
        </p>
        <div className="section__actions">
          <Button button="link" href="https://help.odysee.tv/communityguidelines/" label={__('Read More')} />
        </div>
      </section>
    );
  }

  if (isMature) {
    return (
      <>
        <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        <RecommendedContent uri={uri} />
      </>
    );
  }

  const commentsListProps = { uri, linkedCommentId, threadCommentId };

  return (
    <>
      <div className={classnames('section card-stack', `file-page__${renderMode}`)}>
        {!isHidden && renderClaimLayout()}
        {(isClaimBlackListed && dmcaInfo()) || (isClaimFiltered && filteredInfo())}

        <FileTitleSection uri={uri} accessStatus={accessStatus} />

        {contentUnlocked && (
          <div className="file-page__secondary-content">
            <section className="file-page__media-actions">
              <React.Suspense fallback={null}>
                {commentsDisabled ? (
                  <Empty {...emptyMsgProps} text={__('The creator of this content has disabled comments.')} />
                ) : isMobile && !isLandscapeRotated ? (
                  <React.Fragment>
                    <SwipeableDrawer type={DRAWERS.CHAT} title={<h2>{effectiveCommentsTitle}</h2>}>
                      <CommentsList {...commentsListProps} />
                    </SwipeableDrawer>

                    <DrawerExpandButton
                      icon={ICONS.CHAT}
                      label={<h2>{effectiveCommentsTitle}</h2>}
                      type={DRAWERS.CHAT}
                    />
                  </React.Fragment>
                ) : (
                  <CommentsList {...commentsListProps} notInDrawer />
                )}
              </React.Suspense>
            </section>
          </div>
        )}
      </div>

      <RecommendedContent uri={uri} />
    </>
  );
};

export default StreamClaimPage;
