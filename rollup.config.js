import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'esm',
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      typescript({
        // eslint-disable-next-line global-require
        typescript: require('typescript'),
      }),
      terser({
        mangle: false,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      name: 'Vector2',
      file: pkg.browser,
      format: 'umd',
      globals: {
        '@equinor/videx-linear-algebra': 'videxLinearAlgebra',
        '@equinor/videx-math': 'videxMath',
        '@equinor/videx-vector2': 'Vector2',
        earcut: 'earcut',
        'pixi.js': 'PIXI',
        uuid: 'uuid',
      },
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      resolve(),
      typescript({
        // eslint-disable-next-line global-require
        typescript: require('typescript'),
      }),
      terser({
        mangle: false,
      }),
    ],
  },
];
