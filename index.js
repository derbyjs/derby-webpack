const webpack = require("webpack");
const webpackMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");

const webpackConfig = require('./webpack.config');

function derbyWebpack(apps, rootDir) {
  const config = () => webpackConfig(webpack, apps, rootDir);

  const hotReloadMiddleware = resolvedConfig => webpackHotMiddleware(webpack(resolvedConfig));
  const devMiddleware = resolvedConfig => webpackMiddleware(webpack(resolvedConfig), {
    serverSideRender: true,
    index: false,
    publicPath: resolvedConfig.output.publicPath,
    headers: (req, res, context) => {
      const origin = req.headers['origin'];
      if (!origin) return;
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('X-Derby-Webpack', 1);
    }
  });

  return {
    config,
    devMiddleware,
    hotReloadMiddleware,
  }
}

module.exports = derbyWebpack;
