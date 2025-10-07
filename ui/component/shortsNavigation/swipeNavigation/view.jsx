// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import { Link } from 'react-router-dom';
import './style.scss';

type Props = {
  children: React.Node,
  onNext: () => void,
  onPrevious: () => void,
  isEnabled: boolean,
  className?: string,
  containerSelector?: string,
  isMobile: boolean,
  allowVideoInteraction?: boolean,
  onPlayPause?: () => void,
  sidePanelOpen?: boolean,
  // View mode props
  showViewToggle?: boolean,
  viewMode?: string,
  channelName?: string,
  onViewModeChange?: (mode: string) => void,
  title?: string,
  channelUri?: string,
  thumbnailUrl?: string,
};

const SwipeNavigationPortal = React.memo<Props>(
  ({
    children,
    onNext,
    onPrevious,
    isEnabled,
    onPlayPause,
    className = '',
    containerSelector,
    isMobile,
    sidePanelOpen,
    showViewToggle = false,
    viewMode = 'related',
    channelName,
    onViewModeChange,
    title,
    channelUri,
    thumbnailUrl,
  }: Props) => {
    const overlayRef = React.useRef();
    const touchStartRef = React.useRef(null);
    const touchEndRef = React.useRef(null);
    const isScrollingRef = React.useRef(false);
    const scrollLockRef = React.useRef(false);
    const isTapRef = React.useRef(false);

    const handleTouchStart = React.useCallback(
      (e) => {
        if (!isEnabled) return;

        touchStartRef.current = {
          y: e.targetTouches[0].clientY,
          x: e.targetTouches[0].clientX,
          time: Date.now(),
        };
        touchEndRef.current = null;
        isScrollingRef.current = false;
        isTapRef.current = true;
      },
      [isEnabled]
    );

    const handleTouchMove = React.useCallback(
      (e) => {
        if (!isEnabled || !touchStartRef.current) return;

        const currentY = e.targetTouches[0].clientY;
        const currentX = e.targetTouches[0].clientX;
        const diffY = Math.abs(touchStartRef.current.y - currentY);
        const diffX = Math.abs(touchStartRef.current.x - currentX);

        if (diffY > 15) {
          isScrollingRef.current = true;
          isTapRef.current = false;
        }
        if (diffX > diffY) {
          isTapRef.current = false;
        }

        touchEndRef.current = { y: currentY, x: currentX };
      },
      [isEnabled]
    );

    const handleTouchEnd = React.useCallback(
      (e) => {
        if (!isEnabled || !touchStartRef.current) return;

        const touchDuration = Date.now() - touchStartRef.current.time;
        if (isTapRef.current && touchDuration < 200) {
          touchStartRef.current = null;
          touchEndRef.current = null;
          isScrollingRef.current = false;
          return;
        }

        if (!touchEndRef.current || !isScrollingRef.current) return;
        const swipeDistance = touchStartRef.current.y - touchEndRef.current.y;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
          e.preventDefault();
          e.stopPropagation();

          if (swipeDistance > 0) {
            onNext();
          } else {
            onPrevious();
          }
        }

        touchStartRef.current = null;
        touchEndRef.current = null;
        isScrollingRef.current = false;
        isTapRef.current = false;
      },
      [onNext, onPrevious, isEnabled]
    );

    const handleWheel = React.useCallback(
      (e) => {
        if (!isEnabled || scrollLockRef.current) return;

        e.preventDefault();
        scrollLockRef.current = true;

        if (e.deltaY > 0) {
          onNext();
        } else if (e.deltaY < 0) {
          onPrevious();
        }

        setTimeout(() => {
          scrollLockRef.current = false;
        }, 500);
      },
      [onNext, onPrevious, isEnabled]
    );

    const handleKeyDown = React.useCallback(
      (e) => {
        if (!isEnabled) return;

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onPrevious();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onNext();
        }
      },
      [onNext, onPrevious, isEnabled]
    );

    React.useEffect(() => {
      const overlay = overlayRef.current;
      if (!overlay || !isEnabled) return;
      if (isMobile) {
        overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
        overlay.addEventListener('touchmove', handleTouchMove, { passive: true });
        overlay.addEventListener('touchend', handleTouchEnd, { passive: false });
      }
      if (!isMobile) {
        overlay.addEventListener('wheel', handleWheel, { passive: false });
      }
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        if (isMobile) {
          overlay.removeEventListener('touchstart', handleTouchStart);
          overlay.removeEventListener('touchmove', handleTouchMove);
          overlay.removeEventListener('touchend', handleTouchEnd);
        }
        if (!isMobile) {
          overlay.removeEventListener('wheel', handleWheel);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [isMobile, isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, handleKeyDown]);

    const targetContainer = React.useMemo(() => {
      if (containerSelector) {
        return document.querySelector(containerSelector);
      }
      return document.body;
    }, [containerSelector]);

    if (!targetContainer) return null;

    return createPortal(
      <div
        onClick={onPlayPause}
        ref={overlayRef}
        className={`
          swipe-navigation-overlay ${className} ${isEnabled ? 'swipe-navigation-overlay--enabled' : ''} 
          ${sidePanelOpen ? 'shorts__viewer--panel-open' : ''}
        `}
      >
        {(title || channelName) && (
          <div className="swipe-navigation-overlay__content-info">
            <div className="swipe-navigation-overlay__text-info">
              {title && <h2 className="swipe-navigation-overlay__title">{title}</h2>}
              {channelUri && channelName && (
                <Link
                  to={channelUri.replace('lbry://', '/').replace(/#/g, ':')}
                  className="swipe-navigation-overlay__channel"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <ChannelThumbnail uri={channelUri} xsmall checkMembership={false} />
                  <span className="swipe-navigation-overlay__channel-name">{channelName}</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {showViewToggle && onViewModeChange && (
          <div className="shorts-page__view-toggle--overlay">
            <Button
              className={classnames('button-bubble', {
                'button-bubble--active': viewMode === 'related',
              })}
              label={__('Related')}
              onClick={(e) => {
                e.stopPropagation();
                onViewModeChange('related');
              }}
            />
            <Button
              className={classnames('button-bubble', {
                'button-bubble--active': viewMode === 'channel',
              })}
              label={__('From %channel%', {
                channel:
                  channelName && channelName.length > 15
                    ? channelName.substring(0, 15) + '...'
                    : channelName || 'Channel',
              })}
              onClick={(e) => {
                e.stopPropagation();
                onViewModeChange('channel');
              }}
            />
          </div>
        )}
        {children}
      </div>,
      targetContainer
    );
  }
);

export default SwipeNavigationPortal;
