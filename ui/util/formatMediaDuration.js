// @flow

export default function formatMediaDuration(duration: number = 0) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  if (isNaN(seconds) || seconds === Infinity) {
    return '--:--';
  }

  if (hours > 0) {
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${formattedMinutes}:${formattedSeconds}`;
  }
}

// TODO: need a better file location:

export function getChannelSubCountStr(count: ?number, formattedCount?: ?string) {
  if (count === null || count === undefined) {
    return null;
  } else {
    return count === 1 ? __('1 follower') : __('%count% followers', { count: formattedCount || count });
  }
}

export function getChannelViewCountStr(count: number) {
  return count === 1 ? __('1 upload') : __('%count% uploads', { count });
}
