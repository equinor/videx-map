import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'fs';
import { join } from 'path';

const brightCyan = '\x1b[96m';
const brightRed = '\x1b[91m';
const reset = '\x1b[0m';

function copyImages(source, target) {
  // Ensure image folder exists
  if (!existsSync(target)) {
    mkdirSync(target);
  }

  const items = readdirSync(source);
  items.forEach(item => {
    copyFileSync(
      join(source, item),
      join(target, item),
    );
  });
}

if (existsSync('./docs')) {
  copyImages('./images', './docs/images');
  copyFileSync('./.nojekyll', './docs/.nojekyll');
  console.log(`${brightCyan}[info]${reset} Images and .nojekyll files copied into ./docs`);
} else {
  console.log(`${brightRed}[error]${reset} Docs directory does not exist, skipping file copy`);
}
