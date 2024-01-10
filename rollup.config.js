import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/web/index.ts',
    output: {
      file: 'dist/player-web.min.js',
      format: 'iife',
      name: 'LottieComponent',
    },
    plugins: [resolve(), typescript(), commonjs(), terser()],
  },
  {
    input: 'src/react/index.tsx',
    output: {
      file: 'dist/player-react.min.js',
      format: 'iife',
      name: 'LottieComponent',
    },
    plugins: [resolve(), typescript(), commonjs(), terser()],
  },
  {
    input: 'dist/player-web.min.js',
    output: {
      file: 'dist/player.min.js',
    },
  },
];
