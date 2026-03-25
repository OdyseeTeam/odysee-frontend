import { generateShareUrl, generateShortShareUrl } from 'util/url';
export type ShareUrlProps = {
  domain: string;
  lbryURI: string;
  referralCode: string;
  startTimeSeconds: number | null;
  collectionId: string | null | undefined;
  uriAccessKey: UriAccessKey | null | undefined;
  useShortUrl: boolean;
};
export type ShareUrl = {
  url: string;
  urlNoReferral: string;
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
        startTimeSeconds as number,
        collectionId as string | undefined,
        uriAccessKey
      );
      urlNoReferral = await generateShortShareUrl(
        domain,
        lbryURI,
        null as any,
        false,
        Boolean(startTimeSeconds),
        startTimeSeconds as number,
        collectionId as string | undefined,
        uriAccessKey
      );
    } else {
      url = generateShareUrl(
        domain,
        lbryURI,
        referralCode,
        Boolean(referralCode),
        Boolean(startTimeSeconds),
        startTimeSeconds as any,
        collectionId as any,
        undefined as any
      );
      urlNoReferral = generateShareUrl(
        domain,
        lbryURI,
        null as any,
        false,
        Boolean(startTimeSeconds),
        startTimeSeconds as any,
        collectionId as any,
        undefined as any
      );
    }

    return {
      url,
      urlNoReferral,
    };
  };
}
