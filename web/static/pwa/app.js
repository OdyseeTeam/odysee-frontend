let userAgent = navigator.userAgent || navigator.vendor || window.opera;
// If Mobile
if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)) {
  let appPromptWrapper = getPrompt();

  // If Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    let deferredPrompt = e;

    appPromptWrapper.addEventListener('click', (e) => {
      appPromptWrapper.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
    });
  });

  // If other browser
  if (!/chrome/i.test(userAgent)) {
    appPromptWrapper.addEventListener('click', (e) => {
      let url = '';
      if (/android/i.test(userAgent)) {
        url = 'https://play.google.com/store/apps/details?id=com.odysee.app';
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        url = 'https://itunes.apple.com/app/odysee/id1539444143';
      }
      window.open(url);
    });
  }
}

function getPrompt() {
  let appPromptWrapper;
  if (!document.getElementsByClassName('app-promt-wrapper').length) {
    appPromptWrapper = document.createElement('div');
    appPromptWrapper.classList.add('app-promt-wrapper');
    appPromptWrapper.style.display = 'block';
    let icon = document.createElement('img');
    icon.classList.add('icon');
    icon.src = '/public/pwa/icon-180.png';
    let label = document.createElement('span');
    label.innerHTML = 'Odysee App';
    let store = document.createElement('div');
    let storeIcon = document.createElement('img');
    store.classList.add('store');
    if (/android/i.test(userAgent)) storeIcon.src = '/public/img/google-play.png';
    else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) storeIcon.src = '/public/img/apple.png';
    store.appendChild(storeIcon);
    appPromptWrapper.appendChild(icon);
    appPromptWrapper.appendChild(label);
    appPromptWrapper.appendChild(store);
    document.body.appendChild(appPromptWrapper);
  } else {
    appPromptWrapper = document.getElementsByClassName('app-promt-wrapper')[0];
  }
  return appPromptWrapper;
}
