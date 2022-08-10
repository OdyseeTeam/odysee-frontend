// @flow
import { Lbryio } from 'lbryinc';

export const doMembershipClearData = async () =>
  await Lbryio.call('membership', 'clear', { environment: 'test' }, 'post').then(() => location.reload());
