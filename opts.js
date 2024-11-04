
const hide = ('--hide ' + [
    'usernames',
    'files',
    // 'dirnames',
    'filenames',
    'progress',
    'mouse',
].join(','));

const opts = ['--filename-time 2',
    '-1920x1080',
    // '--camera-mode track',
    '--seconds-per-day 0.001',
    '--auto-skip-seconds 0.05',
    '--elasticity 0.01',
    '--highlight-users',
    '--background-colour 000000',
    '--user-friction 0.2',
    '--font-size 16',
    // title is in Processor.js
    hide,
].join(' ');

exports.opts = opts;
exports.FETCH_DELAY = 90;
exports.CACHE_LIFETIME = 1000 * 60 * 60 * 24 * 7; // 1 week
exports.MAX_ERRORS = 10;