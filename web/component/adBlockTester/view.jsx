// @flow
import React from 'react';

type Props = {
  doSetAdBlockerFound: (boolean) => void,
};

function AdBlockTester(props: Props) {
  const { doSetAdBlockerFound } = props;

  React.useEffect(() => {
    DetectAdblock((res) => {
      if (res) doSetAdBlockerFound(true);
      else doSetAdBlockerFound(false);
    });
  }, [doSetAdBlockerFound]);

  return null;
}

export default AdBlockTester;

const is_connected = () => {
  return window.navigator.onLine;
};

const fairAdblockRequest = () => {
  let fairAdblockStyle = document.getElementById('stndz-style');
  return fairAdblockStyle !== null;
};

export const DetectByGoogleAd = (callback: (enable: boolean) => void) => {
  let head = document.getElementsByTagName('head')[0];
  let script = document.createElement('script');
  let done = false;
  let windowElement;

  if (!is_connected()) {
    callback(false);
    return;
  }

  const reqURL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
  script.setAttribute('src', reqURL);
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('charset', 'utf-8');

  let alreadyDetectedByAdd = false;
  script.onload = () => {
    if (!done) {
      done = true;
      script.onload = null;

      if (windowElement?.adsbygoogle === 'undefined') {
        callback(true);
        alreadyDetectedByAdd = true;
      }
      // $FlowIgnore
      script.parentNode?.removeChild(script);
    }
  };

  script.onerror = function () {
    callback(true);
  };

  if (alreadyDetectedByAdd) {
    return;
  }

  let callbacked = false;
  const request = new XMLHttpRequest();
  request.open('GET', reqURL, true);
  request.onreadystatechange = () => {
    if (request.status === 0 || (request.status >= 200 && request.status < 400)) {
      if (
        request.responseText.toLowerCase().indexOf('ublock') > -1 ||
        request.responseText.toLowerCase().indexOf('height:1px') > -1
      ) {
        if (callbacked) {
          callback(true);
          return;
        }
        callbacked = true;
      }
    }

    if (!callbacked) {
      callback(request.responseURL !== reqURL);
    }
  };

  request.send();
  head.insertBefore(script, head.firstChild);
};

const DetectAdblock = (callback: (enable: boolean) => void) => {
  if (fairAdblockRequest()) {
    callback(true);
  } else {
    DetectByGoogleAd(function (blocked) {
      if (blocked) {
        callback(true);
      } else {
        callback(false);
      }
    });
  }
};
