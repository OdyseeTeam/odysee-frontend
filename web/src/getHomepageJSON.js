const fs = require('fs');
const os = require('os');
const path = require('path');

const memo = {};
const FORMAT = {
  ROKU: 'roku',
};

function walkFiles(dir, handler) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, handler);
      return;
    }

    handler(fullPath);
  });
}

function normalizeHomepageDir(dir) {
  walkFiles(dir, (fullPath) => {
    if (fullPath.endsWith('.js')) {
      fs.renameSync(fullPath, fullPath.replace(/\.js$/, '.cjs'));
    }
  });

  walkFiles(dir, (fullPath) => {
    if (fullPath.endsWith('.cjs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const fixed = content.replace(/require\((['"])(.+?)\.js\1\)/g, 'require($1$2.cjs$1)');

      if (fixed !== content) {
        fs.writeFileSync(fullPath, fixed);
      }
    }
  });
}

function getHomepageSourceDir() {
  return process.env.CUSTOM_HOMEPAGE_DIR || path.resolve(__dirname, '../../custom/homepages/v2');
}

function getPreparedHomepageDir() {
  if (memo.preparedHomepageDir && fs.existsSync(memo.preparedHomepageDir)) {
    return memo.preparedHomepageDir;
  }

  const sourceDir = getHomepageSourceDir();
  if (!fs.existsSync(sourceDir)) {
    return null;
  }

  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'odysee-homepages-'));
  fs.cpSync(sourceDir, runtimeDir, { recursive: true });
  normalizeHomepageDir(runtimeDir);
  memo.preparedHomepageDir = runtimeDir;
  return memo.preparedHomepageDir;
}

const loadAnnouncements = (homepageKeys) => {
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

function loadHomepageData() {
  if (process.env.CUSTOM_HOMEPAGE !== 'true' || memo.homepageData) {
    return;
  }

  try {
    const preparedDir = getPreparedHomepageDir();
    const customPath = preparedDir && path.join(preparedDir, 'index.cjs');

    if (!customPath) {
      throw new Error(`Custom homepage directory not found at ${getHomepageSourceDir()}`);
    }

    memo.homepageData = require(customPath);
    memo.announcements = loadAnnouncements(Object.keys(memo.homepageData));
    memo.lastLoadError = undefined;
  } catch (err) {
    const message = err && err.stack ? err.stack : String(err);

    if (memo.lastLoadError !== message) {
      memo.lastLoadError = message;
      console.log('getHomepageJSON:', err); // eslint-disable-line no-console
    }
  }
}

// ****************************************************************************
// v1
// ****************************************************************************
const getHomepageJsonV1 = () => {
  loadHomepageData();

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
  loadHomepageData();

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
        meme_android: memo.homepageData[hp].meme_android,
        meme_android_apk: memo.homepageData[hp].meme_android_apk,
        meme_android_google: memo.homepageData[hp].meme_android_google,
        discover: memo.homepageData[hp].discover,
        discoverNew: memo.homepageData[hp]?.discoverNew,
        customBanners: memo.homepageData[hp]?.customBanners,
        announcement: memo.announcements[hp],
      };
    } else {
      v2[hp] = null;
    }
  });
  return v2;
};

module.exports = {
  getHomepageJsonV1,
  getHomepageJsonV2,
};
