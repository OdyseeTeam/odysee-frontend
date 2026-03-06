// @flow
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React, { useRef, useLayoutEffect } from 'react';
import { parseURI } from 'util/lbryURI';
import Button from 'component/button';
import Icon from 'component/common/icon';

import { useIsMobile } from 'effects/use-screensize';
import { ENABLE_UI_NOTIFICATIONS } from 'config';
import { EmbedContext } from 'contexts/embed';
import { formatLbryUrlForWeb } from 'util/url';
import useBrowserNotifications from '$web/component/browserNotificationSettings/use-browser-notifications';

type SubscriptionArgs = {
  channelName: string,
  uri: string,
  notificationsDisabled?: boolean,
};

type Props = {
  permanentUrl: ?string,
  isSubscribed: boolean,
  doChannelSubscribe: (SubscriptionArgs, boolean) => void,
  doChannelUnsubscribe: (SubscriptionArgs, boolean) => void,
  doToast: ({ message: string }) => void,
  shrinkOnMobile: boolean,
  notificationsDisabled: boolean,
  user: ?User,
  uri: string,
  preferEmbed: boolean,
};

export default function SubscribeButton(props: Props) {
  const {
    permanentUrl,
    doChannelSubscribe,
    doChannelUnsubscribe,
    isSubscribed,
    doToast,
    shrinkOnMobile = false,
    notificationsDisabled,
    user,
    uri,
    preferEmbed,
  } = props;

  const isEmbed = React.useContext(EmbedContext);

  const buttonRef = useRef();
  const prevWidthRef = useRef(null);
  const isMobile = useIsMobile();

  const uiNotificationsEnabled = (user && user.experimental_ui) || ENABLE_UI_NOTIFICATIONS;

  const { channelName: rawChannelName } = parseURI(uri);

  let channelName;

  if (permanentUrl) {
    try {
      const { channelName: name } = parseURI(permanentUrl);
      if (name) {
        channelName = name;
      }
    } catch (e) {}
  }
  const claimName = channelName && '@' + channelName;

  const { pushSupported, pushEnabled, pushRequest, pushErrorModal } = useBrowserNotifications();

  useLayoutEffect(() => {
    const btn = buttonRef.current;
    const prev = prevWidthRef.current;
    if (btn && prev !== null) {
      const newWidth = Math.round(btn.getBoundingClientRect().width);
      const prevWidth = Math.round(prev);
      prevWidthRef.current = null;
      if (prevWidth !== newWidth) {
        // $FlowFixMe - WAAPI
        const anim = btn.animate([{ width: prevWidth + 'px' }, { width: newWidth + 'px' }], {
          duration: 300,
          easing: 'ease',
        });
        anim.onfinish = () => {
          if (buttonRef.current) buttonRef.current.style.width = '';
        };
      }
    }
  }, [isSubscribed]);

  const subscriptionHandler = isSubscribed ? doChannelUnsubscribe : doChannelSubscribe;

  const subscriptionLabel = isSubscribed
    ? __('Following --[button label indicating a channel has been followed]--')
    : __('Follow');
  const unfollowOverride = false;

  const label = isMobile && shrinkOnMobile ? '' : unfollowOverride || subscriptionLabel;
  const titlePrefix = isSubscribed ? __('Unfollow this channel') : __('Follow this channel');

  if (!preferEmbed && isSubscribed && !permanentUrl && rawChannelName) {
    return (
      <div className="button-group button-group-subscribed">
        <Button
          ref={buttonRef}
          iconColor="red"
          largestLabel={isMobile && shrinkOnMobile ? '' : subscriptionLabel}
          icon={ICONS.UNSUBSCRIBE}
          button={'alt'}
          requiresAuth={IS_WEB}
          label={label}
          title={titlePrefix}
          href={isEmbed && `${PAGES.AUTH_SIGNIN}?redirect=${encodeURIComponent(formatLbryUrlForWeb(uri))}`}
          onClick={
            !isEmbed
              ? (e) => {
                  e.stopPropagation();

                  subscriptionHandler(
                    {
                      channelName: '@' + rawChannelName,
                      uri: uri,
                      notificationsDisabled: true,
                    },
                    true
                  );
                }
              : undefined
          }
        />
      </div>
    );
  }

  return !preferEmbed && permanentUrl && claimName ? (
    <div className="button-group">
      <Button
        ref={buttonRef}
        iconColor="red"
        className={`button-following${isSubscribed ? ' button-following--active' : ''}`}
        icon={isSubscribed ? ICONS.SUBSCRIBED : ICONS.SUBSCRIBE}
        button={'alt'}
        requiresAuth={IS_WEB}
        label={label}
        title={titlePrefix}
        href={isEmbed && `/$/${PAGES.AUTH_SIGNIN}?redirect=${encodeURIComponent(formatLbryUrlForWeb(uri))}`}
        onClick={
          !isEmbed
            ? (e) => {
                e.stopPropagation();

                if (buttonRef.current) {
                  prevWidthRef.current = buttonRef.current.getBoundingClientRect().width;
                }

                if (!isSubscribed && buttonRef.current) {
                  // $FlowFixMe - WAAPI
                  buttonRef.current.animate(
                    [
                      { boxShadow: 'inset 0 0 0 999px transparent' },
                      { boxShadow: 'inset 0 0 0 999px #e9ea69', offset: 0.25 },
                      { boxShadow: 'inset 0 0 0 999px #db6a66', offset: 0.75 },
                      { boxShadow: 'inset 0 0 0 999px transparent' },
                    ],
                    { duration: 1000, easing: 'linear' }
                  );

                  const btn = buttonRef.current;
                  const group = btn ? btn.closest('.button-group') : null;
                  if (btn && group) {
                    group.style.position = 'relative';
                    group.querySelectorAll('.button-following__heart-particle').forEach((el) => el.remove());
                    const icon = btn.querySelector('.icon');
                    if (icon) {
                      const groupRect = group.getBoundingClientRect();
                      const iconRect = icon.getBoundingClientRect();
                      const cx = iconRect.left - groupRect.left + iconRect.width / 2;
                      const cy = iconRect.top - groupRect.top;
                      for (let i = 0; i < 5; i++) {
                        const heart = document.createElement('span');
                        heart.textContent = '\u2764';
                        heart.className = 'button-following__heart-particle';
                        heart.style.left = cx + (Math.random() * 20 - 10) + 'px';
                        heart.style.top = cy + 'px';
                        heart.style.animationDelay = Math.random() * 0.3 + 's';
                        heart.style.fontSize = 12 + Math.random() * 10 + 'px';
                        group.appendChild(heart);
                      }
                    }
                  }
                }

                subscriptionHandler(
                  {
                    channelName: claimName,
                    uri: permanentUrl,
                    notificationsDisabled: true,
                  },
                  true
                );
              }
            : undefined
        }
      >
        {isSubscribed && uiNotificationsEnabled && (
          <span
            className="button-following__bell"
            role="button"
            tabIndex={0}
            aria-label={notificationsDisabled ? __('Turn on notifications') : __('Turn off notifications')}
            onClick={(e) => {
              e.stopPropagation();
              const bell = e.currentTarget;
              bell.classList.add('button-following__bell--ringing');
              bell.addEventListener('animationend', () => bell.classList.remove('button-following__bell--ringing'), {
                once: true,
              });
              const newNotificationsDisabled = !notificationsDisabled;

              doChannelSubscribe(
                {
                  channelName: claimName,
                  uri: permanentUrl,
                  notificationsDisabled: newNotificationsDisabled,
                },
                false
              );

              doToast({
                message: __(
                  newNotificationsDisabled
                    ? 'Notifications turned off for %channel%'
                    : 'Notifications turned on for %channel%!',
                  { channel: claimName }
                ),
              });

              if (!newNotificationsDisabled && pushSupported && !pushEnabled) {
                pushRequest();
              }
            }}
          >
            <Icon icon={notificationsDisabled ? ICONS.BELL : ICONS.BELL_ON} size={16} />
          </span>
        )}
      </Button>
      {pushErrorModal()}
    </div>
  ) : null;
}
