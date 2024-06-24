// @flow
import { getChannelIdFromClaim, isChannelClaim, isStreamPlaceholderClaim } from 'util/claim';

/**
 * Returns the geo restriction for the given claim.
 *
 * @param claim
 * @param locale
 * @param geoBlockLists
 * @returns {undefined|null|GeoConfig} undefined = pending fetch; null = no restrictions; GeoConfig = blocked reason
 */
export function getGeoRestrictionForClaim(claim: ?StreamClaim, locale: LocaleInfo, geoBlockLists: ?GBL) {
  if (locale && geoBlockLists && claim) {
    const claimId: ?string = claim.claim_id;
    const channelId: ?string = getChannelIdFromClaim(claim);
    let geoConfig: ?GeoConfig;

    // --- livestreams
    if (isStreamPlaceholderClaim(claim) && geoBlockLists.livestreams) {
      // $FlowIgnore: null key is fine
      geoConfig = geoBlockLists.livestreams[channelId] || geoBlockLists.livestreams[claimId];
    }
    // --- videos (actually, everything else)
    else if (geoBlockLists.videos) {
      if (isChannelClaim(claim)) {
        // $FlowIgnore: null key is fine
        geoConfig = geoBlockLists.videos[channelId];
      } else {
        // $FlowIgnore: null key is fine
        geoConfig = geoBlockLists.videos[claimId] || geoBlockLists.videos[channelId];
      }
    }

    if (geoConfig) {
      const specials = geoConfig.specials || [];
      const countries = geoConfig.countries || [];
      const continents = geoConfig.continents || [];

      return (
        specials.find((x: GeoRestriction) => (x.id === 'EU-ONLY' || x.id === 'EU-GOOGLE') && locale.is_eu_member) ||
        specials.find((x: GeoRestriction) => window.cordova && window.odysee.build.googlePlay && x.id === 'GOOGLE') ||
        countries.find((x: GeoRestriction) => x.id === locale.country) ||
        continents.find((x: GeoRestriction) => x.id === locale.continent) ||
        null
      );
    }
    return null;
  } else {
    return undefined;
  }
}
