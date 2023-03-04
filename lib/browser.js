if (process.title === 'browser') {
  const App = require('derby/App');

  App.prototype._views = function () {
    const appName = this.name;
    return require(`derby/lib/${appName}__views`);
  }
}
