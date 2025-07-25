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
      // Block for everyone if locale wasn't fetched
      if (Object.keys(locale).length === 0) {
        return {
          id: '',
          trigger: '',
          reason: '',
          message: "Couldn't fetch legally required location data to access this content, please try again later or reach out to hello@odysee.com if the issue continues.",
        };
      }

      const specials = geoConfig.specials || [];
      const countries = geoConfig.countries || [];
      const continents = geoConfig.continents || [];

      return (
        specials.find((x: GeoRestriction) => x.id === 'EU-ONLY' && locale.is_eu_member) ||
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
