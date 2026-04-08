import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import { Lbryio } from 'lbryinc';
import ClaimPreview from 'component/claimPreview';
import Spinner from 'component/spinner';
import Icon from 'component/common/icon';
import Button from 'component/button';
import Yrbl from 'component/yrbl';
import ChannelThumbnail from 'component/channelThumbnail';
import { useNavigate } from 'react-router-dom';
import { formatLbryUrlForWeb } from 'util/url';
import Comments from 'comments';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { makeSelectClaimForUri, selectClaimsById, selectClaimForUri } from 'redux/selectors/claims';
import { doResolveUris as doResolveUrisAction, doFetchClaimListMine } from 'redux/actions/claims';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  selectMembershipTiersForCreatorId,
  selectMonthlyIncomeForChannelId,
  selectSupportersAmountForChannelId,
} from 'redux/selectors/memberships';
import { selectModerationBlockList } from 'redux/selectors/comments';
import { doFetchViewCount } from 'lbryinc';
import { selectViewCount } from 'lbryinc';
import './style.scss';

type ChannelStats = {
  ChannelSubs: number;
  ChannelSubChange: number;
  AllContentViews: number;
  AllContentViewChange: number;
  VideoURITopNew: string;
  VideoViewsTopNew: number;
  VideoViewChangeTopNew: number;
  VideoURITopCommentNew: string;
  VideoCommentTopCommentNew: number;
  VideoCommentChangeTopCommentNew: number;
  VideoURITopAllTime: string;
  VideoViewsTopAllTime: number;
  VideoViewChangeTopAllTime: number;
};

