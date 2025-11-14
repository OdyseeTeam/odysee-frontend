// @flow
import * as React from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import Button from 'component/button';
import ChannelThumbnail from 'component/channelThumbnail';
import { Menu, MenuButton, MenuList, MenuItem } from '@reach/menu-button';
import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import * as MODALS from 'constants/modal_types';
import { Link } from 'react-router-dom';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import { formatNumberWithCommas } from 'util/number';
import * as REACTION_TYPES from 'constants/reactions';
import Skeleton from '@mui/material/Skeleton';
import './style.scss';

type Props = {
  uri?: string,
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
  hasChannel?: boolean,
  hasPlaylist?: boolean,
  autoPlayNextShort?: boolean,
  doToggleShortsAutoplay?: () => void,
  handleViewModeSelect?: (mode: string) => void,
  streamClaim?: StreamClaim,
  onCommentsClick?: () => void,
  onInfoButtonClick?: () => void,
  likeCount: number,
  dislikeCount: number,
  myReaction: ?string,
  isLivestreamClaim?: boolean,
  doFetchReactions: (claimId: ?string) => void,
  doReactionLike: (uri: string) => void,
  doReactionDislike: (uri: string) => void,
  isUnlisted: ?boolean,
  doOpenModal?: (id: string, props: any) => void,
  webShareable?: boolean,
  collectionId?: string,
};

