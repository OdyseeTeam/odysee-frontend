declare type HomepageObject = {
  icon: string,
  link: string,
  options: any,
  route: string,
  title: string,
};

declare type HomepageData = {
  [string]: HomepageObject,
  default: any => any,
};

declare type RowDataItem = {
  id: string,
  title: any,
  link?: string,
  help?: any,
  icon?: string,
  extra?: any,
  pinnedUrls?: Array<string>,
  pinnedClaimIds?: Array<string>, // takes precedence over pinnedUrls
  options?: {
    channelIds?: Array<string>,
    limitClaimsPerChannel?: number,
    pageSize?: number,
  },
  route?: string,
  hideForUnauth?: boolean,
};