type Props = {
  uri: string;
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function TrendIndicator({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <span className="dashboard__trend dashboard__trend--neutral">0{suffix}</span>;
  }
  const isPositive = value > 0;
  return (
    <span className={`dashboard__trend ${isPositive ? 'dashboard__trend--up' : 'dashboard__trend--down'}`}>
      <Icon icon={isPositive ? ICONS.TRENDING : ICONS.DOWN} size={10} />
      {isPositive ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

export default function CreatorAnalytics(props: Props) {
  const { uri } = props;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const claim = useAppSelector((state) => makeSelectClaimForUri(uri)(state));
  const claimId = claim?.claim_id;
  const activeChannel = useAppSelector(selectActiveChannelClaim);

  const [stats, setStats] = React.useState<ChannelStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fetching, setFetching] = React.useState(false);
  const [recentComments, setRecentComments] = React.useState<any[]>([]);
  const blockedChannels = useAppSelector(selectModerationBlockList);

  const membershipTiers = useAppSelector((state) =>
    claimId ? selectMembershipTiersForCreatorId(state, claimId) : undefined
  );
  const monthlyIncome = useAppSelector((state) => (claimId ? selectMonthlyIncomeForChannelId(state, claimId) : 0));
  const supporterCount = useAppSelector((state) => (claimId ? selectSupportersAmountForChannelId(state, claimId) : 0));
  const hasMemberships = membershipTiers && membershipTiers.length > 0 && (supporterCount > 0 || monthlyIncome > 0);

  const claimsById = useAppSelector(selectClaimsById);
  const [channelClaimIds, setChannelClaimIds] = React.useState<string[]>([]);
  const viewCountById = useAppSelector(selectViewCount);
  const topNewClaim = useAppSelector((state) =>
    stats?.VideoURITopNew ? selectClaimForUri(state, stats.VideoURITopNew) : undefined
  );
  const topCommentClaim = useAppSelector((state) =>
    stats?.VideoURITopCommentNew ? selectClaimForUri(state, stats.VideoURITopCommentNew) : undefined
  );
  const topAllTimeClaim = useAppSelector((state) =>
    stats?.VideoURITopAllTime ? selectClaimForUri(state, stats.VideoURITopAllTime) : undefined
  );

  React.useEffect(() => {
    if (!claimId) return;
    dispatch(doFetchClaimListMine(1, 99999, true, ['stream'], true, [claimId]));
  }, [claimId, dispatch]);

  React.useEffect(() => {
    if (!claimId || !claimsById) return;
    const ids = Object.keys(claimsById)
      .filter((id) => {
        const c = claimsById[id];
        return (
          c &&
          c.signing_channel?.claim_id === claimId &&
          c.value_type === 'stream' &&
          !id.startsWith('pending-') &&
          c.confirmations > 0
        );
      })
      .sort((a, b) => (claimsById[b]?.timestamp || 0) - (claimsById[a]?.timestamp || 0));
    setChannelClaimIds(ids);
  }, [claimId, claimsById]);

  const channelClaims = channelClaimIds.map((id) => claimsById[id]).filter(Boolean);
  const recentClaims = channelClaims.slice(0, 10);

  React.useEffect(() => {
    if (recentClaims.length > 0) {
      const ids = recentClaims.map((c: any) => c.claim_id).join(',');
      dispatch(doFetchViewCount(ids));
    }
  }, [channelClaimIds.length, claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setStats(null);
    setError(null);
  }, [claimId]);

  React.useEffect(() => {
    if (!claimId) return;
    setFetching(true);
    Lbryio.call('channel', 'stats', { claim_id: claimId })
      .then((res: ChannelStats) => {
        setStats(res);
        setFetching(false);
        const normalize = (u: string) => (u && !u.startsWith('lbry://') ? `lbry://${u}` : u);
        res.VideoURITopNew = normalize(res.VideoURITopNew);
        res.VideoURITopCommentNew = normalize(res.VideoURITopCommentNew);
        res.VideoURITopAllTime = normalize(res.VideoURITopAllTime);
        const uris = [res.VideoURITopNew, res.VideoURITopCommentNew, res.VideoURITopAllTime].filter(Boolean);
        if (uris.length > 0) dispatch(doResolveUrisAction(uris));
      })
      .catch(() => {
        setError('error');
        setFetching(false);
      });
  }, [claimId, dispatch]);

  React.useEffect(() => {
    if (!channelClaimIds.length || !claimId || !claim) return;
    const channelName = claim.name;
    const claimTitles: Record<string, string> = {};
    const claimUrlMap: Record<string, string> = {};
    channelClaimIds.forEach((id) => {
      const c = claimsById[id];
      if (c) {
        claimTitles[id] = c.value?.title || c.name;
        claimUrlMap[id] = formatLbryUrlForWeb(c.canonical_url || c.permanent_url);
      }
    });

    const fetchPromises = channelClaimIds.slice(0, 20).map((cid: string) =>
      Comments.comment_list({
        page: 1,
        claim_id: cid,
        page_size: 1,
        sort_by: 0,
        channel_id: claimId,
        channel_name: channelName,
        top_level: true,
      } as any)
        .then((r: any) =>
          (r?.items || []).map((item: any) => ({
            ...item,
            _claimTitle: claimTitles[cid] || '',
            _claimUrl: claimUrlMap[cid] || '',
          }))
        )
        .catch(() => [])
    );

    Promise.all(fetchPromises).then((results) => {
      const all = results.flat();
      const filtered = all.filter((c: any) => c.comment && c.comment.trim() && c.channel_id && c.channel_name);
      filtered.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      const top = filtered.slice(0, 10);
      if (top.length === 0) return;

      const channelUrls = [...new Set(top.map((c: any) => c.channel_url).filter(Boolean))] as string[];
      dispatch(doResolveUrisAction(channelUrls))
        .then(() => {
          const freshClaimsByUri = window.store?.getState?.()?.claims?.claimsByUri || {};
          const valid = top.filter((c: any) => !c.channel_url || freshClaimsByUri[c.channel_url] != null);
          setRecentComments(valid.slice(0, 5));
        })
        .catch(() => setRecentComments(top.slice(0, 5)));
    });
  }, [channelClaimIds.length, claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats && fetching) {
    return (
      <div className="main--empty">
        <Spinner delayed />
      </div>
    );
  }

  if (error || (!stats && !fetching)) {
    return (
      <Yrbl
        type="sad"
        title={__('No stats available')}
        subtitle={__('Stats will appear once your content gets some views. Make sure data sharing is enabled.')}
        actions={
          <div className="section__actions">
            <Button button="primary" label={__('Upload Something')} onClick={() => navigate(`/$/${PAGES.UPLOAD}`)} />
          </div>
        }
      />
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard">
      <div className="dashboard__overview">
        <div className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--red">
            <Icon icon={ICONS.SUBSCRIBE} size={28} />
          </div>
          <div className="dashboard__stat-body">
            <span className="dashboard__stat-value">{formatNumber(stats.ChannelSubs)}</span>
            <span className="dashboard__stat-label">{__('Followers')}</span>
            <TrendIndicator value={stats.ChannelSubChange} suffix={__(' this week')} />
          </div>
        </div>

        <div className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--green">
            <Icon icon={ICONS.EYE} size={28} />
          </div>
          <div className="dashboard__stat-body">
            <span className="dashboard__stat-value">{formatNumber(stats.AllContentViews)}</span>
            <span className="dashboard__stat-label">{__('Total Views')}</span>
            <TrendIndicator value={stats.AllContentViewChange} suffix={__(' this week')} />
          </div>
        </div>

        <div className="dashboard__stat-card">
          <div className="dashboard__stat-icon dashboard__stat-icon--blue">
            <Icon icon={ICONS.PUBLISH} size={28} />
          </div>
          <div className="dashboard__stat-body">
            <span className="dashboard__stat-value">{channelClaims.length}</span>
            <span className="dashboard__stat-label">{__('Uploads')}</span>
          </div>
        </div>

        {hasMemberships && (
          <>
            <div className="dashboard__stat-card">
              <div className="dashboard__stat-icon">
                <Icon icon={ICONS.MEMBERSHIP} size={20} />
              </div>
              <div className="dashboard__stat-body">
                <span className="dashboard__stat-value">{supporterCount}</span>
                <span className="dashboard__stat-label">{__('Members')}</span>
              </div>
            </div>

            <div className="dashboard__stat-card">
              <div className="dashboard__stat-icon">
                <Icon icon={ICONS.FINANCE} size={20} />
              </div>
              <div className="dashboard__stat-body">
                <span className="dashboard__stat-value">{formatCurrency(monthlyIncome || 0)}</span>
                <span className="dashboard__stat-label">{__('Monthly Income')}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard__sections">
        <div className="dashboard__main">
          <div className="dashboard__section">
            <h2 className="dashboard__section-title">{__('Top Content')}</h2>
            <div className="dashboard__top-content">
              {stats.VideoURITopNew && topNewClaim && (
                <div className="dashboard__top-item">
                  <span className="dashboard__top-badge">{__('Trending')}</span>
                  <ClaimPreview uri={stats.VideoURITopNew} />
                  <div className="dashboard__top-meta">
                    <span>
                      {formatNumber(stats.VideoViewsTopNew)} {__('views')}
                    </span>
                    <span className="dashboard__top-meta-dot">·</span>
                    <TrendIndicator value={stats.VideoViewChangeTopNew} suffix={__(' this week')} />
                  </div>
                </div>
              )}

              {stats.VideoURITopCommentNew && stats.VideoCommentTopCommentNew > 0 && topCommentClaim && (
                <div className="dashboard__top-item">
                  <span className="dashboard__top-badge">{__('Most Discussed')}</span>
                  <ClaimPreview uri={stats.VideoURITopCommentNew} />
                  <div className="dashboard__top-meta">
                    <span>
                      {formatNumber(stats.VideoCommentTopCommentNew)} {__('comments')}
                    </span>
                    <span className="dashboard__top-meta-dot">·</span>
                    <TrendIndicator value={stats.VideoCommentChangeTopCommentNew} suffix={__(' this week')} />
                  </div>
                </div>
              )}

              {stats.VideoURITopAllTime && topAllTimeClaim && (
                <div className="dashboard__top-item">
                  <span className="dashboard__top-badge">{__('All-Time Best')}</span>
                  <ClaimPreview uri={stats.VideoURITopAllTime} />
                  <div className="dashboard__top-meta">
                    <span>
                      {formatNumber(stats.VideoViewsTopAllTime)} {__('views')}
                    </span>
                    <span className="dashboard__top-meta-dot">·</span>
                    <TrendIndicator value={stats.VideoViewChangeTopAllTime} suffix={__(' this week')} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {recentClaims.length > 0 && (
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">{__('Recent Uploads')}</h2>
                <Button button="link" label={__('View all')} navigate={`/$/${PAGES.UPLOADS}`} />
              </div>
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>{__('Title')}</th>
                    <th>{__('Views')}</th>
                    <th>{__('Published')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.map((c: any) => {
                    const views = viewCountById?.[c.claim_id] ?? null;
                    const title = c.value?.title || c.name;
                    const date = c.timestamp ? new Date(c.timestamp * 1000) : null;
                    return (
                      <tr
                        key={c.claim_id}
                        className="dashboard__table-row"
                        onClick={() => navigate(formatLbryUrlForWeb(c.canonical_url || c.permanent_url))}
                      >
                        <td className="dashboard__table-title">{title}</td>
                        <td className="dashboard__table-views">{views !== null ? formatNumber(views) : '--'}</td>
                        <td className="dashboard__table-date">{date ? date.toLocaleDateString() : '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {recentComments.length > 0 && (
            <div className="dashboard__section">
              <h2 className="dashboard__section-title">{__('Recent Comments')}</h2>
              <div className="dashboard__comments">
                {recentComments.map((comment: any) => (
                  <div
                    key={comment.comment_id}
                    className="dashboard__comment"
                    onClick={() => comment._claimUrl && navigate(`${comment._claimUrl}?lc=${comment.comment_id}`)}
                  >
                    {blockedChannels.includes(comment.channel_url) && (
                      <span className="dashboard__comment-badge dashboard__comment-badge--blocked">
                        {__('Blocked')}
                      </span>
                    )}
                    <div className="dashboard__comment-header">
                      {comment.channel_url ? (
                        <span
                          className="dashboard__comment-author dashboard__link"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(formatLbryUrlForWeb(comment.channel_url));
                          }}
                        >
                          {comment.channel_name}
                        </span>
                      ) : (
                        <span className="dashboard__comment-author">{__('Anonymous')}</span>
                      )}
                      <span className="dashboard__comment-time">
                        {comment.timestamp ? new Date(comment.timestamp * 1000).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="dashboard__comment-text">{comment.comment}</p>
                    {comment._claimTitle && (
                      <span
                        className="dashboard__comment-claim dashboard__link"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(comment._claimUrl);
                        }}
                      >
                        {__('on')} {comment._claimTitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard__sidebar">
          <div className="dashboard__section">
            <h2 className="dashboard__section-title">{__('Quick Actions')}</h2>
            <div className="dashboard__actions">
              <Button button="secondary" icon={ICONS.PUBLISH} label={__('Upload')} navigate={`/$/${PAGES.UPLOAD}`} />
              <Button button="secondary" icon={ICONS.POST} label={__('Post')} navigate={`/$/${PAGES.POST}`} />
              <Button
                button="secondary"
                icon={ICONS.LIVESTREAM}
                label={__('Go Live')}
                navigate={`/$/${PAGES.LIVESTREAM}`}
              />
              <Button
                button="secondary"
                icon={ICONS.SETTINGS}
                label={__('Settings')}
                navigate={
                  activeChannel?.canonical_url
                    ? formatLbryUrlForWeb(activeChannel.canonical_url) + '?view=settings'
                    : undefined
                }
              />
            </div>
          </div>

          {activeChannel && (
            <div className="dashboard__section">
              <h2 className="dashboard__section-title">{__('Channel')}</h2>
              <Button
                button="secondary"
                className="dashboard__channel-card"
                navigate={formatLbryUrlForWeb(activeChannel.canonical_url || activeChannel.permanent_url)}
              >
                <ChannelThumbnail uri={activeChannel.permanent_url} xsmall />
                <div className="dashboard__channel-info">
                  <span className="dashboard__channel-name">{activeChannel.value?.title || activeChannel.name}</span>
                  <span className="dashboard__channel-url">{activeChannel.name}</span>
                </div>
              </Button>
            </div>
          )}

          {hasMemberships && (
            <div className="dashboard__section">
              <h2 className="dashboard__section-title">{__('Membership')}</h2>
              <div className="dashboard__membership-summary">
                <div className="dashboard__membership-row">
                  <span>{__('Members')}</span>
                  <span>{supporterCount}</span>
                </div>
                <div className="dashboard__membership-row">
                  <span>{__('Tiers')}</span>
                  <span>{membershipTiers?.length || 0}</span>
                </div>
                <div className="dashboard__membership-row">
                  <span>{__('Monthly')}</span>
                  <span>{formatCurrency(monthlyIncome || 0)}</span>
                </div>
              </div>
              <Button button="link" label={__('Manage Memberships')} navigate={`/$/${PAGES.CREATOR_MEMBERSHIPS}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
