import { filterYouTubeMirrors } from 'util/claim';

const MOBILE_OR_SMALL_TILE_LIMIT = 6;
const MEDIUM_TILE_LIMIT = 8;
const LARGE_TILE_LIMIT = 12;

export function getLivestreamTileLimit(isMobile: boolean, isSmallScreen: boolean, isLargeScreen: boolean) {
  if (isMobile || isSmallScreen) return MOBILE_OR_SMALL_TILE_LIMIT;
  if (isLargeScreen) return LARGE_TILE_LIMIT;
  return MEDIUM_TILE_LIMIT;
}

export function getLivestreamSectionUris(
  activeLivestreamUris: Array<string> | null | undefined,
  claimsByUri: Record<string, Claim | null | undefined>,
  hideYouTubeMirrors: boolean,
  tileLimit: number,
  expanded: boolean
) {
  if (!activeLivestreamUris) {
    return {
      allUris: activeLivestreamUris,
      visibleUris: activeLivestreamUris,
    };
  }

  const allUris = filterYouTubeMirrors(activeLivestreamUris, claimsByUri, hideYouTubeMirrors);

  return {
    allUris,
    visibleUris: expanded ? allUris : allUris.slice(0, tileLimit),
  };
}
