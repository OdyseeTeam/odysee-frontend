import React from 'react';
import { Config } from '../models/config';
export declare type Context = {
    data: Config | undefined;
    isLoading: boolean;
    isError: boolean;
    isPrebidSetup: boolean;
    isProviderSetup: boolean;
};
declare const AdsContext: React.Context<Context>;
declare const useAdsContext: () => Context;
export { AdsContext, useAdsContext };
