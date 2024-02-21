import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import sourcemaps from 'rollup-plugin-sourcemaps';

import pkg from './package.json' assert { type: 'json' };

function bundle(what, imports, output) {
  let input;
  switch (what) {
    case 'full':
      input = 'build/src/index.js';
      break;
    case 'web':
      input = 'build/src/web/index.js';
      break;
    case 'react':
      input = 'build/src/react/index.js';
      break;
    default:
      throw new Error('Invalid type');
  }

  let name;
  let format;
  switch (imports) {
    case 'cjs':
      format = 'cjs';
      break;
    case 'esm':
      format = 'es';
      break;
    case 'browser':
      name = 'LottiePlayer';
      format = 'iife';
      break;
    default:
      throw new Error('Invalid type');
  }

  if (!output) {
    throw new Error('Invalid output');
  }

  const plugins = [sourcemaps(), resolve(), commonjs(), terser()];
  return {
    input,
    external: ['react', 'react-dom'],
    output: {
      file: output,
      format,
      name,
      sourcemap: true
    },
    plugins
  };
}

function types(what, output) {
  let input;
  switch (what) {
    case 'full':
      input = 'build/src/index.d.ts';
      break;
    case 'web':
    case 'browser':
      input = 'build/src/web/index.d.ts';
      break;
    case 'react':
      input = 'build/src/react/index.d.ts';
      break;
    default:
      throw new Error('Invalid type');
  }

  return {
    input,
    output: {
      file: output,
      format: 'es',
    },
    plugins: [dts()],
  };
}

export default [
  bundle('web', 'browser', 'dist/player-web.min.js'), // For <script> usage / CDN

  bundle('full', 'cjs', pkg.exports['.'].require), // Everything - cjs
  bundle('full', 'esm', pkg.exports['.'].import), // Everything - esm
  types('full', pkg.exports['.'].types),

  bundle('web', 'cjs', pkg.exports['./web'].require), // Web - cjs
  bundle('web', 'esm', pkg.exports['./web'].import), // Web - esm
  types('web', pkg.exports['./web'].types),

  bundle('react', 'cjs', pkg.exports['./react'].require), // React - cjs
  bundle('react', 'esm', pkg.exports['./react'].import), // React - esm
  types('react', pkg.exports['./react'].types),
];
