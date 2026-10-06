import { cpSync, copyFileSync } from 'node:fs';

cpSync('./images', './docs/images', { recursive: true });
copyFileSync('./.nojekyll', './docs/.nojekyll');