const SwipeNavigationPortal = React.memo<Props>(
  ({
    uri,
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
    hasChannel,
    hasPlaylist,
    onInfoButtonClick,
    autoPlayNextShort,
    doToggleShortsAutoplay,
    onCommentsClick,
    likeCount,
    dislikeCount,
    myReaction,
    doReactionLike,
    doReactionDislike,
    streamClaim,
    webShareable,
    isUnlisted,
    collectionId,
    doOpenModal,
  }: Props) => {
    const overlayRef = React.useRef();
    const touchStartRef = React.useRef(null);
    const touchEndRef = React.useRef(null);
    const isScrollingRef = React.useRef(false);
    const scrollLockRef = React.useRef(false);
    const isTapRef = React.useRef(false);
    const Placeholder = <Skeleton variant="text" animation="wave" className="reaction-count-placeholder" />;

    const handleShareClick = React.useCallback(() => {
      if (doOpenModal) {
        doOpenModal(MODALS.SOCIAL_SHARE, { uri, webShareable, collectionId });
      }
    }, [doOpenModal, uri, webShareable, collectionId]);

    const handleViewModeSelect = (mode) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      }
    };

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
        onClick={() => {
          onPlayPause();
          if (streamClaim) {
            streamClaim();
          }
        }}
        ref={overlayRef}
        className={`
          swipe-navigation-overlay ${className} ${isEnabled ? 'swipe-navigation-overlay--enabled' : ''} 
          ${sidePanelOpen ? 'shorts__viewer--panel-open' : ''}
        `}
      >
        <div className="shorts-mobile-panel__actions">
        <div className="shorts-mobile-panel__action-item">
          <Button
            onClick={() => doReactionLike(uri)}
            icon={myReaction === REACTION_TYPES.LIKE ? ICONS.FIRE_ACTIVE : ICONS.FIRE}
            iconSize={16}
            title={__('I Like This')}
            requiresAuth
            authSrc="filereaction_like"
            className={classnames('shorts-mobile-panel__action-button button--file-action button-like', {
              'button--fire': myReaction === REACTION_TYPES.LIKE,
            })}
            label={
              <>
                {myReaction === REACTION_TYPES.LIKE && (
                  <>
                    <div className="button__fire-glow" />
                    <div className="button__fire-particle1" />
                    <div className="button__fire-particle2" />
                    <div className="button__fire-particle3" />
                    <div className="button__fire-particle4" />
                    <div className="button__fire-particle5" />
                    <div className="button__fire-particle6" />
                  </>
                )}
              </>
            }
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(likeCount) ? formatNumberWithCommas(likeCount, 0) : Placeholder}
          </span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            requiresAuth
            authSrc={'filereaction_dislike'}
            title={__('I dislike this')}
            className={classnames('shorts-mobile-panel__action-button button--file-action button-dislike', {
              'button--slime': myReaction === REACTION_TYPES.DISLIKE,
            })}
            label={
              <>
                {myReaction === REACTION_TYPES.DISLIKE && (
                  <>
                    <div className="button__slime-stain" />
                    <div className="button__slime-drop1" />
                    <div className="button__slime-drop2" />
                  </>
                )}
              </>
            }
            iconSize={16}
            icon={myReaction === REACTION_TYPES.DISLIKE ? ICONS.SLIME_ACTIVE : ICONS.SLIME}
            onClick={() => doReactionDislike(uri)}
          />
          <span className="shorts-mobile-panel__count">
            {Number.isInteger(dislikeCount) ? formatNumberWithCommas(dislikeCount, 0) : Placeholder}
          </span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onCommentsClick}
            icon={ICONS.COMMENTS_LIST}
            iconSize={16}
          />
          <span className="shorts-mobile-panel__count">{__('Comments')}</span>
        </div>
        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={handleShareClick}
            icon={ICONS.SHARE}
            iconSize={16}
            title={isUnlisted ? __('Get a sharable link for your unlisted content') : __('Share')}
          />
          <span className="shorts-mobile-panel__count">{__('Share')}</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className="shorts-mobile-panel__action-button"
            onClick={onInfoButtonClick}
            icon={ICONS.INFO}
            iconSize={16}
          />
          <span className="shorts-mobile-panel__count">{__('Details')}</span>
        </div>

        <div className="shorts-mobile-panel__action-item">
          <Button
            className={classnames('shorts-mobile-panel__action-button button-bubble', {
              'button-bubble--active': autoPlayNextShort,
            })}
            isShorts
            requiresAuth={IS_WEB}
            title={__('Autoplay Next')}
            onClick={doToggleShortsAutoplay}
            icon={ICONS.AUTOPLAY_NEXT}
            iconSize={24}
          />
          <span className="shorts-mobile-panel__count">{__('Auto Next')}</span>
        </div>
      </div>
        {channelName && (
          <>
            <div className="swipe-navigation-overlay__content-info">
              <div className="swipe-navigation-overlay__text-info">
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
              <span className="swipe-navigation-overlay__title">{title}</span>
            </div>
          </>
        )}

        {!isMobile && hasChannel && (
          <Menu>
            <MenuButton
              className="shorts-page-menu__button"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Icon size={20} icon={ICONS.MORE} />
            </MenuButton>

            <MenuList className="menu__list shorts-page__view-menu">
              <MenuItem
                className={classnames('comment__menu-option', {
                  'comment__menu-option--active': viewMode === 'related',
                })}
                onSelect={() => handleViewModeSelect('related')}
              >
                <div className="menu__link">
                  <Icon aria-hidden iconColor={viewMode === 'related' ? 'var(--color-primary)' : undefined} />
                  {__('Related')}
                </div>
              </MenuItem>

              <MenuItem
                className={classnames('comment__menu-option', {
                  'comment__menu-option--active': viewMode === 'channel',
                })}
                onSelect={() => handleViewModeSelect('channel')}
              >
                <div className="menu__link">
                  <Icon iconColor={viewMode === 'channel' ? 'var(--color-primary)' : undefined} />
                  {__('From %channel%', {
                    channel:
                      channelName && channelName.length > 20
                        ? channelName.substring(0, 20) + '...'
                        : channelName || 'Channel',
                  })}
                </div>
              </MenuItem>
            </MenuList>
          </Menu>
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
                handleViewModeSelect('related');
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
                handleViewModeSelect('channel');
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

export default withStreamClaimRender(SwipeNavigationPortal);
