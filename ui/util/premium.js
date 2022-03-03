// @flow

export function getBadgeToShow(membership?: string) {
  if (membership === 'Premium') {
    return 'silver';
  } else if (membership === 'Premium+') {
    return 'gold';
  }
}
