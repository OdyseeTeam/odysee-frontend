// @flow

declare type CreateShortUrlBody = {|
  longUrl: string, // The original long URL
  deviceLongUrls?: {
    android: string, // The long URL to redirect to when the short URL is visited from a device running Android
    ios: string, // The long URL to redirect to when the short URL is visited from a device running iOS
    desktop: string, // The long URL to redirect to when the short URL is visited from a desktop browser
  },
  customSlug?: string, // A unique custom slug to be used instead of the generated short code
  findIfExists?: boolean, // Will force existing matching URL to be returned if found, instead of creating a new one,
  domain?: string, // The domain to which the short URL will be attached
  shortCodeLength?: number, // The length for generated short code. It has to be at least 4 and defaults to 5. It will be ignored when customSlug is provided
|};

declare type ShortUrlResponse = {|
  shortCode: string, // The short code for this short URL.
  shortUrl: string, // The short URL.
  longUrl: string, // The original long URL
  deviceLongUrls: {
    android: string, // The long URL to redirect to when the short URL is visited from a device running Android
    ios: string, // The long URL to redirect to when the short URL is visited from a device running iOS
    desktop: string, // The long URL to redirect to when the short URL is visited from a desktop browser
  },
  dateCreated: any, // The date in which the short URL was created in ISO format.
  visitsSummary: {
    total: number, // The total amount of visits.
    nonBots: number, // The amount of visits which were not identified as bots.
    bots: number, // The amount of visits that were identified as potential bots.
  },
  tags: Array<string>, // A list of tags applied to this short URL
  meta: {
    validSince: ?string, // The date (in ISO-8601 format) from which this short code will be valid
    validUntil: ?string, // The date (in ISO-8601 format) until which this short code will be valid
    maxVisits: ?string, // The maximum number of allowed visits for this short code
  },
  domain: ?string, // The domain in which the short URL was created. Null if it belongs to default domain.
  title: ?string, // A descriptive title of the short URL.
  crawlable: boolean, // Tells if this URL will be included as 'Allow' in Shlink's robots.txt.
  forwardQuery: boolean, // Tells if this URL will forward the query params to the long URL when visited, as explained in [the docs](https://shlink.io/documentation/some-features/#query-params-forwarding).
|};
