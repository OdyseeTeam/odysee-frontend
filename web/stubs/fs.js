function logWarning(method) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Called fs.${method} on lbry.tv. This should be removed.`); // eslint-disable-line no-console
  }
}

export default {
  readFileSync: () => {
    logWarning('readFileSync');
    return undefined;
  },
  accessFileSync: () => {
    logWarning('accessFileSync');
    return undefined;
  },
  constants: {},
};

// [TODO_NEED_VERIFICATION]
// The TODO_NEED_VERIFICATION marker indicates that the existing dependency
// array was retained just to get lint passing.
//  - If it was intentionally done that way, replace this tag with the reason.
//  - If array is indeed missing some items, fix and remove the suppressor.
//  - When making changes to the effect, ensure array is updated as needed.
