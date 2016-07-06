var fs = require('fs');
var gulp = require('gulp');
/* Read dependencies from package.json and inject them: */
var gulpLoadPlugins = require('gulp-load-plugins');
var plugins = gulpLoadPlugins();
var del = require('del');  // Manually added because it does not follow "gulp-*" pattern
var Server = require('karma').Server;


var SRC               = '../app/**/*.js';
var TEMPLATES         = '../app/templates/*.html';
var TMP               = 'tmp/';
var TEMPLATE_JS       = 'templates.js';
var DIST              = '../dist/';
var PTANYWHERE_JS      = 'ptAnywhere.js';
var PTANYWHERE_MIN_JS  = 'ptAnywhere.min.js';



gulp.task('clean', function() {
   return del([TMP + '**']);
});

gulp.task('lint', function() {
   var jshint = plugins.jshint;
   return gulp.src(SRC)
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
});

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.ci.js'
  }, done).start();
});

gulp.task('template', function () {
  var templateCache = plugins.angularTemplatecache;
  return gulp.src(TEMPLATES)
    .pipe(templateCache(TEMPLATE_JS, {module: 'ptAnywhere'}))
    .pipe(gulp.dest(TMP));
});

gulp.task('concat', ['template'], function (cb) {
   return gulp.src(['!../app/widget.js', '!../app/console.js', SRC, TMP + TEMPLATE_JS])
      .pipe(plugins.concat(PTANYWHERE_JS))
      // We write it to DIST because we will not use it afterwards.
      .pipe(gulp.dest(TMP));
});

// WARNING: It does the concat in alphabetical order.
// Therefore, if a file named before "app" exists (the module definition is in app.js),
// it will crash because the module would have not be defined by then.
gulp.task('minimize', ['concat'], function (cb) {
   return gulp.src(TMP + PTANYWHERE_JS)
      .pipe(plugins.uglify())
      .pipe(plugins.rename(PTANYWHERE_MIN_JS))
      .pipe(gulp.dest(DIST));
});


var pkg = require('./package.json');
var banner = ['/**',
 ' * <%= pkg.name %> - <%= pkg.description %>',
 ' * @version v<%= pkg.version %>',
 ' * @link <%= pkg.homepage %>',
 ' */',
 ''].join('\n');

gulp.task('headers', ['minimize'], function (cb) {
   return gulp.src(DIST + '**.js')
      .pipe(plugins.header(banner, {pkg : pkg}))
      .pipe(gulp.dest(DIST));
});

// Other tasks that we might add in the future: 'bundle-js-individual', 'bundle-css', 'copy'
gulp.task('bundle', ['concat', 'minimize', 'headers']);

// Vendor files will be moved by maven to the "target" directory to be bundled in the .war.
gulp.task('prepare_for_jar', ['bundle'], function() {
    var d = 'bower_components/'
    var dependencies = [d + 'angular/angular.min.js',
                        d + 'angular-route/angular-route.min.js',
                        d + 'angular-animate/angular-animate.min.js',
                        d + 'angular-bootstrap/ui-bootstrap-tpls.min.js',
                        // Bootstrap JS code is not needed as it is already included in the "Angular UI bootstrap"
                        // module included above.
                        // Bootstrap CSS files still needed
                        d + 'bootstrap/dist/css/bootstrap.min.css',
                        d + 'bootstrap/dist/css/bootstrap-theme.min.css',
                        d + 'jquery/dist/jquery.min.js',
                        d + 'jquery-ui/ui/minified/core.min.js',
                        d + 'jquery-ui/ui/minified/widget.min.js',
                        d + 'jquery-ui/ui/minified/mouse.min.js',
                        d + 'jquery-ui/ui/minified/draggable.min.js',
                        d + 'jquery-ui-touch-punch/jquery.ui.touch-punch.min.js',

                        d + 'vis/dist/**']
    gulp.src(dependencies)
        .pipe(gulp.dest('tmp/vendors'));
});

// The watch task (to automatically rebuild when the source code changes)
gulp.task('watch', function () {
  gulp.watch(['../data/**/*'], ['lint', 'bundle']);
});

// The default task (called when you run `gulp`)
gulp.task('default', ['lint', 'test', 'bundle', 'prepare_for_jar']);

// Default + watch
gulp.task('run', ['default', 'test', 'watch']);