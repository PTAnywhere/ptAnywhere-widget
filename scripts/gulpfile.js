var fs = require('fs');
var gulp = require('gulp');
/* Read dependencies from package.json and inject them: */
var gulpLoadPlugins = require('gulp-load-plugins');
var plugins = gulpLoadPlugins();
var del = require('del');  // Manually added because it does not follow "gulp-*" pattern
var Server = require('karma').Server;


var SRC               = '../app/';
var SRC_JS            = SRC + '**/*.js';
var SRC_SASS          = SRC + '**/*.sass';
var TEMPLATES         = '../app/templates/*.html';
var TMP               = 'tmp/';
var TEMPLATE_JS       = 'templates.js';
var DIST              = '../dist/';
var PTANYWHERE_JS     = 'ptAnywhere.js';
var PTANYWHERE_MIN_JS = 'ptAnywhere.min.js';
var PTANYWHERE_CSS     = 'ptAnywhere.css';
var PTANYWHERE_MIN_CSS     = 'ptAnywhere.min.css';



gulp.task('clean', function(done) {
    return del([TMP + '**'], done);
});

gulp.task('lint', function() {
    var jshint = plugins.jshint;
    return gulp.src(SRC_JS)
                .pipe(jshint())
                .pipe(jshint.reporter('default'));
});

gulp.task('test', function(done) {
    new Server({
        configFile: __dirname + '/karma.conf.ci.js'
    }, function(exitCode) {
        // http://stackoverflow.com/questions/37551521/why-does-gulp-error-when-passing-the-done-function-to-karmas-server
        done();
    }).start();
});

gulp.task('templateCaching', ['clean'], function() {
    var templateCache = plugins.angularTemplatecache;
    return gulp.src(TEMPLATES)
                .pipe(templateCache(TEMPLATE_JS, {module: 'ptAnywhere.templates'}))
                .pipe(gulp.dest(TMP));
});

gulp.task('concat', ['templateCaching'], function() {
    return gulp.src([SRC_JS, TMP + TEMPLATE_JS])
                .pipe(plugins.concat(PTANYWHERE_JS))
                .pipe(gulp.dest(DIST));
});

// WARNING: It does the concat in alphabetical order.
// Therefore, if a file named before "app" exists (the module definition is in app.js),
// it will crash because the module would have not be defined by then.
gulp.task('minimize', ['concat'], function() {
    return gulp.src(DIST + PTANYWHERE_JS)
                .pipe(plugins.uglify())
                .pipe(plugins.rename(PTANYWHERE_MIN_JS))
                .pipe(gulp.dest(DIST));
});

// Minimized file should be available in the dist folder.
gulp.task('headers', ['minimize'], function() {
    var pkg = require('./package.json');
    var banner = ['/**',
                 ' * <%= pkg.name %> - <%= pkg.description %>',
                 ' * @version v<%= pkg.version %>',
                 ' * @link <%= pkg.homepage %>',
                 ' */',
                 ''].join('\n');
   return gulp.src([DIST + '**.js'])
      .pipe(plugins.header(banner, {pkg : pkg}))
      .pipe(gulp.dest(DIST));
});

/** CSS related **/
// Sass to css
gulp.task('sass', ['clean'], function() {
    var sass = plugins.sass;
    return gulp.src(SRC_SASS)
                .pipe(sass().on('error', sass.logError))
                .pipe(gulp.dest(TMP));
});

gulp.task('concat-css', ['sass'], function() {
    return gulp.src(TMP + '**/*.css')
                .pipe(plugins.concat(PTANYWHERE_CSS))
                .pipe(gulp.dest(DIST));
});

gulp.task('minify-css', ['concat-css'], function() {
    var cleanCSS = plugins.cleanCss;
    return gulp.src(DIST + PTANYWHERE_CSS)
                .pipe(cleanCSS())
                .pipe(plugins.rename(PTANYWHERE_MIN_CSS))
                .pipe(gulp.dest(DIST));
});

gulp.task('bundle-css', ['minify-css']);

// Other tasks that we might add in the future: 'bundle-js-individual', 'bundle-css', 'copy'
gulp.task('bundle', ['bundle-css', 'concat', 'minimize', 'headers']);

// Vendor files will be moved by maven to the "target" directory to be bundled in the .war.
gulp.task('extract_dependencies', ['clean'], function() {
    var d = 'bower_components/'
    var dependencies = [d + 'angular/angular.min.js',
                        d + 'angular-route/angular-route.min.js',
                        d + 'angular-animate/angular-animate.min.js',
                        d + 'angular-bootstrap/ui-bootstrap-tpls.min.js',
                        d + 'angular-websocket/angular-websocket.min.js',
                        d + 'angular-scroll-glue/src/scrollglue.js',
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
        .pipe(gulp.dest(TMP + 'vendors'));
});

// The watch task (to automatically rebuild when the source code changes)
gulp.task('watch', function() {
    gulp.watch(SRC_JS, ['lint', 'test', 'bundle']);
    gulp.watch(SRC_SASS, ['sass']);
});

// The default task (called when you run `gulp`)
gulp.task('default', ['extract_dependencies', 'lint', 'test', 'bundle']);

// Default + watch
gulp.task('run', ['default', 'watch']);