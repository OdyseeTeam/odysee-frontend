// @flow
import React from 'react';
import { useOnResize } from 'effects/use-on-resize';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import classnames from 'classnames';
import { NavLink } from 'react-router-dom';
import { useHistory } from 'react-router';
import './style.lazy.scss';

type Props = {
  homepageData: any,
  authenticated: boolean,
};

export default function FeaturedBanner(props: Props) {
  const { homepageData, authenticated } = props;
  const { featured } = homepageData;
  const [marginLeft, setMarginLeft] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const [index, setIndex] = React.useState(1);
  const [pause, setPause] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  // Use localStorage for Cordova to persist across app restarts, sessionStorage for web
  const storage = window.cordova ? localStorage : sessionStorage;
  const storageKey = 'bannerHidden';
  const [localBannerHidden, setLocalBannerHidden] = React.useState(() => storage.getItem(storageKey) === 'true');
  const wrapper = React.useRef(null);
  const menuRef = React.useRef(null);
  const imageWidth = width >= 1600 ? 1700 : width >= 1150 ? 1150 : width >= 900 ? 900 : width >= 600 ? 600 : 400;
  const { push } = useHistory();

  // Clear banner state when user logs out (for Cordova)
  React.useEffect(() => {
    if (window.cordova && !authenticated) {
      // User logged out, clear the banner hidden state
      localStorage.removeItem(storageKey);
      setLocalBannerHidden(false);
    }
  }, [authenticated]);

  React.useEffect(() => {
    if (featured && width) {
      const interval = setInterval(() => {
        if (!pause) {
          setIndex(index + 1 <= featured.items.length ? index + 1 : 1);
        }
      }, featured.transitionTime * 1000 + 1000);
      return () => clearInterval(interval);
    }
  }, [featured, marginLeft, width, pause, index]);

  React.useEffect(() => {
    if (featured && width) {
      setMarginLeft((index - 1) * (width * -1));
    }
  }, [featured, index, width]);

  useOnResize(() => {
    if (wrapper.current) {
      setWidth(wrapper.current.offsetWidth);
    }
  });

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

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
      push('$/portal/adventureaddict');
    }
  }

  function toggleMenu(e) {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  }

  function removeBanner() {
    setLocalBannerHidden(true);
    storage.setItem(storageKey, 'true');
    setIsMenuOpen(false);
  }

  if (localBannerHidden) return null;

  return (
    <div
      className="featured-banner-wrapper"
      ref={wrapper}
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div className="featured-banner-rotator" style={{ marginLeft: marginLeft }}>
        {featured &&
          featured.items.map((item, i) => {
            return (
              <NavLink
                className="featured-banner-image"
                onClick={(e) => handleAnchor(e, item.url)}
                to={getUriTo(item.url)}
                target={!item.url.includes('odysee.com') ? '_blank' : undefined}
                title={item.label}
                key={i}
                style={{ minWidth: width }}
              >
                <img
                  src={'https://thumbnails.odycdn.com/optimize/s:' + imageWidth + ':0/quality:95/plain/' + item.image}
                  style={{ width: width }}
                />
              </NavLink>
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
          <div className="banner-context-menu" ref={menuRef}>
            <button className="banner-menu-button" onClick={toggleMenu} aria-label="More options">
              <Icon icon={ICONS.MORE} />
            </button>
            {isMenuOpen && (
              <div className="banner-menu-dropdown">
                <button className="banner-menu-item" onClick={removeBanner}>
                  Close the banner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
