const fixMacExecutablePath = require('./fixMacExecutablePath.js');

// TODO: JSDoc
module.exports = function fixOpts(options) {
  let tempPath;
  const newOptions = options;
  newOptions.appPath = newOptions.appPath.replace(/\/$/, '');
  const isMac = /darwin/.test(process.platform);

  if (isMac) {
    newOptions.appPath = fixMacExecutablePath(newOptions.appPath, newOptions.mac);
  }

  if (newOptions.appPath.indexOf('/') !== -1) {
    tempPath = newOptions.appPath.split('/');
    newOptions.appName = tempPath[tempPath.length - 1];
  } else if (newOptions.appPath.indexOf('\\') !== -1) {
    tempPath = newOptions.appPath.split('\\');
    newOptions.appName = tempPath[tempPath.length - 1];
    newOptions.appName = newOptions.appName.substr(0, newOptions.appName.length - '.exe'.length);
  }

  if (isMac) {
    // Remove ".app" from the appName if it exists
    if (newOptions.appName.indexOf('.app', newOptions.appName.length - '.app'.length) !== -1) {
      newOptions.appName = this.opts.appName.substr(0, newOptions.appName.length - '.app'.length);
    }
  }
  return newOptions;
};
