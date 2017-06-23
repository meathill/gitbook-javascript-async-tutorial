const fs = require('fs');
const util = require('util');
const gulp = require('gulp');
const del = require('del');
const sequence = require('run-sequence');
const concat = require('gulp-concat');

const TO = 'build/';
const readFile = util.promisify(fs.readFile);

gulp.task('clear', () => {
  del(TO);
});

gulp.task('gitchat', async () => {
  let summary = await readFile('./SUMMARY.md');
  let chapters = /\]\(([^)]+\.md)\)/g[Symbol.match](summary)
    .map(chapter => chapter.slice(2, -1));
  return gulp.src(chapters)
    .pipe(concat('all.md', {
      newLine: '\n\r'
    }))
    .pipe(gulp.dest(TO + 'gitchat/'));
});

gulp.task('default', callback => {
  sequence(
    'clear',
    'gitchat',
    callback
  );
});