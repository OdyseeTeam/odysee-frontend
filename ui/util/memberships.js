// @flow
import { Lbryio } from 'lbryinc';

export const doMembershipClearData = async () =>
  // $FlowFixMe -- Cannot call location.reload because property reload is missing in Location
  await Lbryio.call('membership', 'clear', { environment: 'test' }, 'post').then(() => location.reload());
