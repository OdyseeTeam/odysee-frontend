// Web stubs for electron — provides no-op implementations for web builds

import { DEFAULT_LANGUAGE } from 'config';

const noop = () => {};

export const remote = {
  dialog: {
    showOpenDialog: noop,
  },
  getCurrentWindow: () => ({
    inspectElement: noop,
  }),
  app: {
    getAppPath: () => '',
    getLocale: () => DEFAULT_LANGUAGE,
    getPath: () => '',
  },
  BrowserWindow: {
    getFocusedWindow: noop,
  },
  Menu: {
    getApplicationMenu: noop,
    buildFromTemplate: () => ({
      popup: noop,
    }),
  },
  require: noop,
};

export const clipboard = {
  readText: () => '',
  writeText: (text: string) => {
    navigator.clipboard?.writeText(text);
  },
};

export const ipcRenderer = {
  on: noop,
  send: noop,
  removeListener: noop,
};

export const shell = {
  openExternal: noop,
  openPath: noop,
  showItemInFolder: noop,
};

export const webFrame = {
  getZoomFactor: () => 1.0,
  setZoomFactor: noop,
};

export const isDev = false;
