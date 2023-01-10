window.beforeUnloadMap = window.beforeUnloadMap || {};

export const Unload = {
  register: (cb) => {
    console.log('register unload');
    window.addEventListener('unload', cb);
  },

  unregister: (cb) => {
    console.log('unregister unload');
    window.removeEventListener('unload', cb);
  },
};

export const BeforeUnload = {
  register: (cb, msg) => {
    console.log('register beforeunload');
    window.addEventListener('beforeunload', cb);
    window.beforeUnloadMap[cb] = { cb, msg };
  },

  unregister: (cb) => {
    console.log('unregister beforeunload');
    window.removeEventListener('beforeunload', cb);
    delete window.beforeUnloadMap[cb];
  },
};
