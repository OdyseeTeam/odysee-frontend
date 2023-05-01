export interface PrebidBidResponse extends Record<string, unknown> {
    bidder: string;
    adId: string;
    width: number;
    height: number;
    size: string;
    cpm: number;
    pbLg: string;
    pbMg: string;
    pbHg: string;
    pbAg: string;
    pbDg: string;
    pbCg: string;
    currency: string;
    netRevenue: boolean;
    requestTimestamp: number;
    responseTimestamp: number;
    timeToRespond: number;
    adUnitCode: string;
    creativeId: string;
    mediaType: 'banner' | 'native' | 'video';
    dealId?: string;
    adserverTargeting: Record<string, string>;
    native: Record<string, string>;
    status: 'targetingSet' | 'rendered';
    statusMessage: string;
    ttl: number;
    auctionId: string;
}
export interface AdserverTargeting {
    key: string;
    val: (bidResponse: PrebidBidResponse) => string;
}
export interface BidderSetting {
    adserverTargeting?: AdserverTargeting[];
    bidCpmAdjustment?: (bidCpm: number, bid: Bid) => number;
    sendStandardTargeting?: boolean;
    suppressEmptyKeys?: boolean;
    alwaysUseBid?: boolean;
}
export interface BidderSettings {
    standard?: BidderSetting;
    [bidderCode: string]: BidderSetting | undefined;
}
export interface Banner {
    sizes: number[][];
}
export interface MediaTypes {
    banner: Banner;
}
export interface Params {
    [key: string]: unknown;
}
export interface Bid {
    bidder: string;
    params: Params;
    ad?: string;
    adUnitCode?: string;
}
export interface PrebidAdUnit {
    code: string;
    labelAny?: string[];
    mediaTypes: MediaTypes;
    bids: Bid[];
    transactionId?: string;
}
interface PrebidAdUnitResponse {
    bids: PrebidBidResponse[];
}
export interface PrebidAuctionResponse {
    [adUnitId: string]: PrebidAdUnitResponse;
}
export declare type BidsBackCallback = (bidResponses: PrebidAuctionResponse, timedOut: boolean, auctionId: string) => void;
export declare type CustomSlotMatchingCallback = () => unknown;
export declare type BidRequestArguments = {
    adUnitCodes: string[];
    adUnits: PrebidAdUnit[];
    timeout: number;
    bidsBackHandler: BidsBackCallback;
    labels: string[];
    auctionId: string[];
};
export interface RegisterAnalyticsAdapterOptions {
    code: string;
    adapter: unknown;
}
export interface EnableAnalyticsOptions {
    provider: string;
    options: unknown;
}
export interface RenderAdOptions {
    clickThrough: string;
}
export declare type PrebidCommand = () => void;
export interface PrebidCommandQueue {
    push(cmd: PrebidCommand): void;
}
export interface AdRenderEvent {
    adId: string;
    bid: PrebidBidResponse;
    doc: Document;
}
interface PrebidEvent {
    args: PrebidEventArgs;
    eventType: string;
    id?: string;
}
interface PrebidEventArgs {
    auctionId: string;
    timestamp: string;
    auctionEnd?: string;
    adRenderSucceeded?: string;
}
export interface Prebid {
    que: PrebidCommandQueue & Array<PrebidCommand>;
    cmd: PrebidCommandQueue;
    bidderSettings: BidderSettings;
    libLoaded: boolean;
    version: string;
    adUnits: PrebidAdUnit[];
    initAdserverSet: boolean;
    getNoBids(): Bid;
    getAllWinningBids(): Bid[];
    getHighestCpmBids(adUnitCode?: string): PrebidBidResponse[];
    getEvents(): PrebidEvent[];
    onEvent(eventType: keyof PrebidEventArgs, handler: CallableFunction, id?: string): void;
    addAdUnits(adUnit: PrebidAdUnit | PrebidAdUnit[]): void;
    enableAnalytics(options: EnableAnalyticsOptions): void;
    registerAnalyticsAdapter(options: RegisterAnalyticsAdapterOptions): void;
    requestBids(requestBidsArgs?: Partial<BidRequestArguments>): void;
    removeAdUnit(adUnitCode: string | string[]): void;
    renderAd(doc: unknown, id: string, options?: RenderAdOptions): void;
    setTargetingForGPTAsync(codes?: string[], customSlotMatching?: CustomSlotMatchingCallback): void;
    setConfig(config: Record<string, string | unknown>): void;
}
export {};
