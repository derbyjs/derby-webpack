if (process.title === 'browser') {
  const AppModule = require('derby/App');
  // AppForClient introduced in derby@4
  const App = AppModule.AppForClient || AppModule.App;

  App.prototype._views = function () {
    const appName = this.name;
    // This can't interpolate with a shared constant in another file, because then Webpack's
    // static analysis would treat this require as having a second dynamic path segment.
    return require(`/derby-webpack-virtual-fs/app-views/${appName}__views`);
  }
}
