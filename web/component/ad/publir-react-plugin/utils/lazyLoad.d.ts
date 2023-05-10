import { LazyLoad, Config } from '../models/config';
export declare const getLazyLoad: (config: Config, id: string) => LazyLoad | boolean;
export declare const isLazyLoadConfigured: (lazyLoad: LazyLoad | boolean) => boolean;
export declare const getRootMargin: (config: LazyLoad | boolean) => string | undefined;
