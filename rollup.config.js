import typescript from 'rollup-plugin-typescript2'
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

/**
 * to be updated
 * cc @jared
 */
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'iife',
      name: 'flatfileImporter',
      global: 'flatfileImporter'
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve({
      browser: true
    }),
    typescript({
      tsconfig: 'tsconfig.prod.json'
    })
  ]
}