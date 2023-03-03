// @flow

/**
 * Hook to post-process or customize the fetched homepage data.
 *
 * The only change for now is to point empty `portals` and `featured` to the
 * English version so that we don't have to repeatedly do that in selectors.
 * This assumes the rest of the app does not need to know if a particular
 * homepage have a blank `portals` or `featured`.
 *
 * @param oldDb
 * @returns The new db.
 */
export function postProcessHomepageDb(oldDb: ?HomepagesDb) {
  if (!oldDb || !oldDb['en']) {
    return oldDb;
  }

  const db = { ...oldDb };
  const homepagesToCheck = Object.keys(oldDb).filter((hp) => hp !== 'en');

  homepagesToCheck.forEach((hp) => {
    if (!db[hp].portals) {
      db[hp].portals = db['en'].portals;
    }

    if (!db[hp].featured) {
      db[hp].featured = db['en'].featured;
    }
  });

  return db;
}
