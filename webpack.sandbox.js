const { merge } = require('webpack-merge')
const base = require('./webpack.base.js')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(base, {
  mode: 'production',
  devtool: false,
  entry: './__sandbox__/index.tsx',
  output: {
    path: __dirname + '/__sandbox__/dist',
    publicPath: '/',
    filename: 'index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./public/index.html'),
    }),
  ],
})
