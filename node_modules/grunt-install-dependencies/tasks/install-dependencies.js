'use strict';

module.exports = function (grunt) {
  var exec = require('child_process').exec;

  grunt.registerTask('install-dependencies', 'Installs npm dependencies.', function () {
    var cb, options, cp;

    cb = this.async();
    options = this.options({
      cwd: '',
      stdout: true,
      stderr: true,
      failOnError: true
    });
    cp = exec('npm install', {cwd: options.cwd}, function (err, stdout, stderr) {
      if (err && options.failOnError) {
        grunt.warn(err);
      }
      cb();
    });

    grunt.verbose.writeflags(options, 'Options');

    if (options.stdout || grunt.option('verbose')) {
      console.log("Running npm install in: " + options.cwd);
      cp.stdout.pipe(process.stdout);
    }

    if (options.stderr || grunt.option('verbose')) {
      cp.stderr.pipe(process.stderr);
    }
  });
};
