declare type Parameters = {
    publir_page_url: string;
    site_id: string;
};
declare const _default: {
    useTrackPageView: (parameters: Parameters, enabled: boolean) => import("react-query").UseQueryResult<void, Error>;
};
export default _default;
