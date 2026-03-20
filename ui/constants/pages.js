const AUTH = 'signup';
const AUTH_SIGNIN = 'signin';
const AUTH_VERIFY = 'verify';
const AUTH_PASSWORD_RESET = 'resetpassword';
const AUTH_PASSWORD_SET = 'reset'; // This is tied to a link in internal-apis - don't change this

const AUTH_WALLET_PASSWORD = 'walletpassword';
const BACKUP = 'backup';
const CHANNEL = 'channel';
const DISCOVER = 'discover';
const ARTISTS = 'artists';
const SPORTS = 'sports';
const BIG_HITS = 'bighits';
const CREATIVE_ARTS = 'arts';
const MOVIES = 'movies';
const MUSIC = 'music';
const COMMUNITY = 'community';
const CONTRIBUTE = 'contribute';
const DOCS_AND_FILMS = 'docs';
const EDUCATION = 'education';
const ENLIGHTENMENT = 'enlightenment';
const FEATURED = 'featured';
const FINANCE = 'finance';
const GAMING = 'gaming';
const GENERAL = 'general';
const LAB = 'lab';
const NEWS = 'news';
const POP_CULTURE = 'popculture';
const RABBIT_HOLE = 'rabbithole';
const SCIENCE = 'science';
const TECHNOLOGY = 'technology';
const TECH = 'tech';
const UNIVERSE = 'universe';
const WILD_WEST = 'wildwest';
const HOME = 'home';
const HELP = 'help';
const LIBRARY = 'library';
const LISTS = 'lists';
const PLAYLISTS = 'playlists';
const WATCH_HISTORY = 'watchhistory';
const INVITE = 'invite';
const FEATURED_CHANNELS = 'featured_channels';
const DEPRECATED__DOWNLOADED = 'downloaded';
const DEPRECATED__PUBLISH = 'publish';
const DEPRECATED__PUBLISHED = 'published';
const UPLOAD = 'upload';
const POST = 'post';
const UPLOADS = 'uploads';
const GET_CREDITS = 'getcredits';
const REPORT = 'report';
const REPORT_CONTENT = 'report_content';
const REWARDS = 'rewards';
const REWARDS_VERIFY = 'rewards/verify';
const REPOST_NEW = 'repost';
const SEND = 'send';
const SETTINGS = 'settings';
const SETTINGS_STRIPE_CARD = 'settings/card';
const SETTINGS_STRIPE_ACCOUNT = 'settings/tip_account';
const SETTINGS_NOTIFICATIONS = 'settings/notifications';
const SETTINGS_BLOCKED_MUTED = 'settings/block_and_mute';
const SETTINGS_CREATOR = 'settings/creator';
const SETTINGS_UPDATE_PWD = 'settings/update_password';
const SETTINGS_OWN_COMMENTS = 'settings/ownComments';
const SHOW = 'show';
const ACCOUNT = 'account';
const SEARCH = 'search';
const TAGS_FOLLOWING = 'tags';
const DEPRECATED__TAGS_FOLLOWING = 'following/tags';
const TAGS_FOLLOWING_MANAGE = 'tags/manage';
const DEPRECATED__TAGS_FOLLOWING_MANAGE = 'tags/following/manage';
const DEPRECATED__CHANNELS_FOLLOWING = 'following/channels';
const CHANNELS_FOLLOWING = 'following';
const DEPRECATED__CHANNELS_FOLLOWING_MANAGE = 'following/channels/manage';
const CHANNELS_FOLLOWING_DISCOVER = 'following/discover';
const CHANNELS_FOLLOWING_MANAGE = 'following/manage';
const WALLET = 'wallet';
const CHANNELS = 'channels';
const EMBED = 'embed';
const TOP = 'top';
const CREATOR_DASHBOARD = 'dashboard';
const CHECKOUT = 'checkout';
const CODE_2257 = '2257';
const PRIVACY_POLICY = 'privacypolicy';
const TOS = 'tos';
const FYP = 'fyp';
const YOUTUBE_TOS = 'youtubetos';
const BUY = 'buy';
const PAYMENTACCOUNT = 'paymentaccount';
const ARACCOUNT = 'araccount';
const RECEIVE = 'receive';
const SWAP = 'swap';
const CHANNEL_NEW = 'channel/new';
const NOTIFICATIONS = 'notifications';
const YOUTUBE_SYNC = 'youtube';
const LIVESTREAM = 'livestream';
const LIVESTREAM_CURRENT = 'live';
const LIVESTREAM_CREATE = 'livestream/create';
const LIST = 'list';
const PLAYLIST = 'playlist';
const ODYSEE_MEMBERSHIP = 'premium';
const CREATOR_MEMBERSHIPS = 'memberships/creator';
const MEMBERSHIPS_SUPPORTER = 'memberships/supporter';
const MEMBERSHIPS_LANDING = 'memberships';
const POPOUT = 'popout';
const LATEST = 'latest';
const LIVE_NOW = 'livenow';
const PORTALS = 'portals';
const PORTAL = 'portal';
const CAREERS = 'careers';
const CAREERS_IT_PROJECT_MANAGER = 'careers/it_project_manager';
const CAREERS_SENIOR_BACKEND_ENGINEER = 'careers/senior_backend_engineer';
const CAREERS_SENIOR_SYSADMIN = 'careers/senior_sysadmin';
const CAREERS_SOFTWARE_SECURITY_ENGINEER = 'careers/software_security_engineer';
const CAREERS_SENIOR_ANDROID_DEVELOPER = 'careers/senior_android_developer';
const CAREERS_SENIOR_IOS_DEVELOPER = 'careers/senior_ios_developer';
const ICONS_VIEWER = 'icons_viewer';
const HIDDEN_CONTENT = 'hidden';
const PAGES = {
  ACCOUNT,
  ARACCOUNT,
  ARTISTS,
  AUTH,
  AUTH_PASSWORD_RESET,
  AUTH_PASSWORD_SET,
  AUTH_SIGNIN,
  AUTH_VERIFY,
  AUTH_WALLET_PASSWORD,
  BACKUP,
  BIG_HITS,
  BUY,
  CAREERS,
  CAREERS_IT_PROJECT_MANAGER,
  CAREERS_SENIOR_ANDROID_DEVELOPER,
  CAREERS_SENIOR_BACKEND_ENGINEER,
  CAREERS_SENIOR_IOS_DEVELOPER,
  CAREERS_SENIOR_SYSADMIN,
  CAREERS_SOFTWARE_SECURITY_ENGINEER,
  CHANNEL,
  CHANNELS,
  CHANNELS_FOLLOWING,
  CHANNELS_FOLLOWING_DISCOVER,
  CHANNELS_FOLLOWING_MANAGE,
  CHANNEL_NEW,
  CHECKOUT,
  COMMUNITY,
  CONTRIBUTE,
  CREATIVE_ARTS,
  CREATOR_DASHBOARD,
  CREATOR_MEMBERSHIPS,
  DEPRECATED__CHANNELS_FOLLOWING,
  DEPRECATED__CHANNELS_FOLLOWING_MANAGE,
  DEPRECATED__DOWNLOADED,
  DEPRECATED__PUBLISH,
  DEPRECATED__PUBLISHED,
  DEPRECATED__TAGS_FOLLOWING,
  DEPRECATED__TAGS_FOLLOWING_MANAGE,
  DISCOVER,
  DOCS_AND_FILMS,
  EDUCATION,
  EMBED,
  ENLIGHTENMENT,
  FEATURED,
  FEATURED_CHANNELS,
  FINANCE,
  FYP,
  GAMING,
  GENERAL,
  GET_CREDITS,
  HELP,
  HIDDEN_CONTENT,
  HOME,
  ICONS_VIEWER,
  INVITE,
  LAB,
  LATEST,
  LIBRARY,
  LIST,
  LISTS,
  LIVESTREAM,
  LIVESTREAM_CREATE,
  LIVESTREAM_CURRENT,
  LIVE_NOW,
  MEMBERSHIPS_LANDING,
  MEMBERSHIPS_SUPPORTER,
  MOVIES,
  MUSIC,
  NEWS,
  NOTIFICATIONS,
  ODYSEE_MEMBERSHIP,
  PAYMENTACCOUNT,
  PLAYLIST,
  PLAYLISTS,
  POPOUT,
  POP_CULTURE,
  PORTAL,
  PORTALS,
  POST,
  PRIVACY_POLICY,
  RABBIT_HOLE,
  RECEIVE,
  REPORT,
  REPORT_CONTENT,
  REPOST_NEW,
  REWARDS,
  REWARDS_VERIFY,
  SCIENCE,
  SEARCH,
  SEND,
  SETTINGS,
  SETTINGS_BLOCKED_MUTED,
  SETTINGS_CREATOR,
  SETTINGS_NOTIFICATIONS,
  SETTINGS_OWN_COMMENTS,
  SETTINGS_STRIPE_ACCOUNT,
  SETTINGS_STRIPE_CARD,
  SETTINGS_UPDATE_PWD,
  SHOW,
  SPORTS,
  SWAP,
  TAGS_FOLLOWING,
  TAGS_FOLLOWING_MANAGE,
  TECH,
  TECHNOLOGY,
  TOP,
  TOS,
  UNIVERSE,
  UPLOAD,
  UPLOADS,
  WALLET,
  WATCH_HISTORY,
  WILD_WEST,
  YOUTUBE_SYNC,
  YOUTUBE_TOS,
};
module.exports = PAGES;
module.exports.PAGES = PAGES;
