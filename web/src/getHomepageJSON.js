const path = require('path');
const memo = {};

const FORMAT = { ROKU: 'roku' };

const loadAnnouncements = (homepageKeys) => {
  const fs = require('fs');
  const announcements = {};

  homepageKeys.forEach((key) => {
    const file = path.join(__dirname, `../dist/announcement/${key.toLowerCase()}.md`);
    let announcement;
    try {
      announcement = fs.readFileSync(file, 'utf8');
    } catch {}
    announcements[key] = announcement ? announcement.trim() : '';
  });

  return announcements;
};

// this didn't seem to help.
if (!memo.homepageData) {
  if (process.env.CUSTOM_HOMEPAGE === 'true') {
    try {
      memo.homepageData = require('../../custom/homepages/v2');
      memo.announcements = loadAnnouncements(Object.keys(memo.homepageData));
    } catch (err) {
      console.log('getHomepageJSON:', err); // eslint-disable-line no-console
    }
  }
}

// ****************************************************************************
// v1
// ****************************************************************************

const getHomepageJsonV1 = () => {
  if (!memo.homepageData) {
    return {};
  }

  const v1 = {};
  const homepageKeys = Object.keys(memo.homepageData);
  homepageKeys.forEach((hp) => {
    v1[hp] = memo.homepageData[hp].categories;
  });
  return v1;
};

// ****************************************************************************
// v2
// ****************************************************************************

const reformatV2Categories = (categories, format) => {
  if (format === FORMAT.ROKU) {
    return categories && Object.entries(categories).map(([key, value]) => value);
  } else {
    return categories;
  }
};

/**
 * getHomepageJsonV2
 *
 * @param format [?string] Request for custom format. See FORMAT above.
 * @param lang [?string] Only populates data for the requested homepage.
 *             NOTE: the key for all supported languages will still be created
 *             (for apps to define dropdown lists), just that the value is left
 *             empty.
 * @returns {{}}
 */
const getHomepageJsonV2 = (format, lang) => {
  if (!memo.homepageData) {
    return {};
  }

  const v2 = {};
  const homepageKeys = Object.keys(memo.homepageData);

  homepageKeys.forEach((hp) => {
    if (!lang || lang === hp) {
      v2[hp] = {
        categories: reformatV2Categories(memo.homepageData[hp].categories, format),
        portals: memo.homepageData[hp].portals,
        featured: memo.homepageData[hp].featured,
        meme: memo.homepageData[hp].meme,
        discover: memo.homepageData[hp].discover,
        discoverNew: memo.homepageData[hp]?.discoverNew,
        announcement: memo.announcements[hp],
      };
    } else {
      v2[hp] = null;
    }
  });

  return v2;
};

module.exports = { getHomepageJsonV1, getHomepageJsonV2 };
