// Centralized bridges into the Cordova Android native layer.
// Each function no-ops on non-cordova runtimes.

export function openExternalUrl(url: string) {
  if (window.cordova && window.odysee?.functions?.initBrowser) {
    window.odysee.functions.initBrowser(url, 'external');
    return true;
  }
  return false;
}

export function openInAppUrl(url: string) {
  if (window.cordova && window.odysee?.functions?.history?.push) {
    window.odysee.functions.history.push(url);
    return true;
  }
  return false;
}

export function cordovaInsomnia(enable: boolean) {
  if (window.cordova && window.odysee?.functions?.insomnia) {
    window.odysee.functions.insomnia(enable);
  }
}

export function cordovaKillToken() {
  if (window.cordova && window.odysee?.functions?.killToken) {
    window.odysee.functions.killToken();
  }
}

export function isCordovaGooglePlay(): boolean {
  return Boolean(window.cordova && window.odysee?.build?.googlePlay);
}
