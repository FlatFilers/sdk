const { merge } = require('webpack-merge')
const path = require('path')
const base = require('./webpack.base.js')

module.exports = merge(base, {
  mode: 'production',
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
})
