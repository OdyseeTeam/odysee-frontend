import { Config } from '../models/config';
import { Cookies } from '../models/enableSubscriptions';
export declare const useSubscriptions: (config: Config | undefined, publisherId: string, cookies: Cookies) => {
    isSubscriptionEnabled: boolean;
};
