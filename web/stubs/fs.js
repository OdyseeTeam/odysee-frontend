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
