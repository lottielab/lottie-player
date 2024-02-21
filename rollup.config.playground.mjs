import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: 'build/playground/react/index.js',
    output: {
      file: 'playground/react/dist/build.min.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
        preventAssignment: true
      }),
      commonjs(),
    ],
  },
];
