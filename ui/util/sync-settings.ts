import * as DAEMON_SETTINGS from 'constants/daemon_settings';
import isEqual from 'util/deep-equal';
export function stringifyServerParam(configList: [string, string][]): string[] {
  return configList.reduce((acc: string[], cur: [string, string]) => {
    acc.push(`${cur[0]}:${cur[1]}`);
    return acc;
  }, []);
}
export const getSubsetFromKeysArray = (obj: Record<string, unknown>, keys: string[]): Record<string, unknown> =>
  Object.keys(obj)
    .filter((i) => keys.includes(i))
    .reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = obj[key];
      return acc;
    }, {});
export const shouldSetSetting = (key: string, val: unknown, current: unknown): boolean => {
  switch (key) {
    case DAEMON_SETTINGS.LBRYUM_SERVERS:
      return val !== null && Array.isArray(val) && val.length && !isEqual(val, current);

    default:
      return !isEqual(val, current);
  }
};
