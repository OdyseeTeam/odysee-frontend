const {
  URL,
  SITE_NAME,
  FARCASTER_ACCOUNT_ASSOC_HEADER,
  FARCASTER_ACCOUNT_ASSOC_PAYLOAD,
  FARCASTER_ACCOUNT_ASSOC_SIGNATURE,
  FARCASTER_ICON_URL,
  FARCASTER_SPLASH_IMAGE_URL,
  FARCASTER_SPLASH_BACKGROUND_COLOR,
  FARCASTER_HERO_IMAGE_URL,
} = require('../../config.js');

function getFarcasterManifest(ctx) {
  const iconUrl = FARCASTER_ICON_URL || `https://odysee.com/public/favicon_128.png`;
  const homeUrl = URL;
  const splashImageUrl = FARCASTER_SPLASH_IMAGE_URL || iconUrl;
  const splashBackgroundColor = FARCASTER_SPLASH_BACKGROUND_COLOR || '#ffffff';
  const heroImageUrl = FARCASTER_HERO_IMAGE_URL || iconUrl;

  const manifest = {
    accountAssociation: undefined,
    frame: {
      version: '1',
      name: SITE_NAME || 'Odysee',
      iconUrl: iconUrl,
      homeUrl: homeUrl,
      imageUrl: heroImageUrl,
      buttonTitle: 'Open App',
      splashImageUrl,
      splashBackgroundColor,
    },
  };

  if (FARCASTER_ACCOUNT_ASSOC_HEADER && FARCASTER_ACCOUNT_ASSOC_PAYLOAD && FARCASTER_ACCOUNT_ASSOC_SIGNATURE) {
    manifest.accountAssociation = {
      header: FARCASTER_ACCOUNT_ASSOC_HEADER,
      payload: FARCASTER_ACCOUNT_ASSOC_PAYLOAD,
      signature: FARCASTER_ACCOUNT_ASSOC_SIGNATURE,
    };
  }

  return JSON.stringify(manifest);
}

module.exports = { getFarcasterManifest };
