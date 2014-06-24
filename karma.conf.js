module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'dom-interceptor.js',
      'dom-interceptor_test.js'
    ],
    exclude: [],
    preprocessors: {},
    browsers: ['Chrome']
  });
};
