module.exports = function(config) {
  process.env.SAUCE_USERNAME='angular-ci';
  process.env.SAUCE_ACCESS_KEY='9b988f434ff8-fbca-8aa4-4ae3-35442987';

  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '27'
    },
    sl_ios_safari: {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.9',
      version: '7.1'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    }
  };

  config.set({
    frameworks: ['jasmine'],
    files: [
      'dom-interceptor.js',
      'dom-interceptor_test.js'
    ],
    exclude: [],
    preprocessors: {},
    SauceLabs: {
      testName: 'Dom Interceptor Unit Tests',
      recordScreenshots: false
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ['dots', 'saucelabs'],
    singleRun: true
  });
};
