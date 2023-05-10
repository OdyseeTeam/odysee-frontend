declare type Parameters = {
    publir_page_url: string;
    site_id: string;
    adunit_id: string;
};
export declare const trackClick: (data: Parameters) => Promise<void>;
export {};
