require('dotenv-defaults').config();
const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const { DefinePlugin, ProvidePlugin } = require('webpack');
const { getIfUtils } = require('webpack-config-utils');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';
const { ifProduction } = getIfUtils(NODE_ENV);
const UI_ROOT = path.resolve(__dirname, 'ui/');

const optInPlugins = [];

if (NODE_ENV !== 'development' && process.env.BUNDLE_ANALYZER_ENABLED) {
  // noinspection JSUnresolvedVariable
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
  optInPlugins.push(new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: process.env.BUNDLE_ANALYZER_FILENAME || 'report.html',
  }));
}

/**
 * @typedef { import('webpack').Configuration } Configuration
 *
 * @type {Configuration}
 */
let baseConfig = {
  mode: ifProduction('production', 'development'),
  devtool: ifProduction('source-map', 'eval-cheap-module-source-map'),
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          sourceMap: true,
        },
      }),
    ],
    moduleIds: 'deterministic',
  },
  node: {
    __dirname: false,
  },
  devServer: {
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-syntax-dynamic-import'],
        },
      },
      {
        test: /\.s?css$/,
        exclude: /style\.lazy\.scss/,
        use: [
          // MiniCssExtractPlugin.loader,
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /style\.lazy\.scss/,
        use: [
          MiniCssExtractPlugin.loader,
          // 'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
     },
      {
        test: /\.(vert|frag|glsl)$/,
        use: {
          loader: 'raw-loader',
        },
      },
    ],
  },
  // Allows imports for all directories inside '/ui' :)
  resolve: {
    modules: [UI_ROOT, 'node_modules', __dirname],
    extensions: ['.js', '.jsx', '.json', '.scss'],
    alias: {
      config: path.resolve(__dirname, 'config.js'),
      homepage: 'util/homepage.js',
      homepages: process.env.CUSTOM_HOMEPAGE === 'true' ? path.resolve(__dirname, 'custom/homepages/v2') : ('homepages'),
      memes: process.env.CUSTOM_HOMEPAGE === 'true' ? path.resolve(__dirname, 'custom/homepages/meme/index.js') : path.resolve(__dirname, 'homepages/meme/index.js'),
      lbryinc: 'extras/lbryinc',
      recsys: 'extras/recsys',
      // Build optimizations for 'redux-persist-transform-filter'
      'redux-persist-transform-filter': 'redux-persist-transform-filter/index.js',
      'lodash.get': 'lodash-es/get',
      'lodash.set': 'lodash-es/set',
      'lodash.unset': 'lodash-es/unset',
      'lodash.pickby': 'lodash-es/pickBy',
      'lodash.isempty': 'lodash-es/isEmpty',
      'lodash.forin': 'lodash-es/forIn',
      'lodash.clonedeep': 'lodash-es/cloneDeep',
      ...ifProduction({}, { 'react-dom': '@hot-loader/react-dom' }),
    },
    symlinks: false,
  },

  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new DefinePlugin({
      __static: `"${path.join(__dirname, 'static').replace(/\\/g, '\\\\')}"`,
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.LBRY_API_URL': JSON.stringify(process.env.LBRY_API_URL),
      'process.env.SENTRY_AUTH_TOKEN': JSON.stringify(process.env.SENTRY_AUTH_TOKEN),
      'process.env.MOONPAY_SECRET_KEY': JSON.stringify(process.env.MOONPAY_SECRET_KEY),
    }),
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      __: [path.resolve(path.join(__dirname, 'ui/i18n')), '__'],
      assert: [path.resolve(path.join(__dirname, 'ui/asserts')), 'assert'],
    }),
    new Dotenv({
      allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
      systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
      silent: false, // hide any errors
      defaults: true, // load '.env.defaults' as the default values if empty.
    }),
    new MiniCssExtractPlugin({
      filename: NODE_ENV === 'development' ? '[name].css' : '[name].[contenthash]-1009.css',
      chunkFilename: NODE_ENV === 'development' ? '[name].css' : '[name].[contenthash]-1009.css',
    }),
    ...optInPlugins,
  ],
  stats: {
    errorDetails: true,
    warnings: false,
  },
};
module.exports = baseConfig;
