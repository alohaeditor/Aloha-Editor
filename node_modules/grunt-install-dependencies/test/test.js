'use strict';

var grunt = require('../node_modules/grunt'),
  path = require('path'),
  fs = require('fs');

module.exports = {
  tearDown: function (callback) {
    var modulesDir = path.join(__dirname, 'node_modules');
    grunt.file.delete(modulesDir);
    callback();
  },
  installsDependency: function (test) {
    test.expect(1);

    var checkDirectory = path.join(__dirname, 'node_modules/underscore');

    grunt.util.spawn({
      grunt: true,
      opts: {cwd: __dirname},
      args: [
        'install-dependencies',
        '--verbose'
      ]
    }, function (err, res, code) {
      if (err) { throw err; }
      var stats, isDirectory;

      try {
        stats = fs.statSync(checkDirectory);
        isDirectory = stats.isDirectory();
      } catch (e) {
        isDirectory = false;
      }

      test.ok(isDirectory, checkDirectory + ' exists');
      test.done();
    });
  }
};
