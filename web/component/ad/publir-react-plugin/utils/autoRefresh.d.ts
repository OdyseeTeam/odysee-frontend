import { Config } from '../models/config';
export declare const getAutoRefreshRate: (configData: Config, id: string) => number;
export declare const startAutoRefresh: (id: string, isInView: boolean, autoRefreshRate: number, lazyLoadConfigured: boolean, processAd: Function) => (() => void) | undefined;
