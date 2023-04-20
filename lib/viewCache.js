/** @type {Map<string, AppCacheEntry>} */
const cache = new Map();

exports.registerApp = (app) => {
  cache.set(app.filename, new AppCacheEntry(app));
};

exports.getViewsSource = (appPath) => {
  if (cache.has(appPath)) {
    return cache.get(appPath).getViewsSource();
  } else {
    throw new Error(`App ${appPath} wasn't registered in cache`);
  }
};

exports.refreshApp = (app) => {
  const appPath = app.filename;
  if (cache.has(appPath)) {
    cache.get(appPath).clearViewsSource();
  } else {
    throw new Error(`App ${appPath} wasn't registered in cache`);
  }
};

class AppCacheEntry {
  constructor(app) {
    this.app = app;
    this.viewsSource = '';
  }

  getViewsSource() {
    if (!this.viewsSource) {
      this.viewsSource = this.app._viewsSource({server: false, minify: false});
    }
    return this.viewsSource;
  }

  clearViewsSource() {
    this.viewsSource = '';
  }
}
