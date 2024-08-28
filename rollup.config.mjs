import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

import pkg from './package.json' assert { type: 'json' };

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
      typescript(),
      terser({
        mangle: false,
      }),
    ],
    strictDeprecations: true,
  },
  {
    input: 'src/index.ts',
    output: {
      name: 'videx-map',
      file: pkg.browser,
      format: 'umd',
      globals: {
        '@equinor/videx-linear-algebra': 'videxLinearAlgebra',
        '@equinor/videx-math': 'videxMath',
        '@equinor/videx-vector2': 'Vector2',
        'd3-color': 'd3Color',
        earcut: 'earcut',
        'pixi.js': 'PIXI',
        uuid: 'uuid',
      },
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      nodeResolve(),
      typescript(),
      terser({
        mangle: false,
      }),
    ],
    strictDeprecations: true,
  },
];
