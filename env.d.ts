/// <reference types="vite/client" />

declare const IS_WEB: boolean;
declare const __static: string;
declare const WEBPACK_PORT: number;
declare function __(msg: string, ...args: any[]): string;
declare function assert(condition: any, message?: string): asserts condition;

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

declare module 'libarchive.js/main.js' {
  export const Archive: {
    init: (options?: { workerUrl?: string }) => unknown;
    open: (file: File, options?: object | null) => Promise<any>;
  };
}
