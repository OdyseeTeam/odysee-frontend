import type React from 'react';

export function isInteractiveNotificationClick(event: React.MouseEvent | React.KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest('a, button, input, select, textarea, [role="button"], [data-notification-ignore]'));
}
