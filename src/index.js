const isPathAbsolute = require('path-is-absolute');
const path = require('path');
const autoLaunchLinux = require('./AutoLaunchLinux');
const autoLaunchMac = require('./AutoLaunchMac');
const autoLaunchWindows = require('./AutoLaunchWindows');
const fixMacExecutablePath = require('./fixMacExecutablePath');

/**
 * @param {Object} meta
 * @returns {Object}
 */
const getApi = function getApi(meta) {
  if (meta.isLinux) {
    return autoLaunchLinux;
  }
  if (meta.isMac) {
    return autoLaunchMac;
  }
  if (meta.isWindows) {
    return autoLaunchWindows;
  }
  throw new Error('Unsupported platform');
};

/**
 * @param {Object} opts
 * @property {String} opts.appPath
 * @property {Object} opts.meta
 * @returns {String}
 */
const getAppName = function getAppName({ appPath, meta }) {
  const pieces = appPath.split(path.sep);
  let appName = pieces[pieces.length - 1];

  // Remove extension
  if (meta.isMac) {
    appName = appName.replace(/\.app$/, '');
  } else if (meta.isWindows) {
    appName = appName.replace(/\.exe$/, '');
  }

  return appName;
};

/**
 * Detects which platform we're currently running on, etc.
 * @returns {Object}
 */
const getMeta = function getMeta() {
  const meta = {};

  if (/darwin/.test(process.platform)) {
    meta.isMac = true;
  } else if (/^win/.test(process.platform)) {
    meta.isWindows = true;
  } else if (/linux/.test(process.platform)) {
    meta.isLinux = true;
  }

  const versions = process ? process.versions : {};
  if (versions.nw || versions['node-webkit']) {
    meta.isNw = true;
  } else if (versions.electron) {
    meta.isElectron = true;
  }
};


/**
 * @param {Object} opts
 * @property {String} opts.appPath
 * @property {Object} opts.macOptions
 * @property {Object} opts.meta
 * @returns {String}
 */
const getPath = function getPath({ appPath, macOptions, meta }) {
  let result;
  if (appPath) {
    // Verify that the path is absolute
    if (!isPathAbsolute(appPath)) {
      throw new Error('path must be absolute');
    }
    result = appPath;
  } else if (this.meta.isNw || this.meta.isElectron) {
    result = process.execPath;
  } else {
    throw new Error('You must give a path (this is only auto-detected for NW.js and Electron apps)');
  }

  if (meta.isMac) {
    result = fixMacExecutablePath(result, macOptions);
  }

  return result.replace(/\/$/, '');
};


module.exports = class AutoLaunch {
  /**
   * @param {Object} opts
   * @property {Boolean} opts.isHidden (Optional)
   * @property {Object} opts.mac (Optional)
   * @property {Boolean} opts.mac.useLaunchAgent (Optional) - If true, use filed-based Launch Agent.
   *    Otherwise use AppleScript to add Login Item
   * @property {String} opts.name TODO: this isn't used!
   * @property {String} opts.path (Optional)
   * @returns {Object}
   */
  constructor(opts) {
    this.disable = this.disable.bind(this);
    this.enable = this.enable.bind(this);
    this.isEnabled = this.isEnabled.bind(this);

    if (!opts.name) {
      throw new Error('You must specify a name');
    }

    this.meta = getMeta();
    this.opts = {
      isHiddenOnLaunch: opts.isHidden,
      mac: opts.mac || {},
    };
    this.opts.path = getPath({ appPath: opts.path, macOptions: this.opts.mac, meta: this.meta });
    this.opts.appName = getAppName({ appPath: this.opts.path, meta: this.meta });

    this.api = getApi(this.meta);
  }


  /**
   * @returns {Object} - a Promise
   */
  disable() {
    return this.api.disable(this.opts.appName, this.opts.mac);
  }


  /**
   * @returns {Object} - a Promise
   */
  enable() {
    return this.api.enable(this.opts);
  }

  /**
   * @returns {Object} - a Promise which resolves to a Boolean
   */
  isEnabled() {
    return this.api.isEnabled(this.opts.appName, this.opts.mac);
  }
};
