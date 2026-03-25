import React from 'react';
export default function useGetThumbnail(
  uri: string,
  claim: Claim | null | undefined,
  streamingUrl: string | null | undefined,
  getFile: (arg0: string) => void,
  shouldHide: boolean
) {
  let thumbnailToUse;
  const claimValue = claim?.value as StreamMetadata | undefined;
  const isImage = claim && claimValue && claimValue.stream_type === 'image';
  const isFree = claim && claimValue && (!claimValue.fee || Number(claimValue.fee.amount) <= 0);
  const thumbnailInClaim = claim && claimValue && claimValue.thumbnail && claimValue.thumbnail.url;
  const repostSrcUri = claim && (claim as any).repost_url && claim.canonical_url;
  let shouldFetchFileInfo = false;

  if (thumbnailInClaim) {
    thumbnailToUse = thumbnailInClaim;
  } else if (claim && isImage && isFree) {
    if (streamingUrl) {
      thumbnailToUse = streamingUrl;
    } else if (!shouldHide) {
      shouldFetchFileInfo = true;
    }
  } else {
    thumbnailToUse = null;
  }

  const [thumbnail, setThumbnail] = React.useState(thumbnailToUse);
  React.useEffect(() => {
    if (shouldFetchFileInfo) {
      getFile(repostSrcUri || uri);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [shouldFetchFileInfo, repostSrcUri, uri]);
  React.useEffect(() => {
    setThumbnail(thumbnailToUse);
  }, [thumbnailToUse]);
  return thumbnail;
}
