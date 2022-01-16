module.exports.isLocalStorageAvailable = function isLocalStorageAvailable() {
  try {
    return Boolean(globalThis.localStorage);
  } catch (e) {
    return false;
  }
};

module.exports.isSessionStorageAvailable = function isSessionStorageAvailable() {
  try {
    return Boolean(globalThis.sessionStorage);
  } catch (e) {
    return false;
  }
};
