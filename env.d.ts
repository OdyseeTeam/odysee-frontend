/// <reference types="node" />
/// <reference types="vite/client" />

declare const IS_WEB: boolean;
declare const __static: string;
declare const WEBPACK_PORT: number;
declare const module: { exports: any };
declare function __(msg: string, ...args: any[]): string;
declare function assert(condition: any, message?: string, data?: any): asserts condition;

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

declare module 'homepages' {
  export const en: any;
  const homepages: any;
  export default homepages;
}
