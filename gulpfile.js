const gulp             = require('gulp');
const concat           = require('gulp-concat');
const sourcemaps       = require('gulp-sourcemaps');
const uglify           = require('gulp-uglify');
const htmlToJs         = require('gulp-html-to-js');
const wrapFile         = require('gulp-wrap-file');
const sass             = require('gulp-sass')(require('sass'));
const rollup           = require('@rollup/stream');
const rollupSourcemaps = require('rollup-plugin-sourcemaps');
const rollupCommonjs   = require('@rollup/plugin-commonjs');
const rollupBabel      = require('@rollup/plugin-babel');
const nodeResolve      = require('@rollup/plugin-node-resolve');
const source           = require('vinyl-source-stream');
const buffer           = require('vinyl-buffer');

const through2 = require('through2');
const crypto   = require('crypto');
const fs       = require('fs');

const {pipeline} = require('stream/promises');


const conf = {
    dist: './dist',
    html: {
        file: '../index.html'
    },
    fonts: {
        dist: './dist/fonts',
        src: [
            'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2',
            'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2',
            'node_modules/material-icons/iconfont/material-icons.woff2'
        ]
    },
    entries: {
        core: {
            name: 'Core',
            external: {},
            js: {
                file: 'core.min.js',
                main: 'src/core/main.js',
                src: [
                    'src/core/**/*.js',
                    '!src/core/js/core/tpl.js'
                ]
            },
            css: {
                file: 'core.min.css',
                main: 'src/core/main.scss',
                src: [
                    'src/core/css/**/*.scss'
                ]
            },
            tpl: {
                file: 'tpl.js',
                dist: './src/core/js/core',
                src: [
                    'src/core/html/**/*.html'
                ]
            }
        },
        admin: {
            name: 'Admin',
            external: {
                '@rowan/core': 'Core'
            },
            js: {
                file: 'admin.min.js',
                main: 'src/admin/main.js',
                src: [
                    'src/admin/**/*.js',
                    '!src/admin/js/tpl.js'
                ]
            },
            css: {
                file: 'admin.min.css',
                main: 'src/admin/main.scss',
                src: [
                    'src/admin/css/**/*.scss'
                ]
            },
            tpl: {
                file: 'tpl.js',
                dist: './src/admin/js',
                src: [
                    'src/admin/html/**/*.html'
                ]
            }
        }
    }
};


/**
 * @param {string} name
 * @return {*}
 */
function buildTpl(name) {

    const entry = conf.entries[name];

    return gulp.src(entry.tpl.src)
        .pipe(htmlToJs({global: 'tpl', concat: entry.tpl.file}))
        .pipe(wrapFile({
            wrapper: function (content, file) {
                content = content.replace(/\\n/g, ' ');
                content = content.replace(/[ ]{2,}/g, ' ');
                return 'let ' + content + ";\nexport default tpl;"
            }
        }))
        .pipe(gulp.dest(entry.tpl.dist));
}


/**
 * @param {string}  name
 * @param {boolean} minify
 * @return {*}
 */
function buildJs(name, minify) {

    const entry = conf.entries[name];

    let stream = rollup({
        input: entry.js.main,
        external: Object.keys(entry.external),
        output: {
            sourcemap: minify,
            format: 'umd',
            name: entry.name,
            globals: entry.external
        },
        onwarn: function (log, handler) {
            if (log.code === 'CIRCULAR_DEPENDENCY') {
                return; // Ignore circular dependency warnings
            }
            handler(log.message);
        },
        context: "window",
        plugins: [
            nodeResolve(),
            rollupSourcemaps(),
            rollupCommonjs(),
            rollupBabel({babelHelpers: 'bundled'}),
        ]
    })
        .pipe(source(entry.js.file))
        .pipe(buffer());

    if (minify) {
        stream = stream
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(sourcemaps.write('.'));
    }

    return stream.pipe(gulp.dest(conf.dist));
}


/**
 * @param {string}  name
 * @param {boolean} minify
 * @return {*}
 */
