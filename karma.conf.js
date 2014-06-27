module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'node_modules/harmony-reflect/reflect.js',
      'dom-interceptor.js',
      'dom-interceptor_test.js'
    ],
    exclude: [],
    preprocessors: {},
    browsers: ['Chrome_with_ECMA6'],
    customLaunchers: {
      Chrome_with_ECMA6: {
        base: 'Chrome',
        flags: ['--js-flags=--harmony']
      }
    }
  });
};
