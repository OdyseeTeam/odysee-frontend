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
  urlNoReferral: string,
};

export function doGenerateShareUrl(props: ShareUrlProps) {
  return async (dispatch: Dispatch, getState: GetState): Promise<ShareUrl> => {
    const { domain, lbryURI, referralCode, startTimeSeconds, collectionId, uriAccessKey, useShortUrl } = props;
    let url, urlNoReferral;

    if (useShortUrl && uriAccessKey) {
      url = await generateShortShareUrl(
        domain,
        lbryURI,
        referralCode,
        Boolean(referralCode),
        Boolean(startTimeSeconds),
        startTimeSeconds,
        collectionId,
        uriAccessKey
      );

      urlNoReferral = await generateShortShareUrl(
        domain,
        lbryURI,
        null,
        false,
        Boolean(startTimeSeconds),
        startTimeSeconds,
        collectionId,
        uriAccessKey
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

      urlNoReferral = generateShareUrl(
        domain,
        lbryURI,
        null,
        false,
        Boolean(startTimeSeconds),
        startTimeSeconds,
        collectionId
      );
    }

    return { url, urlNoReferral };
  };
}
