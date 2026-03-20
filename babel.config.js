module.exports = api => {
  api.cache(false);

  return {
    presets: [['@babel/env', { loose: true, modules: false }], '@babel/react', '@babel/flow'],
    plugins: [
      'import-glob',
      '@babel/plugin-transform-runtime',
      ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
      '@babel/plugin-transform-flow-strip-types',
      '@babel/plugin-proposal-class-properties',
    ],
    ignore: [/node_modules/],
  };
};
