// @flow
import { generateShareUrl, generateShortShareUrl } from 'util/url';

export type ShareUrlProps = {
  domain: string,
  lbryURI: string,
  referralCode: string,
  startTimeSeconds: number | null,
  collectionId: ?number,
  uriAccessKey: ?UriAccessKey,
  useShortUrl: boolean,
};

export type ShareUrl = {
  url: string,
};

export function doGenerateShareUrl(props: ShareUrlProps) {
  return async (dispatch: Dispatch, getState: GetState): Promise<ShareUrl> => {
    const { domain, lbryURI, referralCode, startTimeSeconds, collectionId, uriAccessKey, useShortUrl } = props;
    let url;

    if (useShortUrl && uriAccessKey) {
      url = await generateShortShareUrl(
        domain,
        lbryURI,
        referralCode,
        Boolean(referralCode),
        Boolean(startTimeSeconds),
        startTimeSeconds,
        collectionId
      );
    } else {
      url = generateShareUrl(
        domain,
        lbryURI,
        referralCode,
        Boolean(referralCode),
        Boolean(startTimeSeconds),
        startTimeSeconds,
        collectionId
      );
    }

    return { url };
  };
}
