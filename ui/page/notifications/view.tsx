import Icon from 'component/common/icon';
import * as ICONS from 'constants/icons';
import React from 'react';
import Page from 'component/page';
import Spinner from 'component/spinner';
import { FormField } from 'component/common/form';
import Notification from 'component/notification';
import Button from 'component/button';
import usePersistedState from 'effects/use-persisted-state';
import Yrbl from 'component/yrbl';
import * as NOTIFICATIONS from 'constants/notifications';
import useFetched from 'effects/use-fetched';
import { RULE } from 'constants/notifications';
import BrowserNotificationBanner from '$web/component/browserNotificationBanner';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  selectNotifications,
  selectNotificationsFiltered,
  selectIsFetchingNotifications,
  selectUnreadNotificationCount,
  selectUnseenNotificationCount,
  selectNotificationCategories,
} from 'redux/selectors/notifications';
import { doCommentReactList } from 'redux/actions/comments';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import {
  doReadNotifications,
  doNotificationList,
  doSeeAllNotifications,
  doNotificationCategories,
} from 'redux/actions/notifications';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const notificationsFiltered = useAppSelector(selectNotificationsFiltered);
  const notificationCategories = useAppSelector(selectNotificationCategories);
  const fetching = useAppSelector(selectIsFetchingNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const unseenCount = useAppSelector(selectUnseenNotificationCount);
  const activeChannel = useAppSelector(selectActiveChannelClaim);
  const [name, setName] = usePersistedState('notifications--rule', NOTIFICATIONS.NOTIFICATION_NAME_ALL);
  const isFiltered = name !== NOTIFICATIONS.NOTIFICATION_NAME_ALL;
  const list = isFiltered ? notificationsFiltered : notifications;
  const fetchedOnce = useFetched(fetching);
  const categoriesReady = notificationCategories;
  const notificationsReady = !isFiltered || fetchedOnce;
  const ready = categoriesReady && notificationsReady;
  // Fetch reacts
  React.useEffect(() => {
    if (ready && !fetching && activeChannel) {
      let idsForReactionFetch = [];
      list.map((notification) => {
        const { notification_rule, notification_parameters } = notification;
        const isComment =
          notification_rule === RULE.COMMENT ||
          notification_rule === RULE.COMMENT_REPLY ||
          notification_rule === RULE.CREATOR_COMMENT;
        const commentId =
          isComment &&
          notification_parameters &&
          notification_parameters.dynamic &&
          notification_parameters.dynamic.hash;

        if (commentId) {
          idsForReactionFetch.push(commentId);
        }
      });

      if (idsForReactionFetch.length !== 0) {
        dispatch(doCommentReactList(idsForReactionFetch));
      }
    }
  }, [ready, dispatch, list, activeChannel, fetching]);
  // Mark all as seen
  React.useEffect(() => {
    if (unseenCount > 0) {
      dispatch(doSeeAllNotifications());
    }
  }, [unseenCount, dispatch]);
  const stringifiedNotificationCategories = notificationCategories ? JSON.stringify(notificationCategories) : '';
  // Fetch filtered notifications
  React.useEffect(() => {
    if (stringifiedNotificationCategories) {
      const arrayNotificationCategories = JSON.parse(stringifiedNotificationCategories);

      if (name !== NOTIFICATIONS.NOTIFICATION_NAME_ALL) {
        try {
          const matchingCategory = arrayNotificationCategories.find((category) => category.name === name);

          if (matchingCategory) {
            dispatch(doNotificationList(matchingCategory.types, false));
          }
        } catch (e) {
          console.error(e); // eslint-disable-line no-console
        }
      }
    }
  }, [name, stringifiedNotificationCategories, dispatch]);
  React.useEffect(() => {
    if (!notificationCategories) {
      dispatch(doNotificationCategories());
    }
  }, []);
  // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Page className="notification-page">
      <BrowserNotificationBanner />

      {ready && (
        <div className="claim-list__header">
          <h1 className="page__title">
            <Icon icon={ICONS.NOTIFICATION} />
            <label>{__('Notifications')}</label>
          </h1>
          <div className="claim-list__alt-controls--wrap">
            {fetching && <Spinner type="small" delayed />}

            {unreadCount > 0 && (
              <Button
                icon={ICONS.EYE}
                onClick={() => dispatch(doReadNotifications())}
                button="secondary"
                label={__('Mark all as read')}
              />
            )}

            {notificationCategories && (
              <FormField type="select" name="filter" value={name} onChange={(e) => setName(e.target.value)}>
                {notificationCategories.map((category) => {
                  return (
                    <option key={category.name} value={category.name}>
                      {__(category.name)}
                    </option>
                  );
                })}
              </FormField>
            )}
          </div>
        </div>
      )}

      {!ready ? (
        <div className="main--empty">
          <Spinner />
        </div>
      ) : list && list.length > 0 && !(isFiltered && fetching) ? (
        <div className="card">
          <div className="notification_list">
            {list.map((notification) => {
              return <Notification key={notification.id} notification={notification} />;
            })}
          </div>
        </div>
      ) : (
        <div className="main--empty">
          {!fetching && (
            <Yrbl
              title={__('No notifications')}
              subtitle={
                isFiltered
                  ? __('Try selecting another filter.')
                  : __("You don't have any notifications yet, but they will be here when you do!")
              }
              actions={
                <div className="section__actions">
                  <Button button="primary" icon={ICONS.HOME} label={__('Go Home')} navigate="/" />
                </div>
              }
            />
          )}
        </div>
      )}
    </Page>
  );
}
