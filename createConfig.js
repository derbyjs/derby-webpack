
const { WebpackDeduplicationPlugin } = require('webpack-deduplication-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const path = require('path');
const webpack = require('webpack');

const DerbyViewsPlugin = require('./lib/DerbyViewPlugin');

module.exports = function createConfig(apps, rootDir, opts = {}) {
  const options = {
    hotModuleReplacement: false,
    defines: {},
    ...opts,
  };

  return ({
    mode: 'development',
    entry: Object.entries(apps).reduce((acc, [name, path]) => ({
      ...acc,
      [name]: options.hotModuleReplacement ? [
        'webpack-hot-middleware/client',
        '@derbyjs/derby-webpack/lib/browser',
        path,
      ] : [
        '@derbyjs/derby-webpack/lib/browser',
        path,
      ],
    }), {}),
    node: {
      __dirname: true,
      __filename: true,
    },
    optimization: {
      chunkIds: 'named',
      moduleIds: 'named',
      minimize: false,
      concatenateModules: true,
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          ...(Object.entries(apps).reduce((acc, [name]) => ({
            ...acc,
            [`${name}_views`]: {
              test: new RegExp(`/derby-webpack-virtual-fs/app-views/${name}__views.js`),
              name: `${name}_views`,
              chunks: 'all',
              priority: 20,
            }
          }), {})),
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
        }
      },
    },
    output: {
      filename: '[name]-[contenthash].js',
      chunkFilename: '[id]-[chunkhash].js',
      clean: true,
      path: path.resolve(rootDir, './public/derby'),
      publicPath: '/derby/',
    },
    // @TODO: evaluate other options for performance/precision for dev and static build
    devtool: 'source-map',
    module: {
      rules: [
        // Workaround for Webpack error when processing the async@3's ESM code dist/async.mjs:
        // "The request 'process/browser' failed to resolve only because it was resolved as fully specified"
        // https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
        //
        // If the `fullySpecified: false` option is removed in the future, an alternative could be to use
        // `resolve.mainFields` to have Webpack prefer the CommonJS versions of packages over the ESM versions.
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false
          }
        }
      ],
    },
    plugins: ([
      // order matters
      // provide plugin before hot module replacement
      // to ensure polyfills can be applied
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      options.hotModuleReplacement ? new webpack.HotModuleReplacementPlugin() : undefined,
      new webpack.DefinePlugin({
        'process.title': JSON.stringify('browser'),
        'process.env.DERBY_HASH': JSON.stringify(process.env.DERBY_HASH || 'd3rby-h4$h'),
        'process.browser': true,
        ...options.defines,
      }),
      new WebpackDeduplicationPlugin({}),
      new DerbyViewsPlugin(apps),
      new WebpackManifestPlugin({
        writeToFileEmit: true,
        fileName: path.resolve(rootDir, './public/manifest.json'),
      }),
    ].filter(Boolean)),
    resolve: {
      extensions: ['...', '.coffee', '.ts'], // .coffee and .ts last so .js files in node_modules get precedence
      // Enable below polyfills to work when `npm link`ing libraries
      symlinks: false,
      /*
       * Polyfills for core Node libraries
       *
       * Without these, Webpack produces errors like `Module not found: Error: Can't resolve 'url'`.
       * Modules with trailing slashes have the same names as Node core libs. The trailing slash
       * causes Node to skip the usual behavior of prioritizing core modules in requires.
       */
      fallback: {
        events: require.resolve('events/'),
        path: require.resolve('path-browserify'),
        process: require.resolve('process/browser'),
        racer: require.resolve('racer'),
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        stream: require.resolve('stream-browserify'),
        os: require.resolve('os-browserify'),
        url: require.resolve('url/'),
        constants: false,
        fs: false,
        zlib: false,
        net: false,
        tls: false,
        vm: false,
      },
    },
  });
}
