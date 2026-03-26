/**
 * Module declarations for packages without types
 * or that are stubbed out in the web build.
 */

declare module 'electron' {
  export const ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void;
    once: (channel: string, listener: (...args: any[]) => void) => void;
    send: (channel: string, ...args: any[]) => void;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
  export const remote: {
    require: (module: string) => any;
    dialog: {
      showOpenDialog: (options: any) => Promise<{ filePaths: string[]; canceled: boolean }>;
      showSaveDialog: (options: any) => Promise<{ filePath?: string; canceled: boolean }>;
    };
    app: {
      getPath: (name: string) => string;
      getAppPath: () => string;
      getVersion: () => string;
      getLocale: () => string;
      dock?: {
        setBadge: (text: string) => void;
        getBadge: () => string;
        bounce: (type?: string) => number;
      };
    };
    getCurrentWindow: () => any;
    shell: {
      openExternal: (url: string) => Promise<void>;
      openPath: (path: string) => Promise<string>;
    };
    process: NodeJS.Process;
  };
  export const shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<string>;
  };
  export const clipboard: {
    writeText: (text: string) => void;
    readText: () => string;
  };
}

declare module 'electron-is-dev' {
  const isDev: boolean;
  export default isDev;
}

declare module 'homepages/odysee-en' {
  const content: any;
  export default content;
}

declare module 'web/setup/publish' {
  export function doPublishShared(params: any): any;
  export default any;
}
