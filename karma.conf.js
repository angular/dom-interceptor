// Karma config based on:
//  https://github.com/angular/pipe/blob/master/karma.js
module.exports = function(config) {
  config.set({
    frameworks: ['browserify','jasmine'],
    files: [
      'dom-interceptor.js',
      'dom-interceptor_test.js'
    ],
    exclude: [],
    preprocessors: {
      'dom-interceptor.js': ['browserify']
    },
    browsers: ['Chrome'],
    browserify: {
      debug: true
    }
  });
};
