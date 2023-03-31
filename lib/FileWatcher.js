/**
 *  WATCHER for server-side changes and cache invalidation
 *  only watches paths under app path
 *  does not watch anything in node_modules/ 
 */
const chokidar = require('chokidar');
const resolve = require('path').resolve;
const decache = require('decache');

const watchers = new Map();

module.exports = function createWatcher(path) {
  if (watchers.has(path)) {
    return watchers.get(path);
  }
  console.log('---> 🔍 WATCHER created', path);
  const watcher = new FileWatcher(path);
  watchers.set(path, watcher);
  return watcher;
};

function FileWatcher(path) {  
  const options = {
    ignored: ['*.html'],
    useFsEvents: Boolean(JSON.parse(process.env.WATCH_FSEVENTS ?? false)),
    usePolling: Boolean(JSON.parse(process.env.WATCH_POLL ?? false)),
  };

  const watcher = chokidar.watch(path, options);

  watcher
    .on('change', function (subpath) {
      console.log('---> 🔁 WATCHER CHANGE', subpath);
      decache(subpath);
      findChildRefs(subpath)
        .filter(mod => mod.id.startsWith(path))
        .forEach(mod => decache(mod.id));
    })
    .on('ready', function () {
      console.log('===> 🔎 watching', path);
    })

  this.watcher = watcher;
}

FileWatcher.prototype.on = function (event, callback) {
  this.watcher.on(event, callback);
  return this;
}

FileWatcher.prototype.close = function () {
  this.watcher.close();
}

function findChildRefs(idStr) {
  const entries = Object.values(require.cache);
  return entries.filter(entry => entry.children.some(child => child.id === idStr));
}
