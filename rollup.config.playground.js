import jsx from 'acorn-jsx';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'playground/react/index.tsx',
    output: {
      file: 'playground/react/dist/build.min.js',
      format: 'iife',
    },
    acornInjectPlugins: [jsx()],
    plugins: [
      resolve(),
      typescript(),
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
        preventAssignment: true
      }),
      commonjs(),
      terser()
    ],
  },
];
