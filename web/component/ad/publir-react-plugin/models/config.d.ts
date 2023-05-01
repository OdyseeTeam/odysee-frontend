import { Bid, MediaTypes } from './pbjs';
interface Slot {
    path: string;
    id: string;
    mediaTypes: MediaTypes;
    bids: Bid[];
    collapseEmptyDiv?: CollapseEmptyDiv;
    lazyLoad?: LazyLoad | boolean;
    autoRefresh?: number;
}
declare type CollapseEmptyDiv = boolean[];
interface LazyLoad {
    marginPercent: number;
    mobileScaling: number;
}
interface Config {
    config: {
        gam: boolean;
        slots: Slot[];
        lazyLoad?: LazyLoad | boolean;
        enableSubscriptions?: boolean;
        trackClicks?: boolean;
        prebidConfig: {
            [key: string]: unknown;
        };
        trackPageviews?: boolean;
    };
}
export type { Config, Slot, LazyLoad, CollapseEmptyDiv };
