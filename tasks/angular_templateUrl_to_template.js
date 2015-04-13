'use strict';

var path = require('path'),
    fs = require('fs'),
    minify = require('html-minifier').minify,
    escape = require('js-string-escape');

function getFile (name, paths) {
  var file;
  paths.forEach(function (p) {
    var tPath = path.resolve(process.cwd(), p, name);
    try {
      file = fs.readFileSync(tPath).toString();
    } catch (e) {
      return;
    }
  });
  return file;
}

module.exports = function(grunt) {
  var desc = 'Replace templateUrl to template in angular directives';
  grunt.registerMultiTask('embedAngularTemplates', desc, function () {
    var options = this.options({
      views: ['']
    });
    if (!Array.isArray(options.views)) {
      throw new Error('options.views must be an Array');
    }
    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).map(function (file) {
        var regex = /templateUrl:/g,
            result,
            indices = [];
        while ( (result = regex.exec(file)) ) {
            var index = result.index;
            var tmp = file.substring(index);
            var match = tmp.match(/'([^']*)'/);
            var contents = getFile(match[1], options.views);
            if (!contents) {
              grunt.log.writeln('File "' + match[1] + '" was not found in given paths.');
              continue;
            }
            var minified = escape(minify(contents, {
              preventAttributesEscaping: true,
              collapseWhitespace: true
            }));

            var start = tmp.indexOf(match[1]) + file.length - tmp.length,
                end = start + match[1].length;

            file = file.substring(0, start) + minified + file.substring(end);
            file = file.substring(0, index) + 'template:' + file.substring(index + 12);
        }
        return file;
      });

      grunt.file.write(f.dest, src);
      grunt.log.writeln('File "' + f.dest + '" processed.');
    });
  });

};
