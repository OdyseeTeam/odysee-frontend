// @flow

/*
  Toasts:
    - First-in, first-out queue
    - Simple messages that are shown in response to user interactions
    - Never saved
    - If they are the result of errors, use the isError flag when creating
    - For errors that should interrupt user behavior, use Error
*/
declare type ToastParams = {
  message: string,
  subMessage?: string,
  // title?: string,
  linkText?: string,
  linkTarget?: string,
  isError?: boolean,
  duration?: 'default' | 'long',
  actionText?: string,
  action?: () => void | any,
  secondaryActionText?: string,
  secondaryAction?: () => void,
};

declare type Toast = {
  id: string,
  params: ToastParams,
};

declare type DoToast = {
  type: 'CREATE_TOAST', // ACTIONS.CREATE_TOAST,
  data: Toast,
};

declare type DoDebugLog = {
  type: 'DEBUG_LOG',
  data: {
    info?: string | Error,
    append?: boolean, // clear-and-add if false
    clear?: boolean,
  };
};

/*
  Notifications:
    - List of notifications based on user interactions/app notifications
    - Always saved, but can be manually deleted
    - Can happen in the background, or because of user interaction (ex: publish confirmed)
*/
declare type Notification = {
  id: string, // Unique id
  dateCreated: number,
  isRead: boolean, // Used to display "new" notifications that a user hasn't seen yet
  source?: string, // The type/area an notification is from. Used for sorting (ex: publishes, transactions)
  // We may want to use priority/isDismissed in the future to specify how urgent a notification is
  // and if the user should see it immediately
  // isDissmied: boolean,
  // priority?: number
};

declare type DoNotification = {
  type: 'CREATE_NOTIFICATION', // ACTIONS.CREATE_NOTIFICATION,
  data: Notification,
};

declare type DoEditNotification = {
  type: 'EDIT_NOTIFICATION', // ACTIONS.EDIT_NOTIFICATION,
  data: {
    notification: Notification,
  },
};

declare type DoDeleteNotification = {
  type: 'DELETE_NOTIFICATION', // ACTIONS.DELETE_NOTIFICATION,
  data: {
    id: string, // The id to delete
  },
};

/*
  Errors:
    - First-in, first-out queue
    - Errors that should interupt user behavior
    - For errors that can be shown without interrupting a user, use Toast with the isError flag
*/
declare type ErrorNotification = {
  title: string,
  text: string,
};

declare type DoError = {
  type: 'CREATE_ERROR', // ACTIONS.CREATE_ERROR,
  data: ErrorNotification,
};

declare type DoDismissError = {
  type: 'DISMISS_ERROR', // ACTIONS.DISMISS_ERROR,
};

/*
  NotificationState
*/
declare type NotificationState = {
  notifications: Array<Notification>,
  notificationsFiltered: Array<Notification>,
  deletedNotificationIds: Array<number>,
  notificationCategories: any,
  fetchingNotifications: boolean,
  errors: Array<ErrorNotification>,
  toasts: Array<Toast>,
  nagIds: Array<string>,
  debugLog: Array<string | Error>,
};

declare type WebNotification = {
  active_at: string,
  created_at: string,
  id: number,
  is_app_readable: boolean,
  is_device_notified: boolean,
  is_emailed: boolean,
  is_read: boolean,
  is_seen: boolean,
  notification_parameters: {
    device: {
      analytics_label: string,
      image_url: string,
      is_data_only: boolean,
      name: string,
      placeholders: ?string,
      target: string,
      text: string,
      title: string,
      type: string,
    },
    dynamic: {
      comment_author: string,
      comment_author_thumbnail?: string,
      reply_author: string,
      hash: string,
      claim_title: string,
      claim_thumbnail?: string,
      comment?: string,
      channel_url: string,
      channel_thumbnail?: string,
    },
    email: {},
  },
  notification_rule: string,
  type: string,
  updated_at: string,
  user_id: number,
  group_count?: number,
};

declare type NotificationCategory = {
  name: string,
  types: ?Array<string>,
};