function buildCss(name, minify) {

    const entry = conf.entries[name];

    const options = {
        includePaths: ['node_modules']
    };

    if (minify) {
        options.outputStyle = 'compressed';
    }

    let stream = gulp.src(entry.css.main)
        .pipe(sass(options).on('error', sass.logError))
        .pipe(concat(entry.css.file));

    if (minify) {
        stream = stream
            .pipe(sourcemaps.init())
            .pipe(sourcemaps.write('.'));
    }

    return stream.pipe(gulp.dest(conf.dist));
}


gulp.task('build_fonts', function () {
    return pipeline(gulp.src(conf.fonts.src), gulp.dest(conf.fonts.dist));
});


gulp.task('build_tpl', gulp.series(
    function () { return buildTpl('core'); },
    function () { return buildTpl('admin'); }
));

gulp.task('build_js', gulp.series(
    function () { return buildJs('core', true); },
    function () { return buildJs('admin', true); }
));

gulp.task('build_js_fast', gulp.series(
    function () { return buildJs('core', false); },
    function () { return buildJs('admin', false); }
));

gulp.task('build_css', gulp.parallel(
    function () { return buildCss('core', true); },
    function () { return buildCss('admin', true); }
));

gulp.task('build_css_fast', gulp.parallel(
    function () { return buildCss('core', false); },
    function () { return buildCss('admin', false); }
));


gulp.task('update_index', function() {

    /**
     * Получение хэша из файла
     * @param filePath
     * @return {string|null}
     */
    function getFileHash(filePath) {
        if ( ! fs.existsSync(filePath)) {
            return null;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const hashSum    = crypto.createHash('sha256');

        hashSum.update(fileBuffer);
        return hashSum.digest('hex').slice(0, 8);
    }

    let dirIndex = conf.html.file.split('/');
    dirIndex.splice(-1, 1)
    dirIndex = dirIndex.join('/') + '/';

    return gulp.src(conf.html.file)
        .pipe(through2.obj((file, enc, cb) => {
            let content = file.contents.toString();

            const jsRegex  = /(src="[^"]+\.js(\?.*|)")/g;
            const cssRegex = /(href="[^"]+\.css(\?.*|)")/g;

            // Функция для замены путей с добавлением хэша
            const addHashToAssets = (match, attr) => {
                const filePath = match.match(/src="([^"]+)"/)?.[1] || match.match(/href="([^"]+)"/)?.[1];

                if ( ! filePath) {
                    return match;
                }

                const filePathPure = filePath.split('?')[0];
                const pathSplit    = filePathPure.split('/');
                const fullPath     = conf.dist + '/' + pathSplit[pathSplit.length - 1];
                const hash         = getFileHash(fullPath);

                if ( ! hash) {
                    return match;
                }

                return match.replace(filePath, `${filePathPure}?_=${hash}`);
            };

            // Замена для JS и CSS
            content = content.replace(jsRegex, (match) => addHashToAssets(match, 'src'));
            content = content.replace(cssRegex, (match) => addHashToAssets(match, 'href'));

            file.contents = Buffer.from(content);
            cb(null, file);
        }))
        .pipe(gulp.dest(dirIndex));
});


gulp.task('build', gulp.series('build_tpl', 'build_js', 'build_fonts', 'build_css', 'update_index'));

gulp.task('build_fast', gulp.series('build_tpl', 'build_js_fast', 'build_fonts', 'build_css_fast', 'update_index'));


gulp.task('build_watch', function() {

    gulp.watch(conf.entries.core.css.src,   gulp.series('build_css_fast', 'update_index'));
    gulp.watch(conf.entries.core.tpl.src,   gulp.series('build_tpl', 'build_js_fast', 'update_index'));
    gulp.watch(conf.entries.core.js.src,    gulp.series('build_js_fast', 'update_index'));

    gulp.watch(conf.entries.admin.css.src,  gulp.series('build_css_fast'));
    gulp.watch(conf.entries.admin.tpl.src,  gulp.series('build_tpl', 'build_js_fast'));
    gulp.watch(conf.entries.admin.js.src,   gulp.series('build_js_fast'));
});


gulp.task("default", gulp.series('build'));
