import React from 'react';
import { useOnResize } from 'effects/use-on-resize';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectClaimForUri, selectClaimSearchByQuery } from 'redux/selectors/claims';
import { doClaimSearch, doResolveUri } from 'redux/actions/claims';
import { createNormalizedClaimSearchKey } from 'util/claim';
import ClaimPreviewTile from 'component/claimPreviewTile';
import ChannelThumbnail from 'component/channelThumbnail';
import SubscribeButton from 'component/subscribeButton';
import './style.lazy.scss';

type Props = {
  homepageData: any;
  authenticated: boolean;
};

function getChannelUri(itemUrl: string): string | null {
  let path = itemUrl;
  if (path.includes('odysee.com')) {
    path = path.substring(path.indexOf('odysee.com') + 10);
  }
  if (path.includes('?')) {
    path = path.substring(0, path.indexOf('?'));
  }
  if (!path.startsWith('/@')) return null;
  const replaced = path.slice(1).replace(':', '#');
  return `lbry://${replaced}`;
}

function BannerLatestClaims({ channelUri, count }: { channelUri: string; count: number }) {
  const dispatch = useAppDispatch();
  const channelClaim = useAppSelector((state) => selectClaimForUri(state, channelUri));
  const channelClaimId = channelClaim?.claim_id;

  const searchOptions = React.useMemo(() => {
    if (!channelClaimId) return null;
    return {
      channel_ids: [channelClaimId],
      page_size: count,
      page: 1,
      order_by: ['release_time'],
      no_totals: true,
      stream_types: ['video'],
    };
  }, [channelClaimId, count]);

  const searchKey = searchOptions ? createNormalizedClaimSearchKey(searchOptions) : null;
  const searchResult = useAppSelector((state) => (searchKey ? selectClaimSearchByQuery(state)[searchKey] : undefined));
  const resultUris: string[] = searchResult && Array.isArray(searchResult) ? searchResult.slice(0, count) : [];

  React.useEffect(() => {
    if (channelUri) {
      dispatch(doResolveUri(channelUri));
    }
  }, [channelUri, dispatch]);

  React.useEffect(() => {
    if (searchOptions && !searchResult) {
      dispatch(doClaimSearch(searchOptions));
    }
  }, [searchOptions, searchResult, dispatch]);

  const channelName = channelClaim?.value?.title || channelClaim?.name?.replace('@', '') || '';

  if (resultUris.length === 0) return null;

  return (
    <div className="banner-latest-claims" onClick={(e) => e.preventDefault()}>
      <div className="banner-latest-claims__header">
        <NavLink to={channelUri.replace('lbry://', '/')} className="banner-latest-claims__channel-link">
          <ChannelThumbnail uri={channelUri} xsmall />
          <span className="banner-latest-claims__name" title={channelName}>{channelName}</span>
        </NavLink>
        <SubscribeButton uri={channelUri} />
      </div>
      <div className="banner-latest-claims__tiles">
        {resultUris.map((uri) => (
          <ClaimPreviewTile key={uri} uri={uri} />
        ))}
      </div>
    </div>
  );
}
function getUriTo(uri) {
  if (uri.includes('odysee.com')) {
    uri = uri.substring(uri.indexOf('odysee.com') + 10);
  }

  let search;

  if (uri.includes('?lid=')) {
    search = uri.substring(uri.indexOf('?lid='));
  }

  return {
    pathname: uri,
    search: search || undefined,
  };
}

export default function FeaturedBanner(props: Props) {
  const { homepageData, authenticated } = props;
  const { featured } = homepageData;
  const latestClaimCount = 3;
  const [marginLeft, setMarginLeft] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const [index, setIndex] = React.useState(1);
  const [pause, setPause] = React.useState(false);
  const [localBannerHidden, setLocalBannerHidden] = React.useState(
    () => sessionStorage.getItem('bannerHidden') === 'true'
  );
  const wrapper = React.useRef(null);
  const imageWidth = width >= 1600 ? 1700 : width >= 1150 ? 1150 : width >= 900 ? 900 : width >= 600 ? 600 : 400;
  const navigate = useNavigate();
  React.useEffect(() => {
    if (featured && width) {
      const interval = setInterval(
        () => {
          if (!pause) {
            setIndex(index + 1 <= featured.items.length ? index + 1 : 1);
          }
        },
        featured.transitionTime * 1000 + 1000
      );
      return () => clearInterval(interval);
    }
  }, [featured, marginLeft, width, pause, index]);
  React.useEffect(() => {
    if (featured && width) {
      setMarginLeft((index - 1) * (width * -1));
    }
  }, [featured, index, width]);
  React.useEffect(() => {
    function measure() {
      if (wrapper.current) {
        setWidth(wrapper.current.offsetWidth);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  function handleAnchor(e, uri) {
    if (uri.charAt(0) !== '#') {
      return;
    }

    e.preventDefault();
    const anchor = document.getElementById(uri.substring(1));

    if (anchor) {
      window.scrollTo({
        top: anchor && anchor.offsetTop,
        behavior: 'smooth',
      });
    } else {
      navigate('$/portal/adventureaddict');
    }
  }

  function removeBanner() {
    setLocalBannerHidden(true);
    sessionStorage.setItem('bannerHidden', 'true');
  }

  if (localBannerHidden) return null;
  return (
    <div
      className="featured-banner-wrapper"
      ref={wrapper}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div
        className="featured-banner-rotator"
        style={{
          marginLeft: marginLeft,
        }}
      >
        {featured &&
          featured.items.map((item, i) => {
            return (
              <div className="featured-banner-slide" key={i} style={{ minWidth: width }}>
                <NavLink
                  className="featured-banner-image"
                  onClick={(e) => handleAnchor(e, item.url)}
                  to={getUriTo(item.url)}
                  target={!item.url.includes('odysee.com') ? '_blank' : undefined}
                  title={item.label}
                >
                  <img
                    src={'https://thumbnails.odycdn.com/optimize/s:' + imageWidth + ':0/quality:95/plain/' + item.image}
                    style={{ width: width }}
                  />
                </NavLink>
                {getChannelUri(item.url) && (
                  <BannerLatestClaims channelUri={getChannelUri(item.url)!} count={latestClaimCount} />
                )}
              </div>
            );
          })}
      </div>
      <div className="banner-controls">
        <div className="banner-browse left" onClick={() => setIndex(index > 1 ? index - 1 : featured.items.length)}>
          ‹
        </div>
        <div className="banner-browse right" onClick={() => setIndex(index < featured.items.length ? index + 1 : 1)}>
          ›
        </div>
        <div className="banner-active-indicator">
          {featured &&
            featured.items.map((item, i) => {
              return (
                <div
                  key={i}
                  className={i + 1 === index ? 'banner-active-indicator-active' : ''}
                  onClick={() => setIndex(i + 1)}
                />
              );
            })}
        </div>
        {authenticated && (
          <button className="banner-close-button" onClick={removeBanner} aria-label="Close banner">
            <Icon icon={ICONS.REMOVE} />
          </button>
        )}
      </div>
    </div>
  );
}
