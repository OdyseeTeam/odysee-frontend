// @if TARGET='app'
import AutoLaunch from 'auto-launch';

export const launcher = new AutoLaunch({
  name: 'lbry',
  isHidden: true
}); // @endif

// Web stub - autoLaunch is only used in the Electron app
// @if TARGET='web'
export const launcher: any = null;
// @endif
